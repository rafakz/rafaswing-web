import {
  computeTechnicals,
  computePivot,
  calculateSwingScore,
  computeTradePlan,
  getSignal,
} from "../../../lib/tradeiq-engine";

/**
 * Қаржылық секторсыз, әртүрлі салалардан тұратын әртараптандырылған
 * тізім (~22 тікер). Alpha Vantage тегін тарифінің күндік лимиті
 * (25 сұраныс/күн) шеңберінде қалу үшін тізім осы мөлшерде ұсталады.
 */
const AI_SCREENER_UNIVERSE = [
  // Технология
  "AAPL", "MSFT", "NVDA", "AMD", "CRM", "ADBE", "QCOM", "ORCL",
  // Коммуникация / медиа
  "GOOGL", "META", "NFLX",
  // Тұтыну тауарлары
  "AMZN", "TSLA", "NKE", "SBUX",
  // Денсаулық сақтау
  "UNH", "LLY", "JNJ",
  // Энергетика
  "XOM", "CVX",
  // Өнеркәсіп
  "CAT", "BA",
];

function numOrNull(v) {
  return typeof v === "number" && !isNaN(v) ? v : null;
}

async function scanSymbol(symbol, finnhubKey, alphaKey) {
  try {
    const quoteUrl = "https://finnhub.io/api/v1/quote?symbol=" + symbol + "&token=" + finnhubKey;
    const quoteRes = await fetch(quoteUrl, { next: { revalidate: 3600 } });
    if (!quoteRes.ok) return { symbol, error: true };
    const quote = await quoteRes.json();
    if (!quote || typeof quote.c !== "number" || quote.c === 0) {
      return { symbol, error: true };
    }

    let technicals = null;
    let volumeInfo = null;
    let pivot = null;

    if (alphaKey) {
      const alphaUrl =
        "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" +
        symbol +
        "&outputsize=compact&apikey=" +
        alphaKey;
      const alphaRes = await fetch(alphaUrl, { next: { revalidate: 86400 } });
      const alphaData = alphaRes.ok ? await alphaRes.json() : null;
      const series = alphaData ? alphaData["Time Series (Daily)"] : null;

      if (series) {
        const allDates = Object.keys(series).sort();
        const calcDates = allDates.slice(-300);
        const closes = calcDates.map((d) => parseFloat(series[d]["4. close"]));
        const volumes = calcDates.map((d) => parseFloat(series[d]["5. volume"]));

        const computed = computeTechnicals(closes, volumes);
        technicals = computed.technicals;
        volumeInfo = computed.volumeInfo;

        const lastDateKey = allDates[allDates.length - 1];
        const lastDay = series[lastDateKey];
        pivot = computePivot(
          parseFloat(lastDay["2. high"]),
          parseFloat(lastDay["3. low"]),
          parseFloat(lastDay["4. close"])
        );
      }
    }

    const swingScore = calculateSwingScore(technicals, volumeInfo, null);
    const tradePlan = computeTradePlan(pivot, quote.c);
    const signal = technicals ? getSignal(technicals, quote.c) : null;

    return {
      symbol,
      currentPrice: quote.c,
      changePercent: quote.dp,
      swingScore,
      signal,
      tradePlan,
    };
  } catch (err) {
    return { symbol, error: true };
  }
}

export async function GET(request) {
  const finnhubKey = process.env.FINNHUB_API_KEY;
  const alphaKey = process.env.ALPHAVANTAGE_API_KEY;

  if (!finnhubKey) {
    return Response.json({ error: "FINNHUB_API_KEY орнатылмаған" }, { status: 500 });
  }

  const searchParams = new URL(request.url).searchParams;
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  try {
    const results = await Promise.all(
      AI_SCREENER_UNIVERSE.map((sym) => scanSymbol(sym, finnhubKey, alphaKey))
    );

    const valid = results.filter((r) => !r.error && typeof r.swingScore === "number");
    const failed = results.filter((r) => r.error || typeof r.swingScore !== "number");

    valid.sort((a, b) => b.swingScore - a.swingScore);

    return Response.json({
      candidates: valid.slice(0, limit),
      scannedCount: results.length,
      skippedCount: failed.length,
      universe: AI_SCREENER_UNIVERSE,
    });
  } catch (err) {
    return Response.json(
      { error: "AI screener қатесі", detail: err.message },
      { status: 500 }
    );
  }
}
