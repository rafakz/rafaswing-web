export const revalidate = 3600; // сағат сайын жаңарады

export async function GET() {
  try {
    var apiKey = process.env.FINNHUB_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "FINNHUB_API_KEY орнатылмаган" },
        { status: 200 }
      );
    }

    var url = "https://finnhub.io/api/v1/news?category=general&token=" + apiKey;

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

    var cleaned = data.slice(0, 40).map(function (item) {
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

    return Response.json({ news: cleaned });
  } catch (err) {
    return Response.json(
      { error: "Жалпы кате", detail: (err && err.message) ? err.message : String(err) },
      { status: 200 }
    );
  }
}
