export async function POST(request) {
  try {
    var apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY орнатылмаган" },
        { status: 200 }
      );
    }

    var body = await request.json();
    var messages = Array.isArray(body.messages) ? body.messages : [];
    var stockContext = body.stockContext || null;

    if (messages.length === 0) {
      return Response.json({ error: "Хабарлама жок" }, { status: 200 });
    }

    var systemNote =
      "Сен 'Ноғай' атты қазақ тіліндегі swing-трейдинг платформасының көмекшісісің. " +
      "Пайдаланушымен ҚАЗАҚ ТІЛІНДЕ сөйлес. Қаржы, акциялар, техникалық/фундаменталды анализ " +
      "туралы сұрақтарға көмектес. Тікелей 'мына акцияны сатып ал' деген нақты кеңес берме, " +
      "тек деректерді түсіндір және білім бер. Қысқа әрі нақты жауап бер.";

    if (stockContext && stockContext.symbol) {
      systemNote += "\n\nҚазір пайдаланушы қарап отырған акция: " + stockContext.symbol +
        " (" + (stockContext.name || "") + "), баға: $" + stockContext.currentPrice +
        ", RSI: " + (stockContext.technicals ? stockContext.technicals.rsi : "жок") +
        ", MACD: " + (stockContext.technicals ? stockContext.technicals.macd : "жок") +
        (typeof stockContext.swingScore === "number" ? ", Swing Score: " + stockContext.swingScore : "");
    }

    var contents = [];
    contents.push({ role: "user", parts: [{ text: systemNote }] });
    contents.push({ role: "model", parts: [{ text: "Түсінікті, көмектесуге дайынмын." }] });

    for (var i = 0; i < messages.length; i++) {
      var m = messages[i];
      var role = (m.role === "assistant") ? "model" : "user";
      contents.push({ role: role, parts: [{ text: String(m.text || "") }] });
    }

    var geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" + apiKey;

    var geminiRes;
    try {
      geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: contents })
      });
    } catch (fetchErr) {
      return Response.json(
        { error: "Gemini-ге сұрау жіберу кезінде кате", detail: fetchErr.message },
        { status: 200 }
      );
    }

    var rawText = await geminiRes.text();

    if (!geminiRes.ok) {
      return Response.json(
        { error: "AI API катесi", status: geminiRes.status, detail: rawText.slice(0, 500) },
        { status: 200 }
      );
    }

    var geminiData;
    try {
      geminiData = JSON.parse(rawText);
    } catch (parseErr) {
      return Response.json(
        { error: "AI жауабын окуда кате", detail: rawText.slice(0, 500) },
        { status: 200 }
      );
    }

    var replyText = "";
    if (
      geminiData &&
      Array.isArray(geminiData.candidates) &&
      geminiData.candidates[0] &&
      geminiData.candidates[0].content &&
      Array.isArray(geminiData.candidates[0].content.parts)
    ) {
      for (var j = 0; j < geminiData.candidates[0].content.parts.length; j++) {
        var part = geminiData.candidates[0].content.parts[j];
        if (part && typeof part.text === "string") {
          replyText += part.text;
        }
      }
    }

    if (!replyText) {
      return Response.json(
        { error: "Жауап бос келді", detail: rawText.slice(0, 500) },
        { status: 200 }
      );
    }

    return Response.json({ reply: replyText });
  } catch (err) {
    return Response.json(
      { error: "Жалпы кате", detail: (err && err.message) ? err.message : String(err) },
      { status: 200 }
    );
  }
}
