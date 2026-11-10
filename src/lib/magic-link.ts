import { supabase } from "@/integrations/supabase/client";

export async function sendMagicLink(email: string, emailRedirectTo = window.location.origin) {
  return supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo } });
}