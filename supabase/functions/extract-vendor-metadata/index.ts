import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function toAbsoluteUrl(url: string | null, baseUrl: string): string | null {
  if (!url) return null;
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    const base = new URL(baseUrl);
    if (url.startsWith('/')) {
      return `${base.origin}${url}`;
    }
    return `${base.origin}/${url}`;
  } catch {
    return null;
  }
}

function extractLogo(html: string, baseUrl: string): string | null {
  // Priority order for company logos:
  // 1. Apple touch icon (usually high quality square logo)
  // 2. High-res favicon (192x192, 180x180, etc.)
  // 3. og:image as fallback
  // 4. Default favicon
  
  const patterns = [
    // Apple touch icon (usually highest quality)
    /<link[^>]*rel=["']apple-touch-icon(?:-precomposed)?["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon(?:-precomposed)?["']/i,
    // High-res favicons
    /<link[^>]*rel=["']icon["'][^>]*sizes=["'](?:192x192|180x180|152x152|144x144|128x128|120x120|96x96)["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']icon["'][^>]*sizes=["'](?:192x192|180x180|152x152|144x144|128x128|120x120|96x96)["']/i,
    // SVG favicon (scalable, good quality)
    /<link[^>]*rel=["']icon["'][^>]*type=["']image\/svg\+xml["'][^>]*href=["']([^"']+)["']/i,
    // Regular favicon
    /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
    // og:image as fallback for logo
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const url = toAbsoluteUrl(match[1], baseUrl);
      if (url) {
        console.log("Found logo:", url);
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

function extractCompanyName(html: string): string | null {
  // Try og:site_name first (most accurate for company name)
  const siteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i);
  if (siteNameMatch && siteNameMatch[1]) {
    return siteNameMatch[1].trim();
  }

  // Try title tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    let title = titleMatch[1].trim();
    // Remove common suffixes
    title = title.replace(/\s*[-|–—:]\s*(Home|Official Site|Homepage|Welcome|Main|Home Page).*$/i, '');
    title = title.replace(/\s*[-|–—]\s*[^-|–—]*$/, ''); // Remove last segment after dash
    return title.trim();
  }

  return null;
}

function extractDescription(html: string): string | null {
  const patterns = [
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, categories } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Extracting vendor metadata for URL:", url);

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

    // Extract basic metadata from HTML
    const logoUrl = extractLogo(html, url);
    const companyName = extractCompanyName(html);
    const description = extractDescription(html);

    console.log("Extracted logo:", logoUrl);
    console.log("Extracted name:", companyName);
    console.log("Extracted description:", description);

    // Use AI to suggest categories if we have categories list and page content
    let suggestedCategories: string[] = [];
    
    if (categories && categories.length > 0 && pageContent) {
      const categoryNames = categories.map((c: { id: string; name: string }) => c.name);
      
      const prompt = `Based on this company's website content, suggest which categories from the list best match their services.

Company website content:
${pageContent}

Available categories:
${categoryNames.join(', ')}

Return ONLY a JSON array of category names that match (e.g., ["Category 1", "Category 2"]). 
Select 1-3 most relevant categories. If none match well, return an empty array [].`;

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You categorize martech/business software vendors. Return only valid JSON arrays." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || "";
          console.log("AI category response:", content);
          
          // Parse JSON array from response
          const jsonMatch = content.match(/\[[\s\S]*?\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            // Map category names back to IDs
            suggestedCategories = categories
              .filter((c: { id: string; name: string }) => parsed.includes(c.name))
              .map((c: { id: string; name: string }) => c.id);
          }
        }
      } catch (aiError) {
        console.log("AI category suggestion failed:", aiError);
      }
    }

    const result = {
      name: companyName,
      description: description,
      logo_url: logoUrl,
      suggested_categories: suggestedCategories,
    };

    console.log("Final result:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in extract-vendor-metadata:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
