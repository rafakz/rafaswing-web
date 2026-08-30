import {
  computeTechnicals,
  computePivot,
  calculateSwingScoreV2,
  calculateROC,
  computeTradePlan,
} from "../../../lib/tradeiq-engine";

function numOrNull(v) {
  return typeof v === "number" && !isNaN(v) ? v : null;
}

export async function GET(request) {
  var searchParams = new URL(request.url).searchParams;
  var symbol = searchParams.get("symbol");

  if (!symbol) {
    return Response.json({ error: "Ticker керек" }, { status: 400 });
  }

  var finnhubKey = process.env.FINNHUB_API_KEY;
  var alphaKey = process.env.ALPHAVANTAGE_API_KEY;

  if (!finnhubKey) {
    return Response.json(
      { error: "Finnhub API key орнатылмаган" },
      { status: 500 }
    );
  }

  try {
    var quoteUrl = "https://finnhub.io/api/v1/quote?symbol=" + symbol + "&token=" + finnhubKey;
    var profileUrl = "https://finnhub.io/api/v1/stock/profile2?symbol=" + symbol + "&token=" + finnhubKey;
    var metricUrl = "https://finnhub.io/api/v1/stock/metric?symbol=" + symbol + "&metric=all&token=" + finnhubKey;
    var earningsUrl = "https://finnhub.io/api/v1/calendar/earnings?symbol=" + symbol + "&token=" + finnhubKey;
    var sentimentUrl = "https://finnhub.io/api/v1/news-sentiment?symbol=" + symbol + "&token=" + finnhubKey;

    var quoteRes = await fetch(quoteUrl, { next: { revalidate: 60 } });
    var profileRes = await fetch(profileUrl, { next: { revalidate: 86400 } });
    var metricRes = await fetch(metricUrl, { next: { revalidate: 86400 } });
    var earningsRes = await fetch(earningsUrl, { next: { revalidate: 43200 } });
    var sentimentRes = await fetch(sentimentUrl, { next: { revalidate: 43200 } });

    if (!quoteRes.ok) {
      var quoteErrText = await quoteRes.text();
      return Response.json(
        {
          error: "Quote API катесi",
          status: quoteRes.status,
          detail: quoteErrText.slice(0, 300)
        },
        { status: 502 }
      );
    }

    var quote = await quoteRes.json();
    var profile = profileRes.ok ? await profileRes.json() : {};
    var metricData = metricRes.ok ? await metricRes.json() : {};
    var metric = (metricData && metricData.metric) ? metricData.metric : {};

    if (!quote || typeof quote.c !== "number" || quote.c === 0) {
      return Response.json(
        { error: "Ticker табылмады немесе деректер жок" },
        { status: 404 }
      );
    }

    var peValue = numOrNull(metric.peExclExtraTTM) ?? numOrNull(metric.peTTM) ?? numOrNull(metric.peNormalizedAnnual);
    var epsValue = (peValue !== null && peValue > 0) ? quote.c / peValue : (numOrNull(metric.epsExclExtraItemsTTM) ?? numOrNull(metric.epsTTM));

    var fundamentals = {
      pe: peValue,
      eps: epsValue,
      roe: numOrNull(metric.roeTTM),
      netMargin: numOrNull(metric.netProfitMarginTTM),
      revenueGrowth: numOrNull(metric.revenueGrowthTTMYoy),
      epsGrowth: numOrNull(metric.epsGrowthTTMYoy),
      dividendYield: numOrNull(metric.dividendYieldIndicatedAnnual),
      week52High: numOrNull(metric["52WeekHigh"]),
      week52Low: numOrNull(metric["52WeekLow"]),
      beta: numOrNull(metric.beta)
    };

    var earningsInfo = null;
    try {
      var earningsData = earningsRes.ok ? await earningsRes.json() : null;
      var calendar = (earningsData && Array.isArray(earningsData.earningsCalendar)) ? earningsData.earningsCalendar : [];

      if (calendar.length > 0) {
        var todayStr = new Date().toISOString().slice(0, 10);
        var sortedCal = calendar.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });

        var next = sortedCal.find(function (e) { return e.date >= todayStr; });
        var lastPast = sortedCal.slice().reverse().find(function (e) { return e.date < todayStr; });

        earningsInfo = {
          nextDate: next ? next.date : null,
          lastDate: lastPast ? lastPast.date : null,
          lastEpsActual: lastPast ? numOrNull(lastPast.epsActual) : null,
          lastEpsEstimate: lastPast ? numOrNull(lastPast.epsEstimate) : null
        };
      }
    } catch (e) {
      earningsInfo = null;
    }

    var sentimentInfo = null;
    try {
      var sentData = sentimentRes.ok ? await sentimentRes.json() : null;
      if (sentData && sentData.sentiment) {
        var bullish = numOrNull(sentData.sentiment.bullishPercent);
        var bearish = numOrNull(sentData.sentiment.bearishPercent);
        var newsScore = numOrNull(sentData.companyNewsScore);
        if (bullish !== null || bearish !== null) {
          sentimentInfo = {
            bullishPercent: bullish !== null ? Math.round(bullish * 100) : null,
            bearishPercent: bearish !== null ? Math.round(bearish * 100) : null,
            newsScore: newsScore !== null ? Math.round(newsScore * 100) : null
          };
        }
      }
    } catch (e) {
      sentimentInfo = null;
    }

    // ---------- Core Engine арқылы техникалық деректер ----------
    var technicals = null;
    var history = [];
    var volumeInfo = null;
    var pivot = null;

    if (alphaKey) {
      var alphaUrl = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + symbol + "&outputsize=compact&apikey=" + alphaKey;
      var alphaRes = await fetch(alphaUrl, { next: { revalidate: 1800 } });
      var alphaData = alphaRes.ok ? await alphaRes.json() : null;

      var series = alphaData ? alphaData["Time Series (Daily)"] : null;

      if (series) {
        var allDates = Object.keys(series).sort();
        // Есептеу үшін соңғы 300 күнді аламыз (EMA200 үшін жеткілікті буфер)
        var calcDates = allDates.slice(-300);

        var closes = calcDates.map(function (d) {
          return parseFloat(series[d]["4. close"]);
        });
        var volumes = calcDates.map(function (d) {
          return parseFloat(series[d]["5. volume"]);
        });

        var computed = computeTechnicals(closes, volumes);
        technicals = computed.technicals;
        volumeInfo = computed.volumeInfo;

        var last30dates = allDates.slice(-30);
        history = last30dates.map(function (d) {
          return { date: d, close: parseFloat(series[d]["4. close"]) };
        });

        // Support/Resistance: классикалық pivot point (соңғы толық сауда күні бойынша)
        var lastDateKey = allDates[allDates.length - 1];
        var lastDay = series[lastDateKey];
        var lh = parseFloat(lastDay["2. high"]);
        var ll = parseFloat(lastDay["3. low"]);
        var lc = parseFloat(lastDay["4. close"]);

        pivot = computePivot(lh, ll, lc);
      } else {
        technicals = {
          rsi: null,
          sma20: null,
          sma50: null,
          macd: null,
          ema20: null,
          ema50: null,
          ema200: null,
          debugAlphaError: alphaData ? (alphaData["Note"] || alphaData["Information"] || "no_series") : "fetch_failed"
        };
      }
    } else {
      technicals = {
        rsi: null,
        sma20: null,
        sma50: null,
        macd: null,
        ema20: null,
        ema50: null,
        ema200: null,
        debugAlphaError: "ALPHAVANTAGE_API_KEY жок"
      };
    }

    var roc = (typeof closes !== "undefined" && closes) ? calculateROC(closes, 10) : null;
    var scoreResult = calculateSwingScoreV2({ technicals, volumeInfo, sentimentInfo, fundamentals, roc });
    var swingScore = scoreResult ? scoreResult.score : null;
    var swingScoreBreakdown = scoreResult ? scoreResult.breakdown : null;
    var tradePlan = computeTradePlan(pivot, quote.c);

    return Response.json({
      symbol: symbol,
      name: profile.name || symbol,
      logo: profile.logo || null,
      currentPrice: quote.c,
      change: quote.d,
      changePercent: quote.dp,
      high: quote.h,
      low: quote.l,
      open: quote.o,
      previousClose: quote.pc,
      marketCap: profile.marketCapitalization || null,
      industry: profile.finnhubIndustry || null,
      technicals: technicals,
      history: history,
      volume: volumeInfo,
      pivot: pivot,
      sentiment: sentimentInfo,
      swingScore: swingScore,
      swingScoreBreakdown: swingScoreBreakdown,
      tradePlan: tradePlan,
      fundamentals: fundamentals,
      earnings: earningsInfo
    });
  } catch (err) {
    return Response.json(
      {
        error: "Деректерді алу кезінде кате шыкты",
        detail: err.message
      },
      { status: 500 }
    );
  }
}
