import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Extracting metadata for URL:", url);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch the URL content first
    let pageContent = "";
    try {
      const pageResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MetadataBot/1.0)",
        },
      });
      if (pageResponse.ok) {
        const html = await pageResponse.text();
        // Extract text content (simplified)
        pageContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .substring(0, 5000);
      }
    } catch (fetchError) {
      console.log("Could not fetch page content:", fetchError);
    }

    // Extract og:image or other image meta tags from HTML
    let extractedImageUrl: string | null = null;
    if (pageContent) {
      // Try to get the original HTML for image extraction
      try {
        const pageResponse = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; MetadataBot/1.0)",
          },
        });
        if (pageResponse.ok) {
          const html = await pageResponse.text();
          // Extract og:image
          const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                              html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
          if (ogImageMatch) {
            extractedImageUrl = ogImageMatch[1];
          }
          // Fallback to twitter:image
          if (!extractedImageUrl) {
            const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                                     html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
            if (twitterImageMatch) {
              extractedImageUrl = twitterImageMatch[1];
            }
          }
        }
      } catch (imgError) {
        console.log("Could not extract image:", imgError);
      }
    }

    const prompt = `Analyze this URL and extract metadata. URL: ${url}

${pageContent ? `Page content preview: ${pageContent}` : "Could not fetch page content, analyze based on URL only."}

Extract and return a JSON object with these fields:
- title: The main title of the content (string)
- description: A brief summary of 1-2 sentences (string)
- author: The author if identifiable (string or null)
- type: One of "article", "webinar", "guide", "video", "podcast", "event" based on content type (string)
- estimated_time: Reading/watching time in minutes as a number (number or null)

Return ONLY valid JSON, no other text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a metadata extraction assistant. Always respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
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
        return new Response(JSON.stringify({ error: "API credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("AI response:", content);

    // Parse JSON from response
    let metadata;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        metadata = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      metadata = {
        title: null,
        description: null,
        author: null,
        type: "article",
        estimated_time: null,
      };
    }

    // Add extracted image to metadata
    metadata.image_url = extractedImageUrl;

    return new Response(JSON.stringify(metadata), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in extract-url-metadata:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
