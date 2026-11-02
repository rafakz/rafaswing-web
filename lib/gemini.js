/* Gemini API көмекшісі: чат пен AI талдау осыны қолданады.
   Модель атауы кодқа жазылмайды: қолжетімді flash модельді өзі табады.
   Кілт GEMINI_API_KEY айнымалысынан алынады (Vercel Environment Variables). */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL_TTL_MS = 60 * 60 * 1000; // модель атауын 1 сағат кэште ұстаймыз

let modelCache = { name: null, at: 0 };

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.trim()) {
    throw new Error("GEMINI_API_KEY орнатылмаған (Vercel → Environment Variables)");
  }
  return key.trim();
}

/* Қолжетімді flash модельді табу: generateContent қолдайтын, lite/image/tts/embedding емес, ең жаңасы. */
async function pickModel(key) {
  if (modelCache.name && Date.now() - modelCache.at < MODEL_TTL_MS) {
    return modelCache.name;
  }

  const res = await fetch(`${API_BASE}/models`, {
    headers: { "x-goog-api-key": key },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error && json.error.message ? json.error.message : `ListModels қатесі ${res.status}`);
  }

  const usable = (json.models || []).filter((m) => {
    const methods = m.supportedGenerationMethods || [];
    const name = m.name || "";
    return (
      methods.includes("generateContent") &&
      /flash/i.test(name) &&
      !/image|tts|live|embed|audio/i.test(name)
    );
  });

  if (usable.length === 0) {
    throw new Error("generateContent қолдайтын flash модель табылмады");
  }

  // Lite нұсқаларын соңғы таңдау ретінде қалдырамыз, содан кейін атауы бойынша ең жаңасын аламыз
  usable.sort((a, b) => {
    const aLite = /lite/i.test(a.name) ? 1 : 0;
    const bLite = /lite/i.test(b.name) ? 1 : 0;
    if (aLite !== bLite) return aLite - bLite;
    return b.name.localeCompare(a.name);
  });

  modelCache = { name: usable[0].name, at: Date.now() };
  return modelCache.name;
}

/* askGemini: system — жүйелік нұсқау (мәтін), contents — [{ role: "user"|"model", text }] */
export async function askGemini({ system, contents, maxTokens = 1024 }) {
  const key = apiKey();

  const body = {
    contents: (contents || []).map((c) => ({
      role: c.role === "assistant" || c.role === "model" ? "model" : "user",
      parts: [{ text: String(c.text || "") }],
    })),
    generationConfig: { maxOutputTokens: maxTokens },
  };
  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }

  // Модель жоғалып кетсе (404), кэшті тазалап, бір рет қайта көреміз
  for (let attempt = 0; attempt < 2; attempt++) {
    const model = await pickModel(key);
    const res = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();

    if (res.status === 404 && attempt === 0) {
      modelCache = { name: null, at: 0 };
      continue;
    }
    if (!res.ok) {
      throw new Error(json.error && json.error.message ? json.error.message : `Gemini қатесі ${res.status}`);
    }

    const parts = (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts) || [];
    const text = parts.map((p) => p.text || "").join("").trim();
    if (!text) {
      throw new Error("Gemini бос жауап қайтарды");
    }
    return text;
  }

  throw new Error("Gemini моделі табылмады");
}
