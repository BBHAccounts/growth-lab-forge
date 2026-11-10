CREATE OR REPLACE FUNCTION public.can_access_book_model(model_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.models m WHERE m.id = model_id AND (
      (public.is_book_participant() AND m.status = 'active') OR EXISTS (
        SELECT 1 FROM public.program_models pm WHERE pm.model_id = m.id AND public.is_book_participant(pm.program_id)
      ) OR EXISTS (
        SELECT 1 FROM public.programs p WHERE p.model_id = m.id AND public.is_book_participant(p.id)
      )
    )
  );
$function$;