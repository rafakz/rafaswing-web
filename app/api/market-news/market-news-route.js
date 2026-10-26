import { NextResponse } from 'next/server';

export const revalidate = 3600; 

async function translateAndAnalyzeItems(items, apiKey) {
  if (!apiKey || items.length === 0) return items;

  const newsData = items.map((it, i) => ({
    id: i + 1,
    headline: it.headline,
    summary: it.summary && it.summary.trim() ? it.summary : "(жоқ)"
  }));

  // Промпт: AI-дан нақты формат талап етеміз
  const prompt = `Translate the following financial news headlines and summaries into Kazakh. Also, determine the market sentiment for each news item ("Bullish", "Bearish", or "Neutral").
  Respond ONLY with a valid JSON array of objects, exactly matching this format:
  [{"id": 1, "headline": "қазақша тақырып", "summary": "қазақша мазмұн", "sentiment": "Bullish"}]
  
  News to translate:
  ${JSON.stringify(newsData)}`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        // ЕҢ БАСТЫСЫ: AI тек таза JSON қайтаруы үшін
        generationConfig: { response_mime_type: "application/json" }
      }),
    });

    if (!res.ok) {
      console.error("Gemini API Error");
      return items;
    }

    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text) return items;

    const parsedAiData = JSON.parse(text); 

    return items.map((it, i) => {
      const aiResult = parsedAiData.find(a => a.id === i + 1);
      if (!aiResult) return it;
      return {
        ...it,
        headline: aiResult.headline || it.headline,
        summary: aiResult.summary !== "(жоқ)" ? aiResult.summary : it.summary,
        sentiment: aiResult.sentiment || "Neutral" 
      };
    });

  } catch (err) {
    console.error("Gemini Parse Error:", err);
    return items; 
  }
}

export async function GET() {
  try {
    const finnhubKey = process.env.FINNHUB_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!finnhubKey) return NextResponse.json({ error: "FINNHUB_API_KEY жоқ" }, { status: 200 });

    const url = `https://finnhub.io/api/v1/news?category=general&token=${finnhubKey}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) return NextResponse.json({ error: "Finnhub API қатесi" }, { status: 200 });

    const data = await res.json();
    if (!Array.isArray(data)) return NextResponse.json({ news: [] });

    // Тезірек жұмыс істеуі үшін 12 жаңалықты аламыз
    const cleaned = data.slice(0, 12).map((item) => ({
      id: item.id,
      headline: item.headline || "",
      summary: item.summary || "",
      source: item.source || "",
      url: item.url || "",
      image: item.image || "", 
      datetime: item.datetime || 0,
    }));

    const translatedAndAnalyzed = await translateAndAnalyzeItems(cleaned, geminiKey);
    return NextResponse.json({ news: translatedAndAnalyzed });
  } catch (err) {
    return NextResponse.json({ error: "Жалпы қате" }, { status: 200 });
  }
}
