import {
  computeTechnicals,
  computePivot,
  calculateSwingScoreV2,
  calculateROC,
  computeTradePlan,
  getSignal,
} from "../../../lib/tradeiq-engine";

/**
 * Қаржылық секторсыз, 5 әртүрлі салалардан тұратын сенімді тізім.
 * Alpha Vantage тегін тарифінің минуттық лимиті (5 сұраныс/минут)
 * шеңберінде толығымен сыятындай әдейі осылай шектелген —
 * барлық 5 акция да әрқашан нақты техникалық деректермен келеді.
 */
const AI_SCREENER_UNIVERSE = [
  "NVDA", // Технология
  "AMZN", // Тұтыну тауарлары / технология
  "UNH",  // Денсаулық сақтау
  "XOM",  // Энергетика
  "CAT",  // Өнеркәсіп
];

function numOrNull(v) {
  return typeof v === "number" && !isNaN(v) ? v : null;
}

async function scanSymbol(symbol, finnhubKey, alphaKey) {
  try {
    const quoteUrl = "https://finnhub.io/api/v1/quote?symbol=" + symbol + "&token=" + finnhubKey;
    const metricUrl = "https://finnhub.io/api/v1/stock/metric?symbol=" + symbol + "&metric=all&token=" + finnhubKey;

    const [quoteRes, metricRes] = await Promise.all([
      fetch(quoteUrl, { next: { revalidate: 3600 } }),
      fetch(metricUrl, { next: { revalidate: 86400 } }),
    ]);

    if (!quoteRes.ok) return { symbol, error: true };
    const quote = await quoteRes.json();
    if (!quote || typeof quote.c !== "number" || quote.c === 0) {
      return { symbol, error: true };
    }

    const metricData = metricRes.ok ? await metricRes.json() : null;
    const metric = metricData && metricData.metric ? metricData.metric : {};
    const fundamentals = {
      pe: numOrNull(metric.peExclExtraTTM) ?? numOrNull(metric.peTTM) ?? numOrNull(metric.peNormalizedAnnual),
      roe: numOrNull(metric.roeTTM),
      revenueGrowth: numOrNull(metric.revenueGrowthTTMYoy),
      epsGrowth: numOrNull(metric.epsGrowthTTMYoy),
      beta: numOrNull(metric.beta),
    };

    let technicals = null;
    let volumeInfo = null;
    let pivot = null;
    let roc = null;

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
        roc = calculateROC(closes, 10);

        const lastDateKey = allDates[allDates.length - 1];
        const lastDay = series[lastDateKey];
        pivot = computePivot(
          parseFloat(lastDay["2. high"]),
          parseFloat(lastDay["3. low"]),
          parseFloat(lastDay["4. close"])
        );
      }
    }

    const scoreResult = calculateSwingScoreV2({
      technicals,
      volumeInfo,
      sentimentInfo: null,
      fundamentals,
      roc,
    });
    const swingScore = scoreResult ? scoreResult.score : null;
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
