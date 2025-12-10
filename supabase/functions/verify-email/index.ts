import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyEmailRequest {
  token: string;
  password?: string; // For invited users setting their password
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, password }: VerifyEmailRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Verifying token:", token);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find the token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("email_verification_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .maybeSingle();

    if (tokenError) {
      console.error("Token lookup error:", tokenError);
      return new Response(
        JSON.stringify({ error: "Failed to verify token" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!tokenData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired verification link" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Verification link has expired. Please request a new invitation." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user info to check if they were invited (never signed in)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(tokenData.user_id);

    if (authError || !authUser.user) {
      console.error("User lookup error:", authError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const isInvitedUser = !authUser.user.last_sign_in_at;

    // If invited user and no password provided, return needs_password flag
    if (isInvitedUser && !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          needs_password: true,
          user_email: authUser.user.email,
          message: "Please set a password to complete your account setup" 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // If invited user with password, update their password
    if (isInvitedUser && password) {
      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        tokenData.user_id,
        { password }
      );

      if (updateError) {
        console.error("Password update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to set password" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log("Password set for invited user:", tokenData.user_id);
    }

    // Mark token as used
    await supabaseAdmin
      .from("email_verification_tokens")
      .update({ used: true })
      .eq("id", tokenData.id);

    // Update the user's profile to mark email as verified
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ email_verified: true })
      .eq("user_id", tokenData.user_id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to verify email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email verified successfully for user:", tokenData.user_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isInvitedUser ? "Account setup complete" : "Email verified successfully" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
