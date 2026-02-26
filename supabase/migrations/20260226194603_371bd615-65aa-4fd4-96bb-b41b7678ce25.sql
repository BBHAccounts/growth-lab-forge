-- Auto-link program participants when a user signs up by matching email
CREATE OR REPLACE FUNCTION public.link_program_participants_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.program_participants
  SET user_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email)
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_link_programs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_program_participants_on_signup();

-- Allow broader access for program participants (needed for anonymous program access)
DROP POLICY IF EXISTS "Participants can view their own record" ON public.program_participants;
DROP POLICY IF EXISTS "Participants can update their own record" ON public.program_participants;

CREATE POLICY "Anyone can view participants"
  ON public.program_participants
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update participants"
  ON public.program_participants
  FOR UPDATE
  TO anon, authenticated
  USING (true);