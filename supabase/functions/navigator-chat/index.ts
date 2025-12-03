import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
4. **Account** (/account) - Manage profile settings, view progress, and update personal information.
5. **About** (/about) - Learn more about Growth Lab and its mission.

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
- When making recommendations, use the user's profile and topics data to personalize suggestions
- Never invent new topics or tags - only reference content from the provided context
- Justify recommendations based on user characteristics when appropriate
`;

interface UserProfile {
  seniority: string | null;
  role_title: string | null;
  firm_size: string | null;
  firm_type: string | null;
  interest_areas: string[];
  international_scope: boolean;
  growth_maturity_level: number;
  data_maturity_level: number;
}

interface Topic {
  id: string;
  name: string;
  description: string | null;
  recommended_seniority: string[];
  recommended_roles: string[];
  recommended_firm_sizes: string[];
  recommended_firm_types: string[];
  interest_area_keywords: string[];
  national_or_international: string[];
  min_growth_maturity: number;
  max_growth_maturity: number;
  min_data_maturity: number;
  max_data_maturity: number;
}

function scoreTopicForUser(topic: Topic, profile: UserProfile): number {
  let score = 0;

  const userInterests = profile.interest_areas || [];
  const topicKeywords = topic.interest_area_keywords || [];
  for (const interest of userInterests) {
    if (topicKeywords.some((k) => k.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(k.toLowerCase()))) {
      score += 4;
    }
  }

  if (profile.role_title && topic.recommended_roles.includes(profile.role_title)) {
    score += 3;
  }

  if (profile.seniority && topic.recommended_seniority.includes(profile.seniority)) {
    score += 2;
  }

  if (profile.firm_size && topic.recommended_firm_sizes.includes(profile.firm_size)) {
    score += 2;
  }

  if (profile.firm_type && topic.recommended_firm_types.includes(profile.firm_type)) {
    score += 2;
  }

  const userScope = profile.international_scope ? 'international' : 'national';
  if (topic.national_or_international.includes(userScope)) {
    score += 1;
  }

  const growthLevel = profile.growth_maturity_level || 1;
  if (growthLevel >= topic.min_growth_maturity && growthLevel <= topic.max_growth_maturity) {
    score += 2;
  }

  const dataLevel = profile.data_maturity_level || 1;
  if (dataLevel >= topic.min_data_maturity && dataLevel <= topic.max_data_maturity) {
    score += 1;
  }

  return score;
}

async function getUserContext(supabase: any, userId: string) {
  try {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('seniority, role_title, firm_size, firm_type, interest_areas, international_scope, growth_maturity_level, data_maturity_level, full_name')
      .eq('user_id', userId)
      .single();

    if (!profileData) {
      return null;
    }

    const profile: UserProfile = {
      seniority: profileData.seniority,
      role_title: profileData.role_title,
      firm_size: profileData.firm_size,
      firm_type: profileData.firm_type,
      interest_areas: profileData.interest_areas || [],
      international_scope: profileData.international_scope || false,
      growth_maturity_level: profileData.growth_maturity_level || 1,
      data_maturity_level: profileData.data_maturity_level || 1,
    };

    const { data: topicsData } = await supabase.from('topics').select('*').eq('active', true);
    const topics = (topicsData || []) as Topic[];

    const scoredTopics = topics
      .map((topic) => ({ ...topic, score: scoreTopicForUser(topic, profile) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const topTopics = await Promise.all(
      scoredTopics.map(async (topic) => {
        const [models, vendors, research] = await Promise.all([
          supabase.from('topic_models').select('model_id, models(name)').eq('topic_id', topic.id),
          supabase.from('topic_vendors').select('vendor_id, vendors(name)').eq('topic_id', topic.id),
          supabase.from('topic_research').select('research_id, research_studies(title)').eq('topic_id', topic.id),
        ]);

        return {
          name: topic.name,
          description: topic.description,
          keywords: topic.interest_area_keywords,
          models: (models.data || []).map((m: any) => m.models?.name).filter(Boolean),
          vendors: (vendors.data || []).map((v: any) => v.vendors?.name).filter(Boolean),
          research: (research.data || []).map((r: any) => r.research_studies?.title).filter(Boolean),
        };
      })
    );

    return {
      userName: profileData.full_name,
      profile: {
        seniority: profile.seniority,
        role: profile.role_title,
        firmSize: profile.firm_size,
        firmType: profile.firm_type,
        interests: profile.interest_areas,
        internationalScope: profile.international_scope,
        growthMaturity: profile.growth_maturity_level,
        dataMaturity: profile.data_maturity_level,
      },
      topTopics,
    };
  } catch (error) {
    console.error('Error fetching user context:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let userContext = null;
    if (userId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      userContext = await getUserContext(supabase, userId);
    }

    let systemPrompt = APP_NAVIGATION;
    if (userContext) {
      systemPrompt += `\n\n--- USER CONTEXT ---
User Name: ${userContext.userName || 'Unknown'}
User Profile:
- Role: ${userContext.profile.role || 'Not specified'}
- Seniority: ${userContext.profile.seniority || 'Not specified'}
- Firm Size: ${userContext.profile.firmSize || 'Not specified'}
- Firm Type: ${userContext.profile.firmType || 'Not specified'}
- Interest Areas: ${userContext.profile.interests?.join(', ') || 'None specified'}
- International Scope: ${userContext.profile.internationalScope ? 'Yes' : 'No'}
- Growth Maturity Level: ${userContext.profile.growthMaturity}/5
- Data Maturity Level: ${userContext.profile.dataMaturity}/5

Top Recommended Topics for this user:
${userContext.topTopics.map((t, i) => `${i + 1}. **${t.name}**${t.description ? ` - ${t.description}` : ''}
   Keywords: ${t.keywords?.join(', ') || 'None'}
   Related Models: ${t.models.join(', ') || 'None'}
   Related Vendors: ${t.vendors.join(', ') || 'None'}
   Related Research: ${t.research.join(', ') || 'None'}`).join('\n')}

When the user asks "where to start" or for recommendations, use these topics and their linked content to suggest relevant models, vendors, or research. Personalize based on their profile.`;
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
          { role: "system", content: systemPrompt },
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
