import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      modelId,
      fieldLabel,
      stepTitle,
      stepInstruction,
      currentValue,
      allProgress,
      messages,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch model info and global prompt
    let modelName = "";
    let modelPrompt = "";
    let globalPrompt = "";

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const [modelRes, settingRes] = await Promise.all([
        supabase
          .from("models")
          .select("name, ai_assistant_prompt")
          .eq("id", modelId)
          .single(),
        supabase
          .from("platform_settings")
          .select("value")
          .eq("key", "ai_assistant_global_prompt")
          .single(),
      ]);

      if (modelRes.data) {
        modelName = modelRes.data.name;
        modelPrompt = modelRes.data.ai_assistant_prompt || "";
      }

      if (settingRes.data?.value) {
        const val = settingRes.data.value;
        globalPrompt =
          typeof val === "string"
            ? val.replace(/^"|"$/g, "")
            : JSON.stringify(val);
      }
    }

    // Build a summary of the user's progress across all steps for cross-referencing
    let progressSummary = "";
    if (allProgress && typeof allProgress === "object") {
      const entries = Object.entries(allProgress).filter(
        ([_, v]) => v !== null && v !== undefined && v !== ""
      );
      if (entries.length > 0) {
        progressSummary = entries
          .map(([key, value]) => {
            const displayValue =
              typeof value === "object" ? JSON.stringify(value) : String(value);
            return `- ${key}: ${displayValue}`;
          })
          .join("\n");
      }
    }

    const systemPrompt = `You are a strategic coaching assistant for "${modelName || "this model"}". Your role is to help the user think through their answers — never write the answer for them.

RULES:
- Give 1-2 concrete, relevant examples when helpful
- Ask probing questions to push deeper thinking
- Suggest angles, frameworks, or perspectives the user might not have considered
- Reference the user's other answers (provided below) to make cross-connections between steps
- Keep responses to 2-3 short paragraphs max
- Be encouraging but challenge weak thinking
- NEVER write the user's final answer for them
- If the field is empty, help them get started with thought-provoking questions
- If the field has content, suggest how to strengthen or deepen it

${globalPrompt ? `ADDITIONAL COACHING GUIDELINES:\n${globalPrompt}\n` : ""}
${modelPrompt ? `MODEL-SPECIFIC CONTEXT:\n${modelPrompt}\n` : ""}
${
  progressSummary
    ? `USER'S CURRENT PROGRESS ACROSS ALL FIELDS (use for cross-referencing):\n${progressSummary}\n`
    : ""
}
CURRENT CONTEXT:
- Step: ${stepTitle || "Unknown"}
- Step instruction: ${stepInstruction || "None"}
- Field: ${fieldLabel || "Unknown"}
- Current value: ${currentValue || "(empty)"}`;

    const chatMessages = messages && messages.length > 0 ? messages : [];

    // If no user messages, generate an initial proactive hint
    const allMessages =
      chatMessages.length === 0
        ? [
            {
              role: "user" as const,
              content: `I'm working on the field "${fieldLabel}". Can you give me a helpful hint or thought-starter?`,
            },
          ]
        : chatMessages;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...allMessages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again later.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "Service temporarily unavailable. Please try again later.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
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
    console.error("Model assistant error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
