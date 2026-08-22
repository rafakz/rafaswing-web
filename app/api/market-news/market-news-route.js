export const revalidate = 3600; // сағат сайын жаңарады

async function translateItems(items, apiKey) {
  if (!apiKey || items.length === 0) return items;

  var numbered = items
    .map(function (it, i) {
      var summary = it.summary && it.summary.trim() ? it.summary : "(жоқ)";
      return (i + 1) + ".\nТАҚЫРЫП: " + it.headline + "\nМАЗМҰНЫ: " + summary;
    })
    .join("\n\n");

  var prompt =
    "Мына акша-нарық жаңалықтарының әрқайсысының ТАҚЫРЫБЫН және МАЗМҰНЫН қазақ тіліне аудар. " +
    "Әр жаңалық үшін дәл осы форматта жауап бер (нөмірін сақта):\n" +
    "N.\nТАҚЫРЫП: <аударылған тақырып>\nМАЗМҰНЫ: <аударылған мазмұн>\n\n" +
    "Басқа ешнәрсе қоспа, тек аудармаларды қайтар.\n\n" +
    numbered;

  var geminiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    apiKey;

  try {
    var res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) return items;

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

    var blocks = text.split(/\n(?=\d+\.\s*\n)/);

    var translatedMap = {};
    blocks.forEach(function (block) {
      var numMatch = block.match(/^\s*(\d+)\./);
      if (!numMatch) return;
      var num = parseInt(numMatch[1], 10);

      var headlineMatch = block.match(/ТАҚЫРЫП:\s*([^\n]+)/);
      var summaryMatch = block.match(/МАЗМҰНЫ:\s*([\s\S]+)/);

      translatedMap[num] = {
        headline: headlineMatch ? headlineMatch[1].trim() : null,
        summary: summaryMatch ? summaryMatch[1].trim() : null,
      };
    });

    return items.map(function (it, i) {
      var t = translatedMap[i + 1];
      if (!t) return it;
      return Object.assign({}, it, {
        headline: t.headline || it.headline,
        summary: t.summary && t.summary !== "(жоқ)" ? t.summary : it.summary,
      });
    });
  } catch (err) {
    return items;
  }
}

export async function GET() {
  try {
    var finnhubKey = process.env.FINNHUB_API_KEY;
    var geminiKey = process.env.GEMINI_API_KEY;

    if (!finnhubKey) {
      return Response.json(
        { error: "FINNHUB_API_KEY орнатылмаган" },
        { status: 200 }
      );
    }

    var url = "https://finnhub.io/api/v1/news?category=general&token=" + finnhubKey;

    var res;
    try {
      res = await fetch(url, { next: { revalidate: 3600 } });
    } catch (fetchErr) {
      return Response.json(
        { error: "Finnhub-ке сұрау жіберу кезінде кате", detail: fetchErr.message },
        { status: 200 }
      );
    }

    if (!res.ok) {
      var rawText = await res.text();
      return Response.json(
        { error: "Finnhub API катесi", status: res.status, detail: rawText.slice(0, 300) },
        { status: 200 }
      );
    }

    var data = await res.json();

    if (!Array.isArray(data)) {
      return Response.json({ news: [] });
    }

    var cleaned = data.slice(0, 25).map(function (item) {
      return {
        id: item.id,
        headline: item.headline || "",
        summary: item.summary || "",
        source: item.source || "",
        url: item.url || "",
        image: item.image || "",
        datetime: item.datetime || 0,
        related: item.related || "",
      };
    });

    var translated = await translateItems(cleaned, geminiKey);

    return Response.json({ news: translated });
  } catch (err) {
    return Response.json(
      { error: "Жалпы кате", detail: (err && err.message) ? err.message : String(err) },
      { status: 200 }
    );
  }
}
