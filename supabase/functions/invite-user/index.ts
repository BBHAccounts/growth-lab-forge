import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
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
    const {
      email,
      full_name,
      role_title,
      firm_name,
      firm_region,
      firm_size,
      is_admin,
      is_client,
      research_contributor,
      redirect_url,
    } = body;

    const baseUrl = redirect_url || "https://growthlab.beyondbillablehours.io";

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      if (body.resend_invite) {
        // Resend invite for existing user
        console.log(`Resending invite for existing user: ${email}`);
        
        // Generate new verification token
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const { error: tokenError } = await adminClient
          .from("email_verification_tokens")
          .insert({
            user_id: existingUser.id,
            token,
            expires_at: expiresAt.toISOString(),
          });

        if (tokenError) {
          console.error("Error storing token:", tokenError);
          throw new Error("Failed to generate verification token");
        }

        const verificationUrl = `${baseUrl}/email-verified?token=${token}`;

        // Send custom invite email
        await sendInviteEmail(email, full_name || existingUser.user_metadata?.full_name, verificationUrl, true);

        return new Response(
          JSON.stringify({ success: true, userId: existingUser.id, resent: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const hasSignedIn = !!existingUser.last_sign_in_at;
      const status = hasSignedIn ? 'active' : (existingUser.invited_at && !existingUser.email_confirmed_at ? 'invited' : 'unconfirmed');
      
      return new Response(
        JSON.stringify({ 
          error: "user_exists",
          message: `A user with email ${email} already exists.`,
          user_id: existingUser.id,
          status: status,
          can_resend: !hasSignedIn
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user with a temporary password (they'll set their own via the invite link)
    const tempPassword = crypto.randomUUID() + crypto.randomUUID();
    
    console.log(`Creating user: ${email}`);
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false, // Don't auto-confirm
      user_metadata: {
        full_name: full_name || "",
      },
    });

    if (createError) {
      console.error("Create user error:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = createData.user.id;
    console.log(`User created with ID: ${newUserId}`);

    // Generate verification token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { error: tokenError } = await adminClient
      .from("email_verification_tokens")
      .insert({
        user_id: newUserId,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Error storing token:", tokenError);
    }

    // Update profile with additional information
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        full_name: full_name || null,
        role_title: role_title || null,
        firm_name: firm_name || null,
        firm_region: firm_region || null,
        firm_size: firm_size || null,
        is_client: is_client || false,
        research_contributor: research_contributor || false,
        email_verified: false,
      })
      .eq("user_id", newUserId);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // If admin flag is set, add admin role
    if (is_admin) {
      console.log(`Adding admin role for user: ${newUserId}`);
      const { error: roleError } = await adminClient
        .from("user_roles")
        .insert({
          user_id: newUserId,
          role: "admin",
        });

      if (roleError) {
        console.error("Role insert error:", roleError);
      }
    }

    // Send custom branded invite email
    const verificationUrl = `${baseUrl}/email-verified?token=${token}`;
    await sendInviteEmail(email, full_name, verificationUrl, false);

    return new Response(
      JSON.stringify({ success: true, userId: newUserId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in invite-user function:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function sendInviteEmail(email: string, name: string | undefined, verificationUrl: string, isResend: boolean) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const subject = isResend ? "Your Growth Lab Invitation (Reminder)" : "You're Invited to Growth Lab";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0;">
            You're Invited to Growth Lab
          </h1>
          <p style="color: #ECCE45; font-size: 14px; margin-top: 8px; font-weight: 500;">
            by Beyond Billable Hours
          </p>
        </div>
        
        <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
          ${greeting}
        </p>
        
        <p style="color: #555; font-size: 16px; margin-bottom: 30px;">
          You've been invited to join Growth Lab – your gateway to strategic frameworks and tools for legal business development. Click the button below to set up your account and get started.
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${verificationUrl}" style="background-color: #ECCE45; color: #1a1a1a; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(236, 206, 69, 0.3);">
            Accept Invitation
          </a>
        </div>
        
        <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin-top: 30px;">
          <p style="color: #555; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">What you'll get access to:</p>
          <ul style="color: #666; font-size: 14px; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Interactive business development models</li>
            <li style="margin-bottom: 8px;">Legal martech landscape insights</li>
            <li style="margin-bottom: 8px;">Exclusive research and resources</li>
          </ul>
        </div>
        
        <p style="color: #888; font-size: 13px; text-align: center; margin-top: 30px;">
          This invitation link will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
      
      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
        © ${new Date().getFullYear()} Growth Lab by Beyond Billable Hours<br>
        Strategic frameworks and tools for legal business development
      </p>
    </body>
    </html>
  `;

  const { error: emailError } = await resend.emails.send({
    from: "Growth Lab <notifications@growthlab.beyondbillablehours.io>",
    to: [email],
    subject,
    html: htmlContent,
  });

  if (emailError) {
    console.error("Error sending invite email:", emailError);
    throw new Error(`Failed to send invite email: ${emailError.message}`);
  }

  console.log(`Invite email sent successfully to: ${email}`);
}
