export async function POST(request) {
  var apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "GEMINI_API_KEY орнатылмаган" },
      { status: 500 }
    );
  }

  try {
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
      "деректерді қалай түсінуге болатынын түсіндір (мыс. техникалық көрсеткіштер не дегенді білдіреді, " +
      "тәуекел қандай). Соңында 'Бұл ақпараттық сипатта, инвестиция кеңесі емес' деп қос.\n\n" +
      "Деректер:\n" + dataText;

    var geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

    var geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }]
      })
    });

    if (!geminiRes.ok) {
      var errText = await geminiRes.text();
      return Response.json(
        { error: "AI API катесi", status: geminiRes.status, detail: errText.slice(0, 300) },
        { status: 502 }
      );
    }

    var geminiData = await geminiRes.json();
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

    return Response.json({ summary: summaryText || "Қорытынды алынбады." });
  } catch (err) {
    return Response.json(
      { error: "Қорытынды жасау кезінде кате шыкты", detail: err.message },
      { status: 500 }
    );
  }
}
