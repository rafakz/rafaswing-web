function calculateSMA(closes, period) {
  if (!closes || closes.length < period) return null;
  var slice = closes.slice(-period);
  var sum = slice.reduce(function (a, b) { return a + b; }, 0);
  return sum / period;
}

function calculateRSI(closes, period) {
  if (!period) period = 14;
  if (!closes || closes.length < period + 1) return null;

  var gains = 0;
  var losses = 0;

  for (var i = closes.length - period; i < closes.length; i++) {
    var diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  var avgGain = gains / period;
  var avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  var rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calculateEMA(closes, period) {
  if (!closes || closes.length < period) return null;
  var k = 2 / (period + 1);
  var ema = closes.slice(0, period).reduce(function (a, b) { return a + b; }, 0) / period;

  for (var i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }

  return ema;
}

function calculateMACD(closes) {
  var ema12 = calculateEMA(closes, 12);
  var ema26 = calculateEMA(closes, 26);

  if (ema12 === null || ema26 === null) return null;

  return ema12 - ema26;
}

function numOrNull(v) {
  return typeof v === "number" && !isNaN(v) ? v : null;
}

function round2(v) {
  return v !== null && typeof v === "number" ? Number(v.toFixed(2)) : null;
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

    var technicals = null;
    var history = [];
    var volumeInfo = null;
    var pivot = null;
    var ema20 = null, ema50 = null, ema200 = null;

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

        var rsi = calculateRSI(closes, 14);
        var sma20 = calculateSMA(closes, 20);
        var sma50 = calculateSMA(closes, 50);
        var macd = calculateMACD(closes);

        ema20 = calculateEMA(closes, 20);
        ema50 = calculateEMA(closes, 50);
        ema200 = calculateEMA(closes, 200);

        technicals = {
          rsi: rsi !== null ? Number(rsi.toFixed(2)) : null,
          sma20: sma20 !== null ? Number(sma20.toFixed(2)) : null,
          sma50: sma50 !== null ? Number(sma50.toFixed(2)) : null,
          macd: macd !== null ? Number(macd.toFixed(2)) : null,
          ema20: round2(ema20),
          ema50: round2(ema50),
          ema200: round2(ema200)
        };

        var last30dates = allDates.slice(-30);
        history = last30dates.map(function (d) {
          return { date: d, close: parseFloat(series[d]["4. close"]) };
        });

        var latestVolume = volumes[volumes.length - 1];
        var vol20 = volumes.slice(-20);
        var avgVolume20 = vol20.length > 0 ? vol20.reduce(function (a, b) { return a + b; }, 0) / vol20.length : null;

        volumeInfo = {
          latest: numOrNull(latestVolume),
          avg20: avgVolume20 !== null ? Math.round(avgVolume20) : null,
          ratio: (avgVolume20 && avgVolume20 > 0) ? Number((latestVolume / avgVolume20).toFixed(2)) : null
        };

        // Support/Resistance: классикалық pivot point (соңғы толық сауда күні бойынша)
        var lastDateKey = allDates[allDates.length - 1];
        var lastDay = series[lastDateKey];
        var lh = parseFloat(lastDay["2. high"]);
        var ll = parseFloat(lastDay["3. low"]);
        var lc = parseFloat(lastDay["4. close"]);

        if (!isNaN(lh) && !isNaN(ll) && !isNaN(lc)) {
          var p = (lh + ll + lc) / 3;
          pivot = {
            level: round2(p),
            r1: round2(2 * p - ll),
            r2: round2(p + (lh - ll)),
            s1: round2(2 * p - lh),
            s2: round2(p - (lh - ll))
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

    // ---------- SWING SCORE (0-100) ----------
    var swingScore = null;
    if (technicals) {
      var score = 50;
      var hasAnySignal = false;

      if (technicals.rsi !== null) {
        hasAnySignal = true;
        if (technicals.rsi < 30) score += 15;
        else if (technicals.rsi > 70) score -= 15;
      }
      if (technicals.macd !== null) {
        hasAnySignal = true;
        score += technicals.macd > 0 ? 15 : -15;
      }
      if (technicals.sma20 !== null && technicals.sma50 !== null) {
        hasAnySignal = true;
        score += technicals.sma20 > technicals.sma50 ? 15 : -15;
      }
      if (technicals.ema20 !== null && technicals.ema50 !== null && technicals.ema200 !== null) {
        hasAnySignal = true;
        if (technicals.ema20 > technicals.ema50 && technicals.ema50 > technicals.ema200) score += 15;
        else if (technicals.ema20 < technicals.ema50 && technicals.ema50 < technicals.ema200) score -= 15;
      }
      if (volumeInfo && volumeInfo.ratio !== null) {
        hasAnySignal = true;
        if (volumeInfo.ratio > 1.2) score += 10;
        else if (volumeInfo.ratio < 0.7) score -= 5;
      }
      if (sentimentInfo && sentimentInfo.bullishPercent !== null && sentimentInfo.bearishPercent !== null) {
        hasAnySignal = true;
        score += (sentimentInfo.bullishPercent - sentimentInfo.bearishPercent) * 0.2;
      }

      if (hasAnySignal) {
        score = Math.round(Math.max(0, Math.min(100, score)));
        swingScore = score;
      }
    }

    // ---------- TRADE PLAN (Entry / Stop Loss / Take Profit) ----------
    var tradePlan = null;
    if (pivot) {
      var entry = quote.c;
      var stopLoss = (pivot.s1 !== null && pivot.s1 < entry) ? pivot.s1 : Number((entry * 0.97).toFixed(2));
      var tp1 = (pivot.r1 !== null && pivot.r1 > entry) ? pivot.r1 : Number((entry * 1.03).toFixed(2));
      var tp2 = (pivot.r2 !== null && pivot.r2 > tp1) ? pivot.r2 : Number((tp1 * 1.02).toFixed(2));

      var riskAmount = entry - stopLoss;
      var rewardAmount = tp1 - entry;
      var riskReward = (riskAmount > 0) ? Number((rewardAmount / riskAmount).toFixed(2)) : null;

      tradePlan = {
        entry: round2(entry),
        stopLoss: round2(stopLoss),
        takeProfit1: round2(tp1),
        takeProfit2: round2(tp2),
        riskReward: riskReward
      };
    }

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
