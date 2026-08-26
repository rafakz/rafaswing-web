async function translateHeadlines(items, apiKey) {
  if (!apiKey || items.length === 0) return items;

  var numbered = items
    .map(function (it, i) {
      return (i + 1) + ". " + it.headline;
    })
    .join("\n");

  var prompt =
    "Мына акша-нарық жаңалықтарының тақырыптарын қазақ тіліне аудар. " +
    "Тек аударманы қайтар, әр жолды нөмірімен бірге, басқа ешнәрсе жазба:\n\n" +
    numbered;

  var geminiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

  try {
    var res = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      var errBody = await res.text();
      console.error("Gemini translate error:", res.status, errBody.slice(0, 500));
      return items;
    }

    var data = await res.json();
    var text = "";
    if (
      data &&
      Array.isArray(data.candidates) &&
      data.candidates[0] &&
      data.candidates[0].content &&
      Array.isArray(data.candidates[0].content.parts)
    ) {
      for (var i = 0; i < data.candidates[0].content.parts.length; i++) {
        var part = data.candidates[0].content.parts[i];
        if (part && typeof part.text === "string") text += part.text;
      }
    }

    if (!text) return items;

    var lines = text.split("\n").filter(function (l) {
      return l.trim().length > 0;
    });

    var translatedMap = {};
    lines.forEach(function (line) {
      var match = line.match(/^\s*(\d+)\.\s*(.+)$/);
      if (match) {
        translatedMap[parseInt(match[1], 10)] = match[2].trim();
      }
    });

    return items.map(function (it, i) {
      var translated = translatedMap[i + 1];
      return translated ? Object.assign({}, it, { headline: translated }) : it;
    });
  } catch (err) {
    console.error("Gemini translate exception:", err.message);
    return items;
  }
}

export async function GET(request) {
  var searchParams = new URL(request.url).searchParams;
  var symbol = searchParams.get("symbol");

  if (!symbol) {
    return Response.json({ error: "Ticker керек" }, { status: 400 });
  }

  var apiKey = process.env.FINNHUB_API_KEY;
  var geminiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Finnhub API key орнатылмаган" },
      { status: 500 }
    );
  }

  try {
    var today = new Date();
    var weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    function formatDate(d) {
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, "0");
      var day = String(d.getDate()).padStart(2, "0");
      return y + "-" + m + "-" + day;
    }

    var fromStr = formatDate(weekAgo);
    var toStr = formatDate(today);

    var newsUrl = "https://finnhub.io/api/v1/company-news?symbol=" + symbol + "&from=" + fromStr + "&to=" + toStr + "&token=" + apiKey;

    var newsRes = await fetch(newsUrl);

    if (!newsRes.ok) {
      var errText = await newsRes.text();
      return Response.json(
        {
          error: "News API катесi",
          status: newsRes.status,
          detail: errText.slice(0, 300)
        },
        { status: 502 }
      );
    }

    var newsData = await newsRes.json();

    if (!Array.isArray(newsData)) {
      return Response.json({ symbol: symbol, news: [] });
    }

    var topItems = newsData.slice(0, 6).map(function (item) {
      return {
        headline: item.headline,
        headlineOriginal: item.headline,
        source: item.source,
        url: item.url,
        datetime: item.datetime,
      };
    });

    var translated = await translateHeadlines(topItems, geminiKey);

    return Response.json({ symbol: symbol, news: translated });
  } catch (err) {
    return Response.json(
      {
        error: "Жаналыктарды алу кезінде кате шыкты",
        detail: err.message
      },
      { status: 500 }
    );
  }
}
