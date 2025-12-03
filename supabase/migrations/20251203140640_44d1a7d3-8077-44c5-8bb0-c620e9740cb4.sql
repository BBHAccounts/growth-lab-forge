-- Create function to update likes count when reactions change
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'model' THEN
      UPDATE public.models SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'vendor' THEN
      UPDATE public.vendors SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.target_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'model' THEN
      UPDATE public.models SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'vendor' THEN
      UPDATE public.vendors SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.target_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger on reactions table
CREATE TRIGGER update_likes_count_trigger
AFTER INSERT OR DELETE ON public.reactions
FOR EACH ROW
EXECUTE FUNCTION public.update_likes_count();