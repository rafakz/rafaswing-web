import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY орнатылмаған (Vercel-ді тексеріңіз)" }, { status: 500 });
    }

    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const stockContext = body.stockContext || null;

    if (messages.length === 0) {
      return NextResponse.json({ error: "Хабарлама жоқ" }, { status: 400 });
    }

    // 1. Промпт для ИИ
    let systemNote = `Сен 'TradeIQ' атты қазақ тіліндегі элиталық AI-powered инвестициялық платформасының жасанды интеллект көмекшісісің. 
Сенің басты мақсатың - трейдерлерге техникалық/фундаменталды талдау жасауға көмектесу ЖӘНЕ олардың эмоцияларын (ФОМО, дүрбелең) басқаруға психологиялық қолдау көрсету.
- Пайдаланушымен әрқашан ҚАЗАҚ ТІЛІНДЕ сөйлес.
- Жауаптарың қысқа, кәсіби, нақты және түсінікті болсын (артық суреттемесіз).
- Акцияның құлағанын көрсең, сабырға шақыр. Күрт өссе, ашкөздіктен (FOMO) сақтандыр.
- Нақты 'мына акцияны сатып ал' немесе 'сат' деген қаржылық кеңес берме, тек талдау нәтижесін ұсын.`;

    // 2. Добавление контекста об акции (если пользователь находится на странице акции)
    if (stockContext && stockContext.symbol) {
      systemNote += `\n\nПАЙДАЛАНУШЫ ҚАРАП ОТЫРҒАН АКЦИЯ: ${stockContext.symbol} (${stockContext.name || ""})
- Қазіргі бағасы: $${stockContext.currentPrice ?? "белгісіз"}`;

      if (stockContext.halal) {
        systemNote += `\n- Халал статусы: ${stockContext.halal.label} (Статус: ${stockContext.halal.status}). Егер қолданушы халал ма деп сұраса, осыған сүйен.`;
      }
      if (stockContext.technicals) {
        const t = stockContext.technicals;
        systemNote += `\n- Техникалық көрсеткіштер: RSI=${t.rsi ?? "-"}, MACD=${t.macd ?? "-"}, SMA20=${t.sma20 ?? "-"}, SMA50=${t.sma50 ?? "-"}`;
      }
      if (stockContext.tradePlan) {
        const p = stockContext.tradePlan;
        systemNote += `\n- Сауда жоспары: Entry=$${p.entry ?? "-"}, Stop Loss=$${p.stopLoss ?? "-"}, TP1=$${p.takeProfit1 ?? "-"}`;
      }
    }

    // 3. Подготовка сообщений пользователя
    const contents = [];
    for (const m of messages) {
      const text = String(m.text || "").trim();
      if (!text) continue;
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: text }]
      });
    }

    if (contents.length === 0) {
      return NextResponse.json({ error: "Жіберілетін хабарлама жоқ" }, { status: 400 });
    }

    // 4. Прямой запрос к Google Gemini 1.5 Flash
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { // В REST API используется именно system_instruction
          parts: [{ text: systemNote }]
        },
        contents: contents
      })
    });

    const rawText = await geminiRes.text();

    if (!geminiRes.ok) {
      console.error("Gemini API Error:", rawText);
      return NextResponse.json({ error: "Gemini API қатесі", detail: rawText.slice(0, 200) }, { status: 502 });
    }

    let geminiData;
    try {
      geminiData = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: "Gemini жауабын оқу кезінде қате" }, { status: 500 });
    }

    let replyText = "";
    const parts = geminiData?.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part && typeof part.text === "string") {
        replyText += part.text;
      }
    }

    if (!replyText.trim()) {
      return NextResponse.json({ error: "AI жауабы бос келді" }, { status: 500 });
    }

    return NextResponse.json({ reply: replyText.trim() });

  } catch (err) {
    console.error("Chat API General Error:", err);
    return NextResponse.json({ error: "Жалпы сервер қатесі", detail: err?.message || String(err) }, { status: 500 });
  }
}
