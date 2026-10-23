import { NextResponse } from 'next/server';

export const revalidate = 3600; // сағат сайын жаңарады

// ЖАҢАРТЫЛҒАН AI ФУНКЦИЯСЫ: Аударма + Нарық көңіл-күйі (Sentiment)
async function translateAndAnalyzeItems(items, apiKey) {
  if (!apiKey || items.length === 0) return items;

  // AI-ға оңай болу үшін деректерді ықшамдап береміз
  const newsData = items.map((it, i) => ({
    id: i + 1,
    headline: it.headline,
    summary: it.summary && it.summary.trim() ? it.summary : "(жоқ)"
  }));

  // ПРОМПТ: JSON форматын талап етеміз және Sentiment сұраймыз
  const prompt = `Мына қаржы жаңалықтарына сараптама жаса. Әр жаңалық үшін:
1. ТАҚЫРЫБЫН қазақ тіліне аудар.
2. МАЗМҰНЫН қазақ тіліне аудар.
3. Бұл жаңалық нарық үшін қандай екенін анықта (тек мына үш сөздің бірін таңда: "Bullish", "Bearish", "Neutral").

Жауапты ТЕК қана мынадай қатаң JSON массив форматында қайтар (ешқандай маркдаун, түсіндірме немесе қосымша мәтінсіз):
[
  { "id": 1, "headline": "Аударылған тақырып", "summary": "Аударылған мазмұн", "sentiment": "Bullish" }
]

Жаңалықтар:
${JSON.stringify(newsData)}`;

  // Дұрыс әрі соңғы модель: gemini-1.5-flash
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Gemini API Error (market-news):", res.status, errBody.slice(0, 500));
      return items;
    }

    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) return items;

    // AI кейде жауапты ```json ... ``` деп қайтарады, соны тазалаймыз
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsedAiData = JSON.parse(text); // Қатесіз JSON парсинг

    // AI қайтарған массивті бастапқы жаңалықтармен біріктіру
    return items.map((it, i) => {
      const aiResult = parsedAiData.find(a => a.id === i + 1);
      if (!aiResult) return it;
      
      return {
        ...it,
        headline: aiResult.headline || it.headline,
        summary: aiResult.summary !== "(жоқ)" ? aiResult.summary : it.summary,
        sentiment: aiResult.sentiment || "Neutral" // 🔥 ЖАҢА: AI Сигналы қосылды!
      };
    });

  } catch (err) {
    console.error("Gemini Analysis Exception (market-news):", err.message);
    return items; // Қате болса, ағылшынша түпнұсқасын қайтара береміз
  }
}

export async function GET() {
  try {
    const finnhubKey = process.env.FINNHUB_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!finnhubKey) {
      return NextResponse.json({ error: "FINNHUB_API_KEY орнатылмаған" }, { status: 200 });
    }

    const url = `https://finnhub.io/api/v1/news?category=general&token=${finnhubKey}`;

    let res;
    try {
      res = await fetch(url, { next: { revalidate: 3600 } });
    } catch (fetchErr) {
      return NextResponse.json({ error: "Finnhub-ке сұрау жіберу кезінде қате", detail: fetchErr.message }, { status: 200 });
    }

    if (!res.ok) {
      const rawText = await res.text();
      return NextResponse.json({ error: "Finnhub API қатесi", status: res.status, detail: rawText.slice(0, 300) }, { status: 200 });
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      return NextResponse.json({ news: [] });
    }

    // Тек алғашқы 15 жаңалықты аламыз (AI-ды қатты қинамау үшін және тез жұмыс істеуі үшін)
    const cleaned = data.slice(0, 15).map((item) => ({
      id: item.id,
      headline: item.headline || "",
      summary: item.summary || "",
      source: item.source || "",
      url: item.url || "",
      image: item.image || "",
      datetime: item.datetime || 0,
      related: item.related || "",
    }));

    // AI арқылы аудару және сараптау
    const translatedAndAnalyzed = await translateAndAnalyzeItems(cleaned, geminiKey);

    return NextResponse.json({ news: translatedAndAnalyzed });
  } catch (err) {
    return NextResponse.json(
      { error: "Жалпы қате", detail: (err && err.message) ? err.message : String(err) },
      { status: 200 }
    );
  }
}
