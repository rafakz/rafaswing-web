function calculateSMA(closes, period) {
  if (!closes || closes.length < period) return null;
  const slice = closes.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

function calculateRSI(closes, period = 14) {
  if (!closes || closes.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calculateEMA(closes, period) {
  if (!closes || closes.length < period) return null;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }

  return ema;
}

function calculateMACD(closes) {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);

  if (ema12 === null || ema26 === null) return null;

  return ema12 - ema26;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return Response.json({ error: "Ticker керек" }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "API key орнатылмаған (FINNHUB_API_KEY жоқ)" },
      { status: 500 }
    );
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const from = now - 60 * 60 * 24 * 200; // 200 күн бұрын (буферге)

    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
    const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`;
    const candleUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${now}&token=${apiKey}`;

    const quoteRes = await fetch(quoteUrl);
    const profileRes = await fetch(profileUrl);
    const candleRes = await fetch(candleUrl);

    if (!quoteRes.ok) {
      const text = await quoteRes.text();
      return Response.json(
        {
          error: "Quote API қатесі",
          status: quoteRes.status,
          detail: text.slice(0, 300),
        },
        { status: 502 }
      );
    }

    const quote = await quoteRes.json();
    const profile = profileRes.ok ? await profileRes.json() : {};
    const candle = candleRes.ok ? await candleRes.json() : { s: "error" };

    if (!quote || typeof quote.c !== "number" || quote.c === 0) {
      return Response.json(
        { error: "Ticker табылмады немесе деректер жоқ", rawQuote: quote },
        { status: 404 }
      );
    }

    let technicals = null;

    if (candle && candle.s === "ok" && Array.isArray(candle.c) && candle.c.length > 0) {
      const closes = candle.c;

      const rsi = calculateRSI(closes, 14);
      const sma20 = calculateSMA(closes, 20);
      const sma50 = calculateSMA(closes, 50);
      const macd = calculateMACD(closes);

      technicals = {
        rsi: rsi !== null ? Number(rsi.toFixed(2)) : null,
        sma20: sma20 !== null ? Number(sma20.toFixed(2)) : null,
        sma50: sma50 !== null ? Number(sma50.toFixed(2)) : null,
        macd: macd !== null ? Number(macd.toFixed(2)) : null,
      };
    } else {
      // candle деректері жоқ болса, себебін көрсетеміз (debug үшін)
      technicals = {
        rsi: null,
        sma20: null,
        sma50: null,
        macd: null,
        _debug_candle_status: candle ? candle.s : "no_response",
      };
    }

    return Response.json({
      symbol,
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
      technicals,
    });
  } catch (err) {
    return Response.json(
      {
        error: "Деректерді алу кезінде қате шықты",
        detail: err.message,
        stack: err.stack,
      },
      { status: 500 }
    );
  }
}
