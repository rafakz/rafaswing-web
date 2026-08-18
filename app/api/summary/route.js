export async function POST(request) {
  try {
    var apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY орнатылмаган", detail: "env var жок" },
        { status: 200 }
      );
    }

    var body = await request.json();

    var symbol = body.symbol || "";
    var name = body.name || "";
    var price = body.currentPrice;
    var changePercent = body.changePercent;
    var technicals = body.technicals || {};
    var fundamentals = body.fundamentals || {};
    var swingScore = body.swingScore;
    var tradePlan = body.tradePlan || {};
    var signalLabel = body.signalLabel || "";

    var promptParts = [];
    promptParts.push("Компания: " + name + " (" + symbol + ")");
    promptParts.push("Ағымдағы баға: $" + price + ", өзгеріс: " + changePercent + "%");
    if (typeof technicals.rsi === "number") promptParts.push("RSI: " + technicals.rsi);
    if (typeof technicals.macd === "number") promptParts.push("MACD: " + technicals.macd);
    if (typeof technicals.sma20 === "number") promptParts.push("SMA20: " + technicals.sma20);
    if (typeof technicals.sma50 === "number") promptParts.push("SMA50: " + technicals.sma50);
    if (typeof fundamentals.pe === "number") promptParts.push("P/E: " + fundamentals.pe.toFixed(2));
    if (typeof fundamentals.roe === "number") promptParts.push("ROE: " + fundamentals.roe.toFixed(1) + "%");
    if (typeof swingScore === "number") promptParts.push("Swing Score: " + swingScore + "/100");
    if (signalLabel) promptParts.push("Автоматты сигнал: " + signalLabel);
    if (typeof tradePlan.entry === "number") {
      promptParts.push(
        "Сауда жоспары — Entry: $" + tradePlan.entry +
        ", Stop Loss: $" + tradePlan.stopLoss +
        ", TP1: $" + tradePlan.takeProfit1
      );
    }

    var dataText = promptParts.join("\n");

    var userMessage =
      "Сен қаржы деректерін талдайтын көмекшісің. Төмендегі деректер негізінде осы акция бойынша " +
      "3-4 сөйлемдік қысқа, түсінікті ҚАЗАҚ ТІЛІНДЕ қорытынды жаз. Инвестиция кеңесі бермей, тек " +
      "деректерді қалай түсінуге болатынын түсіндір. Соңында 'Бұл ақпараттық сипатта, инвестиция " +
      "кеңесі емес' деп қос.\n\nДеректер:\n" + dataText;

    var geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" + apiKey;

    var geminiRes;
    try {
      geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userMessage }] }]
        })
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

    var summaryText = "";

    if (
      geminiData &&
      Array.isArray(geminiData.candidates) &&
      geminiData.candidates[0] &&
      geminiData.candidates[0].content &&
      Array.isArray(geminiData.candidates[0].content.parts)
    ) {
      for (var i = 0; i < geminiData.candidates[0].content.parts.length; i++) {
        var part = geminiData.candidates[0].content.parts[i];
        if (part && typeof part.text === "string") {
          summaryText += part.text;
        }
      }
    }

    if (!summaryText) {
      return Response.json(
        { error: "Қорытынды бос келді", detail: rawText.slice(0, 500) },
        { status: 200 }
      );
    }

    return Response.json({ summary: summaryText });
  } catch (err) {
    return Response.json(
      { error: "Жалпы кате", detail: (err && err.message) ? err.message : String(err) },
      { status: 200 }
    );
  }
}
