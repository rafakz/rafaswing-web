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

    var quoteRes = await fetch(quoteUrl);
    var profileRes = await fetch(profileUrl);

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

    if (!quote || typeof quote.c !== "number" || quote.c === 0) {
      return Response.json(
        { error: "Ticker табылмады немесе деректер жок" },
        { status: 404 }
      );
    }

    var technicals = null;
    var history = [];

    if (alphaKey) {
      var alphaUrl = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + symbol + "&outputsize=compact&apikey=" + alphaKey;
      var alphaRes = await fetch(alphaUrl);
      var alphaData = alphaRes.ok ? await alphaRes.json() : null;

      var series = alphaData ? alphaData["Time Series (Daily)"] : null;

      if (series) {
        var dates = Object.keys(series).sort();
        var closes = dates.map(function (d) {
          return parseFloat(series[d]["4. close"]);
        });

        var rsi = calculateRSI(closes, 14);
        var sma20 = calculateSMA(closes, 20);
        var sma50 = calculateSMA(closes, 50);
        var macd = calculateMACD(closes);

        technicals = {
          rsi: rsi !== null ? Number(rsi.toFixed(2)) : null,
          sma20: sma20 !== null ? Number(sma20.toFixed(2)) : null,
          sma50: sma50 !== null ? Number(sma50.toFixed(2)) : null,
          macd: macd !== null ? Number(macd.toFixed(2)) : null
        };

        var last30dates = dates.slice(-30);
        history = last30dates.map(function (d) {
          return { date: d, close: parseFloat(series[d]["4. close"]) };
        });
      } else {
        technicals = {
          rsi: null,
          sma20: null,
          sma50: null,
          macd: null,
          debugAlphaError: alphaData ? (alphaData["Note"] || alphaData["Information"] || "no_series") : "fetch_failed"
        };
      }
    } else {
      technicals = {
        rsi: null,
        sma20: null,
        sma50: null,
        macd: null,
        debugAlphaError: "ALPHAVANTAGE_API_KEY жок"
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
      history: history
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
