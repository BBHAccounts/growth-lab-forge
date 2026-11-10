CREATE TABLE public.book_reminder_coordinators (
 program_id uuid NOT NULL REFERENCES public.programs(id),
 user_id uuid NOT NULL,
 assigned_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (program_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_reminder_coordinators TO authenticated;
GRANT ALL ON public.book_reminder_coordinators TO service_role;
ALTER TABLE public.book_reminder_coordinators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage reminder coordinators" ON public.book_reminder_coordinators FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin') AND assigned_by = auth.uid() AND EXISTS (SELECT 1 FROM public.programs p WHERE p.id = program_id AND p.is_book));
CREATE POLICY "Coordinators see own assignments" ON public.book_reminder_coordinators FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE FUNCTION public.book_reminder_programmes() RETURNS TABLE(id uuid, name text, join_code text, chapter_dates jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT p.id, p.name, p.join_code,
 COALESCE((SELECT jsonb_object_agg(pm.order_index::text, pm.deadline) FROM public.program_models pm WHERE pm.program_id = p.id), '{}'::jsonb)
 FROM public.programs p WHERE p.is_book AND auth.uid() IS NOT NULL AND
 (public.has_role(auth.uid(), 'admin') OR (p.status = 'active' AND EXISTS (SELECT 1 FROM public.book_reminder_coordinators c WHERE c.program_id = p.id AND c.user_id = auth.uid())))
 ORDER BY p.name;
$$;
REVOKE ALL ON FUNCTION public.book_reminder_programmes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_reminder_programmes() TO authenticated, service_role;