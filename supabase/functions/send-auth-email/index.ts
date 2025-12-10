import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailRequest {
  email: string;
  type: "signup" | "recovery" | "email_change";
  token?: string;
  token_hash?: string;
  redirect_to?: string;
  site_url?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AuthEmailRequest = await req.json();
    const { email, type, token_hash, redirect_to, site_url } = payload;

    console.log(`Processing ${type} email for: ${email}`);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    // Construct the verification URL
    const baseUrl = site_url || redirect_to || "https://growthlab.beyondbillablehours.io";
    let verificationUrl = "";
    let subject = "";
    let htmlContent = "";

    if (type === "signup") {
      // For signup confirmation
      verificationUrl = `${baseUrl}/auth?token_hash=${token_hash}&type=signup`;
      subject = "Confirm your Growth Lab account";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; text-align: center; margin-bottom: 20px;">
            Welcome to Growth Lab
          </h1>
          
          <p style="color: #666; font-size: 16px; text-align: center; margin-bottom: 30px;">
            Thanks for signing up! Please confirm your email address to get started.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #ECCE45; color: #1a1a1a; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
              Confirm Email Address
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            If you didn't create an account with Growth Lab, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Growth Lab by Beyond Billable Hours<br>
            Strategic frameworks and tools for legal business development
          </p>
        </body>
        </html>
      `;
    } else if (type === "recovery") {
      // For password recovery
      verificationUrl = `${baseUrl}/auth#type=recovery&token_hash=${token_hash}`;
      subject = "Reset your Growth Lab password";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; text-align: center; margin-bottom: 20px;">
            Reset Your Password
          </h1>
          
          <p style="color: #666; font-size: 16px; text-align: center; margin-bottom: 30px;">
            We received a request to reset your password. Click the button below to choose a new password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #ECCE45; color: #1a1a1a; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Growth Lab by Beyond Billable Hours<br>
            Strategic frameworks and tools for legal business development
          </p>
        </body>
        </html>
      `;
    } else if (type === "email_change") {
      // For email change confirmation
      verificationUrl = `${baseUrl}/auth?token_hash=${token_hash}&type=email_change`;
      subject = "Confirm your new email address";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; text-align: center; margin-bottom: 20px;">
            Confirm Your New Email
          </h1>
          
          <p style="color: #666; font-size: 16px; text-align: center; margin-bottom: 30px;">
            Please confirm your new email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #ECCE45; color: #1a1a1a; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
              Confirm New Email
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Growth Lab by Beyond Billable Hours<br>
            Strategic frameworks and tools for legal business development
          </p>
        </body>
        </html>
      `;
    } else {
      console.log(`Unknown email type: ${type}`);
      return new Response(
        JSON.stringify({ error: `Unknown email type: ${type}` }),
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
