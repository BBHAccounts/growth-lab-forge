import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  name?: string;
  program_name: string;
  access_code: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, name, program_name, access_code }: InviteRequest = await req.json();

    if (!email || !program_name || !access_code) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const programLink = `${supabaseUrl?.replace('.supabase.co', '.lovable.app')}/program/${access_code}`;
    
    // Fallback to a generic domain if needed
    const finalLink = programLink.includes('lovable.app') 
      ? programLink 
      : `https://growth-lab-forge.lovable.app/program/${access_code}`;

    const greeting = name ? `Hi ${name},` : "Hi,";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>You're Invited to Complete Pre-Work</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">Growth Lab</h1>
          </div>
          
          <div style="padding: 0 20px;">
            <p style="font-size: 16px;">${greeting}</p>
            
            <p style="font-size: 16px;">You've been invited to complete a pre-work assignment for:</p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #4f46e5; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <h2 style="margin: 0; color: #1a1a2e; font-size: 18px;">${program_name}</h2>
            </div>
            
            <p style="font-size: 16px;">Click the button below to get started:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${finalLink}" style="background: #4f46e5; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Start Assignment
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              Or copy this link: <a href="${finalLink}" style="color: #4f46e5;">${finalLink}</a>
            </p>
            
            <p style="font-size: 14px; color: #666;">
              Your access code: <strong>${access_code}</strong>
            </p>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="font-size: 12px; color: #999;">
              © 2025 Beyond Billable Hours. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Growth Lab <noreply@updates.beyondbillablehours.com>",
        to: [email],
        subject: `Complete Your Pre-Work: ${program_name}`,
        html: emailHtml,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend error:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: result }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending invite:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
