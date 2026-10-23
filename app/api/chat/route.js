import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY орнатылмаған" }, { status: 500 });
    }

    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const stockContext = body.stockContext || null;

    if (messages.length === 0) {
      return NextResponse.json({ error: "Хабарлама жоқ" }, { status: 400 });
    }

    // 1. AI Психолог және Аналитик промпты (TradeIQ стилінде)
    let systemNote = `Сен 'TradeIQ' атты қазақ тіліндегі элиталық AI-powered инвестициялық платформасының жасанды интеллект көмекшісісің. 
Сенің басты мақсатың - трейдерлерге техникалық/фундаменталды талдау жасауға көмектесу ЖӘНЕ олардың эмоцияларын (ФОМО, дүрбелең) басқаруға психологиялық қолдау көрсету.
- Пайдаланушымен әрқашан ҚАЗАҚ ТІЛІНДЕ сөйлес.
- Жауаптарың қысқа, кәсіби, нақты және түсінікті болсын (артық суреттемесіз).
- Акцияның құлағанын көрсең, сабырға шақыр. Күрт өссе, ашкөздіктен (FOMO) сақтандыр.
- Нақты 'мына акцияны сатып ал' немесе 'сат' деген қаржылық кеңес берме, тек талдау нәтижесін ұсын.`;

    // 2. Акция контекстін AI-ға беру
    if (stockContext && stockContext.symbol) {
      systemNote += `\n\nПАЙДАЛАНУШЫ ҚАРАП ОТЫРҒАН АКЦИЯ: ${stockContext.symbol} (${stockContext.name || ""})
- Қазіргі бағасы: $${stockContext.currentPrice ?? "белгісіз"}`;

      if (stockContext.halal) {
        systemNote += `\n- Халал статусы: ${stockContext.halal.label} (Статус: ${stockContext.halal.status}). Егер қолданушы халал ма деп сұраса, осыған сүйен.`;
      }

      if (stockContext.technicals) {
        const t = stockContext.technicals;
        systemNote += `\n- Техникалық көрсеткіштер: RSI=${t.rsi ?? "-"}, MACD=${t.macd ?? "-"}, SMA20=${t.sma20 ?? "-"}, SMA50=${t.sma50 ?? "-"}, EMA20/50=${t.ema20 ?? "-"}/${t.ema50 ?? "-"}`;
      }

      if (typeof stockContext.swingScore === "number") {
        systemNote += `\n- TradeIQ Swing Score: ${stockContext.swingScore}/100`;
      }

      if (stockContext.swingScoreBreakdown) {
        const b = stockContext.swingScoreBreakdown;
        systemNote += ` (Technical: ${b.technical ?? "-"}, Momentum: ${b.momentum ?? "-"}, Fundamental: ${b.fundamental ?? "-"}, Volume: ${b.volume ?? "-"}, Sentiment: ${b.sentiment ?? "-"})`;
      }

      if (stockContext.fundamentals) {
        const f = stockContext.fundamentals;
        systemNote += `\n- Фундаментал көрсеткіштер: P/E=${f.peRatio ?? "-"}, ROE=${f.roe ?? "-"}%, Қарыз/Капитал(D/E)=${f.debtToEquity ?? "-"}`;
      }

      if (stockContext.tradePlan) {
        const p = stockContext.tradePlan;
        systemNote += `\n- Сауда жоспары: Entry=$${p.entry ?? "-"}, Stop Loss=$${p.stopLoss ?? "-"}, TP1=$${p.takeProfit1 ?? "-"}, TP2=$${p.takeProfit2 ?? "-"}`;
      }
    }

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

    // 3. Дұрыс әрі жұмыс істейтін модель аты: gemini-1.5-flash
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemNote }]
        },
        contents: contents
      })
    });

    const rawText = await geminiRes.text();

    if (!geminiRes.ok) {
      return NextResponse.json({ error: "Gemini API қатесі", status: geminiRes.status, detail: rawText.slice(0, 1000) }, { status: 502 });
    }

    let geminiData;
    try {
      geminiData = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: "Gemini жауабын оқу кезінде қате", detail: rawText.slice(0, 1000) }, { status: 500 });
    }

    let replyText = "";
    const parts = geminiData?.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part && typeof part.text === "string") {
        replyText += part.text;
      }
    }

    if (!replyText.trim()) {
      return NextResponse.json({ error: "AI жауабы бос келді", detail: rawText.slice(0, 1000) }, { status: 500 });
    }

    return NextResponse.json({ reply: replyText.trim() });

  } catch (err) {
    return NextResponse.json({ error: "Жалпы қате", detail: err?.message || String(err) }, { status: 500 });
  }
}
