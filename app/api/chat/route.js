export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY орнатылмаған" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const messages = Array.isArray(body.messages)
      ? body.messages
      : [];

    const stockContext = body.stockContext || null;

    if (messages.length === 0) {
      return Response.json(
        { error: "Хабарлама жоқ" },
        { status: 400 }
      );
    }

    let systemNote =
      "Сен 'TradeIQ' атты қазақ тіліндегі AI-powered swing-трейдинг платформасының AI көмекшісісің. " +
      "Пайдаланушымен әрқашан ҚАЗАҚ ТІЛІНДЕ сөйлес. " +
      "Акциялар, инвестиция, техникалық және фундаменталды анализ туралы түсіндір. " +
      "Деректерді түсіндір, бірақ нақты 'мына акцияны сатып ал' немесе 'сат' деген жеке қаржылық кеңес берме. " +
      "Жауаптарың қысқа, нақты және түсінікті болсын.";

    if (stockContext && stockContext.symbol) {
      systemNote +=
        "\n\nПайдаланушы қарап отырған акция: " +
        stockContext.symbol +
        " (" +
        (stockContext.name || "") +
        ")" +
        "\nБағасы: $" +
        (stockContext.currentPrice ?? "жоқ") +
        "\nRSI: " +
        (stockContext.technicals?.rsi ?? "жоқ") +
        "\nMACD: " +
        (stockContext.technicals?.macd ?? "жоқ");

      if (typeof stockContext.swingScore === "number") {
        systemNote +=
          "\nSwing Score: " +
          stockContext.swingScore;
      }
    }

    const contents = [];

    for (const m of messages) {
      const text = String(m.text || "").trim();

      if (!text) continue;

      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [
          {
            text: text
          }
        ]
      });
    }

    if (contents.length === 0) {
      return Response.json(
        { error: "Жіберілетін хабарлама жоқ" },
        { status: 400 }
      );
    }

    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: systemNote
            }
          ]
        },
        contents: contents
      })
    });

    const rawText = await geminiRes.text();

    if (!geminiRes.ok) {
      return Response.json(
        {
          error: "Gemini API қатесі",
          status: geminiRes.status,
          detail: rawText.slice(0, 1000)
        },
        { status: 200 }
      );
    }

    let geminiData;

    try {
      geminiData = JSON.parse(rawText);
    } catch {
      return Response.json(
        {
          error: "Gemini жауабын оқу кезінде қате",
          detail: rawText.slice(0, 1000)
        },
        { status: 200 }
      );
    }

    let replyText = "";

    const parts =
      geminiData?.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part && typeof part.text === "string") {
        replyText += part.text;
      }
    }

    if (!replyText.trim()) {
      return Response.json(
        {
          error: "AI жауабы бос келді",
          detail: rawText.slice(0, 1000)
        },
        { status: 200 }
      );
    }

    return Response.json({
      reply: replyText.trim()
    });

  } catch (err) {
    return Response.json(
      {
        error: "Жалпы қате",
        detail: err?.message || String(err)
      },
      { status: 200 }
    );
  }
}
