CREATE OR REPLACE FUNCTION public.book_programme_progress(programme_id uuid)
RETURNS TABLE (participant_id uuid, name text, email text, joined_at timestamptz, last_active timestamptz, steps_done integer, current_chapter integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.programs p WHERE p.id = programme_id AND p.is_book) THEN
    RAISE EXCEPTION 'Book programme not found' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
  WITH chapter_steps AS (
    SELECT pm.order_index, step->>'id' AS step_id
    FROM public.program_models pm JOIN public.models m ON m.id = pm.model_id
    CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(m.steps) = 'array' THEN m.steps ELSE '[]'::jsonb END) step
    WHERE pm.program_id = programme_id AND step->>'id' IS NOT NULL
  ), participant_done AS (
    SELECT DISTINCT r.participant_id, entry.key AS step_id
    FROM public.program_responses r JOIN public.program_participants pp ON pp.id = r.participant_id
    CROSS JOIN LATERAL jsonb_each(CASE WHEN jsonb_typeof(r.responses->'__done') = 'object' THEN r.responses->'__done' ELSE '{}'::jsonb END) entry
    WHERE pp.program_id = programme_id AND jsonb_typeof(entry.value) = 'string'
      AND pg_input_is_valid(entry.value #>> '{}', 'timestamp with time zone')
      AND isfinite(CASE WHEN pg_input_is_valid(entry.value #>> '{}', 'timestamp with time zone') THEN (entry.value #>> '{}')::timestamptz ELSE NULL END)
  )
  SELECT pp.id, pp.name, pp.email, pp.created_at,
    (SELECT max(r.auto_saved_at) FROM public.program_responses r WHERE r.participant_id = pp.id),
    (SELECT count(DISTINCT cs.step_id)::integer FROM chapter_steps cs JOIN participant_done d ON d.step_id = cs.step_id AND d.participant_id = pp.id),
    (SELECT min(pm.order_index)::integer FROM public.program_models pm WHERE pm.program_id = programme_id AND (
      (SELECT count(*) FROM chapter_steps cs WHERE cs.order_index = pm.order_index) <> 3 OR
      (SELECT count(*) FROM chapter_steps cs JOIN participant_done d ON d.step_id = cs.step_id AND d.participant_id = pp.id WHERE cs.order_index = pm.order_index) <> 3
    ))
  FROM public.program_participants pp WHERE pp.program_id = programme_id
  ORDER BY pp.created_at;
END;
$function$;
REVOKE ALL ON FUNCTION public.book_programme_progress(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_programme_progress(uuid) TO authenticated;
COMMENT ON FUNCTION public.book_programme_progress(uuid) IS 'Admin-only book participant progress. Returns no response JSON or note text. Current chapter is the first incomplete chapter; NULL means all chapters complete.';