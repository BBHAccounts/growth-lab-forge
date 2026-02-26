import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function toAbsoluteUrl(url: string | null, baseUrl: string): string | null {
  if (!url) return null;
  try {
    // Already absolute
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Protocol-relative
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    // Relative URL - convert to absolute
    const base = new URL(baseUrl);
    if (url.startsWith('/')) {
      return `${base.origin}${url}`;
    }
    return `${base.origin}/${url}`;
  } catch {
    return null;
  }
}

function extractImageFromMeta(html: string, baseUrl: string): string | null {
  const metaPatterns = [
    // og:image variations
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    /<meta[^>]*property=["']og:image:url["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image:url["']/i,
    /<meta[^>]*property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image:secure_url["']/i,
    // twitter:image variations
    /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
    /<meta[^>]*name=["']twitter:image:src["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image:src["']/i,
    // Schema.org image
    /<meta[^>]*itemprop=["']image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*itemprop=["']image["']/i,
    // image_src link tag
    /<link[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']image_src["']/i,
  ];

  for (const pattern of metaPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const absoluteUrl = toAbsoluteUrl(match[1], baseUrl);
      if (absoluteUrl) {
        console.log("Found image from meta tag:", absoluteUrl);
        return absoluteUrl;
      }
    }
  }

  return null;
}

function extractImageFromContent(html: string, baseUrl: string): string | null {
  // Look for prominent images - skip small icons and tracking pixels
  const imgPatterns = [
    // Article/hero images (common class patterns)
    /<img[^>]*class=["'][^"']*(?:hero|featured|main|article|post|content|lead)[^"']*["'][^>]*src=["']([^"']+)["']/i,
    // Large images with width specified
    /<img[^>]*width=["']?(\d+)["']?[^>]*src=["']([^"']+)["']/gi,
    // First reasonable image in article/main content
    /<(?:article|main|div[^>]*class=["'][^"']*content[^"']*["'])[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i,
  ];

  // Try class-based patterns first
  const heroMatch = html.match(imgPatterns[0]);
  if (heroMatch && heroMatch[1]) {
    const url = toAbsoluteUrl(heroMatch[1], baseUrl);
    if (url) {
      console.log("Found hero/featured image:", url);
      return url;
    }
  }

  // Look for images with reasonable dimensions
  const widthPattern = /<img[^>]*(?:width=["']?(\d+)["']?[^>]*src=["']([^"']+)["']|src=["']([^"']+)["'][^>]*width=["']?(\d+)["']?)/gi;
  let match;
  while ((match = widthPattern.exec(html)) !== null) {
    const width = parseInt(match[1] || match[4], 10);
    const src = match[2] || match[3];
    if (width >= 200 && src) {
      const url = toAbsoluteUrl(src, baseUrl);
      if (url && !url.includes('icon') && !url.includes('logo') && !url.includes('avatar')) {
        console.log("Found image with good dimensions:", url);
        return url;
      }
    }
  }

  // Fallback: find first img in main content areas
  const contentMatch = html.match(imgPatterns[2]);
  if (contentMatch && contentMatch[1]) {
    const url = toAbsoluteUrl(contentMatch[1], baseUrl);
    if (url) {
      console.log("Found image in content area:", url);
      return url;
    }
  }

  return null;
}

function extractLogoOrFavicon(html: string, baseUrl: string): string | null {
  const patterns = [
    // Apple touch icon (usually high quality)
    /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
    // High-res favicon
    /<link[^>]*rel=["']icon["'][^>]*sizes=["'](?:192|180|152|144|120|96|72)[^"']*["'][^>]*href=["']([^"']+)["']/i,
    // Regular favicon
    /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const url = toAbsoluteUrl(match[1], baseUrl);
      if (url) {
        console.log("Found logo/favicon:", url);
        return url;
      }
    }
  }

  // Default favicon location
  try {
    const base = new URL(baseUrl);
    return `${base.origin}/favicon.ico`;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, topicCategories, topics } = await req.json();

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

    // Fetch the URL content
    let html = "";
    let pageContent = "";
    try {
      const pageResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      });
      if (pageResponse.ok) {
        html = await pageResponse.text();
        // Extract text content for AI analysis
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

    // Step 1: Try meta tags (most reliable)
    let extractedImageUrl = extractImageFromMeta(html, url);

    // Step 2: Try content images
    if (!extractedImageUrl && html) {
      extractedImageUrl = extractImageFromContent(html, url);
    }

    // Step 3: Use AI to find image URL if still not found
    if (!extractedImageUrl && html) {
      console.log("Attempting AI-powered image extraction...");
      
      // Extract a sample of img tags for AI analysis
      const imgTags = html.match(/<img[^>]+>/gi)?.slice(0, 20)?.join('\n') || '';
      
      const imagePrompt = `Analyze these img tags from a webpage and identify the URL of the most likely featured/hero image (not icons, logos, or avatars).

IMG tags found:
${imgTags}

Return ONLY the image URL, nothing else. If no suitable image is found, return "NONE".`;

      try {
        const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You extract image URLs from HTML. Return only the URL, nothing else." },
              { role: "user", content: imagePrompt },
            ],
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const aiImageUrl = imageData.choices?.[0]?.message?.content?.trim();
          if (aiImageUrl && aiImageUrl !== "NONE" && aiImageUrl.includes('http')) {
            extractedImageUrl = toAbsoluteUrl(aiImageUrl, url);
            console.log("AI found image:", extractedImageUrl);
          }
        }
      } catch (aiImageError) {
        console.log("AI image extraction failed:", aiImageError);
      }
    }

    // Step 4: Fallback to logo/favicon
    if (!extractedImageUrl && html) {
      extractedImageUrl = extractLogoOrFavicon(html, url);
    }

    // Build topic matching context
    let topicContext = "";
    if (topicCategories?.length > 0 || topics?.length > 0) {
      topicContext = `\n\nAlso suggest which of these topic categories and topics are most relevant to this content.

Available topic categories (return matching IDs):
${(topicCategories || []).map((tc: any) => `- ${tc.id}: ${tc.name} (key: ${tc.key})`).join('\n')}

Available topics (return matching IDs):
${(topics || []).map((t: any) => `- ${t.id}: ${t.name} (category: ${t.category_key})`).join('\n')}

Add these fields to the JSON:
- suggested_topic_categories: array of matching topic category IDs (strings)
- suggested_topics: array of matching topic IDs (strings)`;
    }

    // Now get the rest of the metadata from AI
    const prompt = `Analyze this URL and extract metadata. URL: ${url}

${pageContent ? `Page content preview: ${pageContent}` : "Could not fetch page content, analyze based on URL only."}

Extract and return a JSON object with these fields:
- title: The main title of the content (string)
- description: A brief summary of 1-2 sentences (string)
- author: The author if identifiable (string or null)
- type: One of "article", "webinar", "guide", "video", "podcast", "event" based on content type (string)
- estimated_time: Reading/watching time in minutes as a number (number or null)
${topicContext}

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
    console.log("Final extracted image URL:", extractedImageUrl);

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
