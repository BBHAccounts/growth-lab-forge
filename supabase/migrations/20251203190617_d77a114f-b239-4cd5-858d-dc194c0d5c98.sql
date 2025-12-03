-- Add likes_count column to resources table
ALTER TABLE public.resources ADD COLUMN likes_count integer DEFAULT 0;

-- Update the update_likes_count trigger function to handle resources
CREATE OR REPLACE FUNCTION public.update_likes_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'model' THEN
      UPDATE public.models SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'vendor' THEN
      UPDATE public.vendors SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'resource' THEN
      UPDATE public.resources SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.target_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'model' THEN
      UPDATE public.models SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'vendor' THEN
      UPDATE public.vendors SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'resource' THEN
      UPDATE public.resources SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.target_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;