const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const allowedCategories = new Set(["Wet", "Dry", "E-Waste"]);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return jsonResponse({ error: "AI service is not configured" }, 503);

    const body = await request.json() as {
      itemName?: string;
      imageBase64?: string;
      mimeType?: string;
    };
    const itemName = typeof body.itemName === "string" ? body.itemName.slice(0, 200) : "";
    const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : "";
    const mimeType = typeof body.mimeType === "string" && body.mimeType.startsWith("image/") ? body.mimeType : "image/jpeg";

    if (!itemName && !imageBase64) return jsonResponse({ error: "An item name or image is required" }, 400);
    if (imageBase64.length > 12_000_000) return jsonResponse({ error: "Image is too large" }, 413);

    const prompt = `You are EcoBin, an India-focused waste sorting assistant. Classify the item into exactly one category: Wet, Dry, or E-Waste. Return only valid JSON with these keys: name, category, confidence, disposalInstructions, indiaTip, alternatives. Confidence must be a number from 0 to 1. Be practical and concise. Never invent a recycling centre or claim a rule is universal. Item text: ${itemName || "No text provided; inspect the image."}`;
    const parts: Array<Record<string, unknown>> = [{ text: prompt }];
    if (imageBase64) parts.push({ inline_data: { mime_type: mimeType, data: imageBase64 } });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
      }),
    });
    if (!response.ok) return jsonResponse({ error: "AI service request failed" }, 502);

    const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return jsonResponse({ error: "AI returned no classification" }, 502);

    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    const category = typeof parsed.category === "string" ? parsed.category : "";
    const confidence = typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0;
    if (!allowedCategories.has(category) || typeof parsed.name !== "string" || typeof parsed.disposalInstructions !== "string") {
      return jsonResponse({ error: "AI returned an invalid classification" }, 502);
    }

    return jsonResponse({
      name: parsed.name.toString().slice(0, 120),
      category,
      confidence,
      disposalInstructions: parsed.disposalInstructions.toString().slice(0, 600),
      indiaTip: typeof parsed.indiaTip === "string" ? parsed.indiaTip.slice(0, 400) : "Check your city’s local collection guidance.",
      alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives.filter((item): item is string => typeof item === "string").slice(0, 4) : [],
    });
  } catch {
    return jsonResponse({ error: "Could not classify this item" }, 500);
  }
});
