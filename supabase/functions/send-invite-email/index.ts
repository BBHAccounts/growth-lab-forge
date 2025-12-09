import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: isAdmin } = await userClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { email, full_name, redirect_url, user_id } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Generate an invite link
    console.log(`Generating invite link for: ${email}`);
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "invite",
      email: email,
      options: {
        redirectTo: redirect_url || "https://982c5ea6-f07a-4735-a49d-353dfa51e794.lovable.app/auth",
      },
    });

    if (linkError) {
      console.error("Generate link error:", linkError);
      throw new Error(linkError.message);
    }

    // Get the magic link URL
    const inviteUrl = linkData.properties?.action_link;
    if (!inviteUrl) {
      throw new Error("Failed to generate invite link");
    }

    console.log(`Sending invite email to: ${email}`);

    // Send the custom email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Growth Lab <onboarding@resend.dev>",
      to: [email],
      subject: "You're invited to Growth Lab",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #18181b 0%, #27272a 100%); border-radius: 12px 12px 0 0;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #fbbf24;">Growth Lab</h1>
                        <p style="margin: 8px 0 0; font-size: 14px; color: #a1a1aa;">Strategic frameworks for legal business development</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 32px 40px;">
                        <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #18181b;">
                          ${full_name ? `Hello ${full_name},` : "Hello,"}
                        </h2>
                        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
                          You've been invited to join Growth Lab — a platform featuring interactive business models, martech insights, and exclusive research for legal professionals.
                        </p>
                        
                        <!-- CTA Button -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="padding: 8px 0 24px;">
                              <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; background-color: #fbbf24; color: #18181b; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                                Accept Invitation
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.5; color: #71717a;">
                          This link will expire in 24 hours. If you didn't expect this invitation, you can safely ignore this email.
                        </p>
                        
                        <!-- Link fallback -->
                        <p style="margin: 0; font-size: 12px; color: #a1a1aa; word-break: break-all;">
                          If the button doesn't work, copy and paste this URL into your browser:<br>
                          <a href="${inviteUrl}" style="color: #fbbf24;">${inviteUrl}</a>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                        <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                          Growth Lab by Beyond Billable Hours
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      throw new Error(emailError.message);
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-invite-email:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
