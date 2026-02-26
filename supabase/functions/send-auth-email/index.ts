import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailRequest {
  email: string;
  type: "signup" | "recovery" | "magiclink" | "signup_magiclink";
  user_id?: string;
  full_name?: string;
  redirect_to?: string;
  site_url?: string;
}

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0;">Growth Lab</h1>
      <p style="color: #ECCE45; font-size: 14px; margin-top: 8px; font-weight: 500;">by Beyond Billable Hours</p>
    </div>
    ${content}
  </div>
  <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
    © ${new Date().getFullYear()} Growth Lab by Beyond Billable Hours<br>
    Strategic frameworks and tools for legal business development
  </p>
</body>
</html>`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AuthEmailRequest = await req.json();
    const { email, type, user_id, site_url, redirect_to } = payload;

    console.log(`Processing ${type} email for: ${email}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const baseUrl = site_url || redirect_to || "https://growthlab.beyondbillablehours.io";
    let subject = "";
    let htmlContent = "";
    let resolvedType = type;

    // Auto-detect: check if user exists, then route to magiclink or signup_magiclink
    if (type === "auto") {
      const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = userData?.users?.find(u => u.email === email);
      resolvedType = existingUser ? "magiclink" : "signup_magiclink";
      console.log(`Auto-detected type: ${resolvedType} for ${email}`);
    }

    if (resolvedType === "magiclink") {
      // Generate magic link for existing user
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: baseUrl }
      });

      if (linkError) {
        console.error("Error generating magic link:", linkError);
        if (linkError.message?.includes('not found') || linkError.message?.includes('User not found')) {
          return new Response(
            JSON.stringify({ error: "No account found with this email. Please create an account first." }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        throw linkError;
      }

      const actionLink = linkData.properties.action_link;
      subject = "Sign in to Growth Lab";
      htmlContent = emailWrapper(`
        <p style="color: #555; font-size: 16px; text-align: center; margin-bottom: 30px;">
          Click the button below to sign in to your Growth Lab account. This link expires in 1 hour.
        </p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${actionLink}" style="background-color: #ECCE45; color: #1a1a1a; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(236, 206, 69, 0.3);">
            Sign In to Growth Lab
          </a>
        </div>
        <p style="color: #888; font-size: 13px; text-align: center; margin-top: 30px;">
          If you didn't request this link, you can safely ignore this email.
        </p>
      `);

    } else if (resolvedType === "signup_magiclink") {
      // Create new user and send magic link
      const fullName = payload.full_name || "";

      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (createError) {
        console.error("Error creating user:", createError);
        if (createError.message?.includes('already') || createError.message?.includes('duplicate')) {
          return new Response(
            JSON.stringify({ error: "An account with this email already exists. Please sign in instead." }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        throw createError;
      }

      // Update profile email_verified
      if (createData.user) {
        await supabaseAdmin
          .from('profiles')
          .update({ email_verified: true })
          .eq('user_id', createData.user.id);
      }

      // Generate magic link
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: baseUrl }
      });

      if (linkError) throw linkError;

      const actionLink = linkData.properties.action_link;
      subject = "Welcome to Growth Lab — Sign In";
      htmlContent = emailWrapper(`
        <p style="color: #555; font-size: 16px; text-align: center; margin-bottom: 10px;">
          Welcome to Growth Lab${fullName ? `, ${fullName.split(' ')[0]}` : ''}! 🎉
        </p>
        <p style="color: #555; font-size: 16px; text-align: center; margin-bottom: 30px;">
          Your account has been created. Click below to sign in and start exploring strategic frameworks for legal business development.
        </p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${actionLink}" style="background-color: #ECCE45; color: #1a1a1a; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(236, 206, 69, 0.3);">
            Sign In to Growth Lab
          </a>
        </div>
        <p style="color: #888; font-size: 13px; text-align: center; margin-top: 30px;">
          This link expires in 1 hour. If you didn't create an account with Growth Lab, you can safely ignore this email.
        </p>
      `);

    } else if (type === "signup" && user_id) {
      // Legacy signup verification flow
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const { error: tokenError } = await supabaseAdmin
        .from("email_verification_tokens")
        .insert({ user_id, token, expires_at: expiresAt.toISOString() });

      if (tokenError) throw new Error("Failed to generate verification token");

      const verificationUrl = `${baseUrl}/email-verified?token=${token}`;
      subject = "Confirm your Growth Lab account";
      htmlContent = emailWrapper(`
        <p style="color: #555; font-size: 16px; text-align: center; margin-bottom: 30px;">
          Thanks for signing up! Please confirm your email address to get started with strategic frameworks and tools for legal business development.
        </p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${verificationUrl}" style="background-color: #ECCE45; color: #1a1a1a; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(236, 206, 69, 0.3);">
            Verify Email Address
          </a>
        </div>
        <p style="color: #888; font-size: 13px; text-align: center; margin-top: 30px;">
          This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
      `);

    } else if (type === "recovery") {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      if (userError) throw userError;

      const user = userData.users.find(u => u.email === email);
      if (!user) {
        console.log("No user found for email, returning success anyway");
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);

      const { error: tokenError } = await supabaseAdmin
        .from("email_verification_tokens")
        .insert({ user_id: user.id, token, expires_at: expiresAt.toISOString() });

      if (tokenError) throw new Error("Failed to generate reset token");

      const verificationUrl = `${baseUrl}/reset-password?token=${token}`;
      subject = "Reset your Growth Lab password";
      htmlContent = emailWrapper(`
        <p style="color: #555; font-size: 16px; text-align: center; margin-bottom: 30px;">
          We received a request to reset your password. Click the button below to choose a new password.
        </p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${verificationUrl}" style="background-color: #ECCE45; color: #1a1a1a; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(236, 206, 69, 0.3);">
            Reset Password
          </a>
        </div>
        <p style="color: #888; font-size: 13px; text-align: center; margin-top: 30px;">
          This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
      `);
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid email request" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send the email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Growth Lab <notifications@growthlab.beyondbillablehours.io>",
      to: [email],
      subject,
      html: htmlContent,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({ error: emailError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, data: emailData }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
