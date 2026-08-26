const SCREENER_SYMBOLS = ["AMD", "INTC", "CRM", "QCOM", "ADBE", "NVDA", "MSFT", "AAPL"];

async function fetchOne(symbol, apiKey) {
  try {
    const quoteUrl =
      "https://finnhub.io/api/v1/quote?symbol=" + symbol + "&token=" + apiKey;
    const metricUrl =
      "https://finnhub.io/api/v1/stock/metric?symbol=" +
      symbol +
      "&metric=all&token=" +
      apiKey;

    const [quoteRes, metricRes] = await Promise.all([
      fetch(quoteUrl),
      fetch(metricUrl),
    ]);

    if (!quoteRes.ok) return { symbol, error: true };

    const quote = await quoteRes.json();
    const metricJson = metricRes.ok ? await metricRes.json() : null;
    const metric = metricJson && metricJson.metric ? metricJson.metric : {};

    const pe =
      typeof metric.peTTM === "number"
        ? metric.peTTM
        : typeof metric.peNormalizedAnnual === "number"
        ? metric.peNormalizedAnnual
        : null;

    const roe =
      typeof metric.roeTTM === "number"
        ? metric.roeTTM
        : typeof metric.roeRfy === "number"
        ? metric.roeRfy
        : null;

    return {
      symbol: symbol,
      price: typeof quote.c === "number" ? quote.c : null,
      changePercent: typeof quote.dp === "number" ? quote.dp : null,
      pe: pe,
      roe: roe,
    };
  } catch (err) {
    return { symbol: symbol, error: true };
  }
}

export async function GET(request) {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "FINNHUB_API_KEY орнатылмаған" },
      { status: 500 }
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const maxPE = searchParams.get("maxPE");
  const minROE = searchParams.get("minROE");

  try {
    const results = await Promise.all(
      SCREENER_SYMBOLS.map((sym) => fetchOne(sym, apiKey))
    );

    let filtered = results.filter((r) => !r.error);

    if (maxPE) {
      const maxPEVal = parseFloat(maxPE);
      filtered = filtered.filter(
        (r) => typeof r.pe === "number" && r.pe <= maxPEVal
      );
    }

    if (minROE) {
      const minROEVal = parseFloat(minROE);
      filtered = filtered.filter(
        (r) => typeof r.roe === "number" && r.roe * 100 >= minROEVal
      );
    }

    return Response.json({ results: filtered });
  } catch (err) {
    return Response.json(
      { error: "Скринер деректерін алу кезінде қате", detail: err.message },
      { status: 500 }
    );
  }
}
