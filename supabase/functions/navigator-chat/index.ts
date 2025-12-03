import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_NAVIGATION = `
You are a helpful Growth Lab assistant. Help users navigate the platform and find what they need.

Available sections in the app:
1. **Toolbox** (/models) - Interactive strategic frameworks to help plan, position, and grow law practices. Users can browse models, activate them, and work through steps.
2. **Research Lab** (/research) - Participate in research studies and unlock rewards by contributing to industry insights.
3. **Martech Map** (/martech) - Explore legal marketing technology vendors. Users can filter by category, region, firm size, and follow/like vendors they're interested in.
4. **Game of Life** (/game-of-life) - An interactive experience for users.
5. **Account** (/account) - Manage profile settings, view progress, and update personal information.
6. **About** (/about) - Learn more about Growth Lab and its mission.

Future sections (mention these exist but are "coming soon"):
- **Experts** - Connect with industry experts (coming soon)
- **Community** - Connect with peers (coming soon)

Guidelines:
- Be friendly, concise, and helpful
- When users ask about features, briefly explain and suggest they visit the relevant section
- If users seem lost, ask what they're trying to accomplish
- Format navigation suggestions clearly
- Use emojis sparingly to match the app's friendly tone
- Keep responses brief (2-3 sentences max unless they ask for more detail)
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: APP_NAVIGATION },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Navigator chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
