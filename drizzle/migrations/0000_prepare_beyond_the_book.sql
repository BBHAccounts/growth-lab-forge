ALTER TABLE public.programs ADD COLUMN is_book boolean NOT NULL DEFAULT false, ADD COLUMN join_code text;
CREATE UNIQUE INDEX programs_join_code_ci_unique ON public.programs (lower(join_code)) WHERE join_code IS NOT NULL;

CREATE OR REPLACE FUNCTION public.is_book_programme(programme_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.programs WHERE id = programme_id AND is_book); $$;
REVOKE ALL ON FUNCTION public.is_book_programme(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_book_programme(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_book_participant(programme_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.program_participants pp JOIN public.programs p ON p.id = pp.program_id
    WHERE pp.user_id = auth.uid() AND p.is_book AND p.status = 'active'
      AND (programme_id IS NULL OR p.id = programme_id)
  );
$$;
REVOKE ALL ON FUNCTION public.is_book_participant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_book_participant(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.can_access_book_model(model_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.models m WHERE m.id = model_id AND (
      (public.is_book_participant() AND EXISTS (
        SELECT 1 FROM unnest(m.tags) tag WHERE tag ~ '^book-ch([1-9]|1[0-5])$'
      )) OR EXISTS (
        SELECT 1 FROM public.program_models pm WHERE pm.model_id = m.id AND public.is_book_participant(pm.program_id)
      ) OR EXISTS (
        SELECT 1 FROM public.programs p WHERE p.model_id = m.id AND public.is_book_participant(p.id)
      )
    )
  );
$$;
REVOKE ALL ON FUNCTION public.can_access_book_model(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_book_model(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.join_book_programme(code text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_programme_id uuid;
  v_access_code text;
  v_email text;
  v_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Please sign in before joining a book programme.' USING ERRCODE = '28000';
  END IF;
  SELECT p.id INTO v_programme_id FROM public.programs p
    WHERE p.is_book AND p.status = 'active' AND lower(p.join_code) = lower(code)
    FOR UPDATE;
  IF v_programme_id IS NULL THEN
    RAISE EXCEPTION 'This code cannot be used to join a book programme.' USING ERRCODE = '22023';
  END IF;
  SELECT pp.access_code INTO v_access_code FROM public.program_participants pp
    WHERE pp.program_id = v_programme_id AND pp.user_id = v_user_id
    ORDER BY pp.created_at LIMIT 1;
  IF v_access_code IS NOT NULL THEN RETURN v_access_code; END IF;
  SELECT p.email, p.full_name INTO v_email, v_name FROM public.profiles p WHERE p.user_id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Please complete your profile before joining a book programme.' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.program_participants (program_id, user_id, email, name, access_code, status)
    VALUES (v_programme_id, v_user_id, v_email, v_name, gen_random_uuid()::text, 'active')
    RETURNING access_code INTO v_access_code;
  RETURN v_access_code;
END;
$$;
REVOKE ALL ON FUNCTION public.join_book_programme(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_book_programme(text) TO authenticated;

-- Restrict only book rows; existing non-book programme policies keep working.
CREATE POLICY "Book programmes are private to participants" ON public.programs AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING (NOT is_book OR public.has_role(auth.uid(), 'admin') OR public.is_book_participant(id));
CREATE POLICY "Book model links are private to participants" ON public.program_models AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING (NOT public.is_book_programme(program_id) OR public.has_role(auth.uid(), 'admin') OR public.is_book_participant(program_id));
CREATE POLICY "Book participants are private" ON public.program_participants AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING (NOT public.is_book_programme(program_id) OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins edit book participants" ON public.program_participants AS RESTRICTIVE FOR UPDATE TO anon, authenticated
USING (NOT public.is_book_programme(program_id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (NOT public.is_book_programme(program_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Book chapters require programme access" ON public.models AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING (NOT ('beyond-the-book' = ANY(COALESCE(tags, '{}'::text[]))) OR public.has_role(auth.uid(), 'admin') OR public.can_access_book_model(id));
CREATE POLICY "Book participants can read linked models" ON public.models FOR SELECT TO authenticated
USING (public.can_access_book_model(id));
CREATE POLICY "Book notes are private to their author" ON public.program_responses AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.program_participants pp WHERE pp.id = participant_id AND (NOT public.is_book_programme(pp.program_id) OR pp.user_id = auth.uid())));

CREATE POLICY "Book media is readable by participants and admins" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'book-media' AND (public.has_role(auth.uid(), 'admin') OR public.is_book_participant()));
CREATE POLICY "Admins upload book media" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'book-media' AND public.has_role(auth.uid(), 'admin') AND (storage.foldername(name))[1] IN ('videos', 'posters'));
CREATE POLICY "Admins update book media" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'book-media' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'book-media' AND public.has_role(auth.uid(), 'admin') AND (storage.foldername(name))[1] IN ('videos', 'posters'));
CREATE POLICY "Admins delete book media" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'book-media' AND public.has_role(auth.uid(), 'admin'));