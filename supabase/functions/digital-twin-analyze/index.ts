const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Two modes:
//  - mode "analyze": photo -> JSON heightmap + land descriptors
//  - mode "forecast": params -> narrative forecast text + JSON metrics

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    const body = await req.json();
    const mode = body.mode;

    if (mode === "analyze") {
      const { imageBase64 } = body;
      if (!imageBase64) {
        return new Response(JSON.stringify({ error: "imageBase64 required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tool = {
        type: "function",
        function: {
          name: "describe_land",
          description: "Estimate terrain & land features from photo for a digital twin",
          parameters: {
            type: "object",
            properties: {
              landName: { type: "string", description: "Short name for this plot" },
              dominantTerrain: { type: "string", enum: ["flat", "gentle_slope", "hilly", "uneven", "terraced"] },
              vegetationDensity: { type: "number", description: "0-1" },
              soilColor: { type: "string", description: "hex like #8b6f47" },
              soilGuess: { type: "string", enum: ["Clay", "Sandy", "Loamy", "Silt", "Peat"] },
              cropGuess: { type: "string" },
              healthScore: { type: "number", description: "0-100 estimated current crop health" },
              areaEstimateSqm: { type: "number" },
              heightmap: {
                type: "array",
                description: "16x16 grid of normalized heights 0-1, row-major (256 numbers)",
                items: { type: "number" },
              },
              notes: { type: "string", description: "Short 1-2 sentence observation" },
            },
            required: ["dominantTerrain", "vegetationDensity", "soilColor", "soilGuess", "healthScore", "heightmap", "notes"],
          },
        },
      };

      const aiRes = await fetch(AI_URL, {
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
              content:
                "You are an agronomy & terrain estimator. Analyze the farm photo and produce structured land data, including a 16x16 (256 values) normalized heightmap that approximates terrain elevation. Be decisive even with limited info.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Analyze this farm/land photo for a digital twin." },
                { type: "image_url", image_url: { url: imageBase64 } },
              ],
            },
          ],
          tools: [tool],
          tool_choice: { type: "function", function: { name: "describe_land" } },
        }),
      });

      if (aiRes.status === 429)
        return new Response(JSON.stringify({ error: "Rate limited, try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiRes.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (!aiRes.ok) {
        const txt = await aiRes.text();
        console.error("AI error", aiRes.status, txt);
        throw new Error("AI gateway error");
      }

      const data = await aiRes.json();
      const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) throw new Error("No tool call returned");
      const parsed = JSON.parse(args);

      // Sanity-fix heightmap length
      if (!Array.isArray(parsed.heightmap) || parsed.heightmap.length !== 256) {
        parsed.heightmap = Array.from({ length: 256 }, () => Math.random() * 0.5);
      }

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "forecast") {
      const { land, params, language } = body;
      const langName = language === "hi" ? "Hindi" : language === "kn" ? "Kannada" : "English";

      const aiRes = await fetch(AI_URL, {
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
              content: `You are an agronomy advisor. Given digital-twin land data and farmer experiment parameters, produce a concise forecast (under 180 words) in ${langName}. Cover: expected crop health trajectory, yield change %, water usage, top 2 risks, and 1 recommendation. Use markdown with short bullet points and bold key numbers.`,
            },
            {
              role: "user",
              content: `LAND:\n${JSON.stringify(land)}\n\nEXPERIMENT PARAMS:\n${JSON.stringify(params)}`,
            },
          ],
        }),
      });

      if (aiRes.status === 429)
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiRes.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (!aiRes.ok) throw new Error("AI gateway error");

      const data = await aiRes.json();
      const text = data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ forecast: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown mode" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("twin error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
