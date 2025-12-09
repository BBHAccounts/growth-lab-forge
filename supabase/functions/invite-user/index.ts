import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Create client with user's token to verify they're an admin
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

    // Check if user is admin
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

    // Parse request body
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

    // Use provided redirect URL or fall back to default
    const redirectTo = redirect_url || "https://982c5ea6-f07a-4735-a49d-353dfa51e794.lovable.app/auth";

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Invite the user
    console.log(`Inviting user: ${email} with redirect to: ${redirectTo}`);
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: full_name || "",
      },
      redirectTo: redirectTo,
    });

    if (inviteError) {
      console.error("Invite error:", inviteError);
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = inviteData.user.id;
    console.log(`User invited with ID: ${newUserId}`);

    // Update the profile with additional information
    // The profile is auto-created by the trigger, so we update it
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
      })
      .eq("user_id", newUserId);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Don't fail the whole operation, profile can be updated later
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
        // Don't fail the whole operation
      }
    }

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
