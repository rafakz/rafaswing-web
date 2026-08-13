async function translateToKazakh(text) {
  if (!text) return text;
  try {
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=kk&dt=t&q=" + encodeURIComponent(text);
    var res = await fetch(url);
    if (!res.ok) return text;
    var data = await res.json();
    var translated = data[0].map(function (chunk) { return chunk[0]; }).join("");
    return translated || text;
  } catch (err) {
    return text;
  }
}

export async function GET(request) {
  var searchParams = new URL(request.url).searchParams;
  var symbol = searchParams.get("symbol");

  if (!symbol) {
    return Response.json({ error: "Ticker керек" }, { status: 400 });
  }

  var apiKey = process.env.FINNHUB_API_KEY;

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

    var topItems = newsData.slice(0, 6);

    var news = await Promise.all(
      topItems.map(async function (item) {
        var kkHeadline = await translateToKazakh(item.headline);
        return {
          headline: kkHeadline,
          headlineOriginal: item.headline,
          source: item.source,
          url: item.url,
          datetime: item.datetime
        };
      })
    );

    return Response.json({ symbol: symbol, news: news });
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
