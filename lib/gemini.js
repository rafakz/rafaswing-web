/* Gemini API көмекшісі: чат пен AI талдау осыны қолданады.
   Модель атауы кодқа жазылмайды: қолжетімді flash модельдер тізімі сұралады.
   Модель жоқ (404) немесе квота таусылған (429) болса, келесі модельге автоматты өтеді.
   Кілт GEMINI_API_KEY айнымалысынан алынады (Vercel Environment Variables). */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const LIST_TTL_MS = 60 * 60 * 1000; // модельдер тізімін 1 сағат кэште ұстаймыз

let listCache = { models: null, at: 0 };
let workingModel = null; // соңғы жұмыс істеген модель

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.trim()) {
    throw new Error("GEMINI_API_KEY орнатылмаған (Vercel → Environment Variables)");
  }
  return key.trim();
}

/* generateContent қолдайтын flash модельдер тізімі. Lite нұсқалар соңына қойылады, содан кейін ең жаңасы бірінші. */
async function listModels(key) {
  if (listCache.models && Date.now() - listCache.at < LIST_TTL_MS) {
    return listCache.models;
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

  usable.sort((a, b) => {
    const aLite = /lite/i.test(a.name) ? 1 : 0;
    const bLite = /lite/i.test(b.name) ? 1 : 0;
    if (aLite !== bLite) return aLite - bLite;
    return b.name.localeCompare(a.name);
  });

  const models = usable.map((m) => m.name);
  listCache = { models, at: Date.now() };
  return models;
}

/* askGemini: system — жүйелік нұсқау (мәтін), contents — [{ role: "user"|"assistant"|"model", text }] */
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

  const all = await listModels(key);
  // Алдымен соңғы жұмыс істеген модельді қолданамыз
  const ordered = workingModel && all.includes(workingModel)
    ? [workingModel, ...all.filter((m) => m !== workingModel)]
    : all;

  let lastErr = "";
  for (const model of ordered) {
    const res = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));

    if (res.ok) {
      const parts = (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts) || [];
      const text = parts.map((p) => p.text || "").join("").trim();
      if (text) {
        workingModel = model;
        return text;
      }
      lastErr = `${model}: бос жауап`;
      continue;
    }

    const msg = json.error && json.error.message ? json.error.message : `status ${res.status}`;
    lastErr = `${model}: ${msg}`;

    // Модель жоқ (404) немесе квота таусылды (429) болса — келесі модельге өтеміз. Басқа қате болса — тоқтаймыз.
    if (res.status !== 404 && res.status !== 429) {
      throw new Error(lastErr);
    }
  }

  // Барлық модель сәтсіз: кэшті тазалаймыз, келесі сұрауда тізім қайта сұралады
  listCache = { models: null, at: 0 };
  workingModel = null;
  throw new Error("Ешбір модель жұмыс істемеді. " + lastErr);
}
