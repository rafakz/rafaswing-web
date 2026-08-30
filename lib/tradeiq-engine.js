/**
 * TradeIQ Core Engine
 * ---------------------------------------------------------
 * Бір ғана орталық файл — техникалық көрсеткіштер, Swing Score,
 * сауда жоспары (Entry/Stop/TP) және сигнал (АЛУ/САТУ/ҰСТАУ)
 * есептеу логикасы осында жиналған.
 *
 * Бұл файл UI-ға тәуелсіз (түс/JSX жоқ) — server (route.js) және
 * client компоненттер (page.js, portfolio, screener) бірдей
 * пайдалана алады.
 *
 * Сигнал деңгейлері (level) тұрақты жолдар (constants):
 *   "strongBuy" | "buy" | "hold" | "sell" | "strongSell"
 * Әр бет осы деңгейге өз түс палитрасынан сәйкес түс тағайындайды.
 * ---------------------------------------------------------
 */

// ============================================================
// 1. ТЕХНИКАЛЫҚ КӨРСЕТКІШТЕР
// ============================================================

export function calculateSMA(closes, period) {
  if (!closes || closes.length < period) return null;
  const slice = closes.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

export function calculateRSI(closes, period = 14) {
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

export function calculateEMA(closes, period) {
  if (!closes || closes.length < period) return null;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }

  return ema;
}

export function calculateMACD(closes) {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  if (ema12 === null || ema26 === null) return null;
  return ema12 - ema26;
}

/**
 * EMA-ны толық тізбек ретінде қайтарады (әр индекске сәйкес мән),
 * chart-та overlay сызық ретінде салу үшін. `period`-тен төмен
 * индекстерде null тұрады.
 */
export function calculateEMASeries(closes, period) {
  if (!closes || closes.length === 0) return [];
  if (closes.length < period) return closes.map(() => null);

  const k = 2 / (period + 1);
  const series = new Array(closes.length).fill(null);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  series[period - 1] = ema;

  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    series[i] = ema;
  }

  return series;
}

function numOrNull(v) {
  return typeof v === "number" && !isNaN(v) ? v : null;
}

function round2(v) {
  return v !== null && typeof v === "number" ? Number(v.toFixed(2)) : null;
}

/**
 * Күнделікті баға тізімінен (closes[]) толық техникалық жинақ есептейді.
 * Volume тізімі болса, volume ratio-ды да қоса қайтарады.
 */
export function computeTechnicals(closes, volumes) {
  if (!closes || closes.length === 0) {
    return { technicals: null, volumeInfo: null, pivot: null };
  }

  const rsi = calculateRSI(closes, 14);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const macd = calculateMACD(closes);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);

  const technicals = {
    rsi: rsi !== null ? Number(rsi.toFixed(2)) : null,
    sma20: sma20 !== null ? Number(sma20.toFixed(2)) : null,
    sma50: sma50 !== null ? Number(sma50.toFixed(2)) : null,
    macd: macd !== null ? Number(macd.toFixed(2)) : null,
    ema20: round2(ema20),
    ema50: round2(ema50),
    ema200: round2(ema200),
  };

  let volumeInfo = null;
  if (volumes && volumes.length > 0) {
    const latestVolume = volumes[volumes.length - 1];
    const vol20 = volumes.slice(-20);
    const avgVolume20 =
      vol20.length > 0 ? vol20.reduce((a, b) => a + b, 0) / vol20.length : null;

    volumeInfo = {
      latest: numOrNull(latestVolume),
      avg20: avgVolume20 !== null ? Math.round(avgVolume20) : null,
      ratio:
        avgVolume20 && avgVolume20 > 0
          ? Number((latestVolume / avgVolume20).toFixed(2))
          : null,
    };
  }

  return { technicals, volumeInfo };
}

/**
 * Классикалық pivot point (support/resistance) — соңғы толық сауда күні бойынша.
 */
export function computePivot(high, low, close) {
  if (isNaN(high) || isNaN(low) || isNaN(close)) return null;
  const p = (high + low + close) / 3;
  return {
    level: round2(p),
    r1: round2(2 * p - low),
    r2: round2(p + (high - low)),
    s1: round2(2 * p - high),
    s2: round2(p - (high - low)),
  };
}

// ============================================================
// 2. SWING SCORE (0-100)
// ============================================================

export function calculateSwingScore(technicals, volumeInfo, sentimentInfo) {
  if (!technicals) return null;

  let score = 50;
  let hasAnySignal = false;

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

  if (!hasAnySignal) return null;
  return Math.round(Math.max(0, Math.min(100, score)));
}

// ============================================================
// 2.1 SWING SCORE 2.0 — салмақталған нұсқа
//   Technical 35% · Momentum 20% · Fundamental 20% ·
//   Volume 10% · Sentiment 10% · Risk 5%
// ============================================================

function clamp0to100(v) {
  return Math.max(0, Math.min(100, v));
}

/**
 * Rate of Change (%) — соңғы `period` сауда күніндегі баға өзгерісі.
 * Momentum компонентінің негізі.
 */
export function calculateROC(closes, period = 10) {
  if (!closes || closes.length < period + 1) return null;
  const past = closes[closes.length - 1 - period];
  const now = closes[closes.length - 1];
  if (!past || past === 0) return null;
  return ((now - past) / past) * 100;
}

/**
 * Fundamentals негізінде 0-100 сегмент score-ы.
 * ROE, кіріс/EPS өсімі, P/E орындылығы ескеріледі.
 */
export function calculateFundamentalScore(fundamentals) {
  if (!fundamentals) return null;

  let score = 50;
  let hasSignal = false;

  if (typeof fundamentals.roe === "number") {
    hasSignal = true;
    if (fundamentals.roe > 0.20) score += 15;
    else if (fundamentals.roe > 0.10) score += 7;
    else if (fundamentals.roe < 0) score -= 15;
  }

  if (typeof fundamentals.revenueGrowth === "number") {
    hasSignal = true;
    if (fundamentals.revenueGrowth > 0.15) score += 12;
    else if (fundamentals.revenueGrowth > 0) score += 5;
    else score -= 10;
  }

  if (typeof fundamentals.epsGrowth === "number") {
    hasSignal = true;
    if (fundamentals.epsGrowth > 0.15) score += 12;
    else if (fundamentals.epsGrowth > 0) score += 5;
    else score -= 10;
  }

  if (typeof fundamentals.pe === "number") {
    hasSignal = true;
    if (fundamentals.pe > 0 && fundamentals.pe < 30) score += 8;
    else if (fundamentals.pe <= 0 || fundamentals.pe > 60) score -= 10;
  }

  if (!hasSignal) return null;
  return Math.round(clamp0to100(score));
}

/**
 * Beta негізінде тәуекел сегменті (0-100). Төмен beta — тұрақтылық,
 * жоғары beta — үлкен тәуекел, сондықтан score төмендейді.
 */
function calculateRiskScore(fundamentals) {
  if (!fundamentals || typeof fundamentals.beta !== "number") return null;
  const beta = fundamentals.beta;
  const score = 100 - (beta - 1) * 40;
  return Math.round(clamp0to100(score));
}

function volumeSubScore(volumeInfo) {
  if (!volumeInfo || typeof volumeInfo.ratio !== "number") return null;
  if (volumeInfo.ratio > 1.5) return 80;
  if (volumeInfo.ratio > 1.2) return 65;
  if (volumeInfo.ratio < 0.5) return 25;
  if (volumeInfo.ratio < 0.7) return 40;
  return 50;
}

function sentimentSubScore(sentimentInfo) {
  if (!sentimentInfo || typeof sentimentInfo.bullishPercent !== "number" || typeof sentimentInfo.bearishPercent !== "number") {
    return null;
  }
  return Math.round(clamp0to100(50 + (sentimentInfo.bullishPercent - sentimentInfo.bearishPercent) / 2));
}

function momentumSubScore(roc) {
  if (typeof roc !== "number") return null;
  return Math.round(clamp0to100(50 + roc * 2));
}

/**
 * Swing Score 2.0 — салмақталған композиттік score.
 * Деректер жетіспеген компонент бейтарап (50) мәнмен ауыстырылады,
 * сондықтан жоқ деректер score-ды артық бұрмаламайды.
 *
 * Қайтарады: { score, breakdown } — breakdown әр компоненттің
 * үлесін көрсетеді (кейін AI Analyst "неге бұл score" деп
 * түсіндіргенде пайдаланылады).
 */
export function calculateSwingScoreV2({ technicals, volumeInfo, sentimentInfo, fundamentals, roc }) {
  const technicalScore = calculateSwingScore(technicals, volumeInfo, null);
  const momentumScore = momentumSubScore(roc);
  const fundamentalScore = calculateFundamentalScore(fundamentals);
  const volumeScore = volumeSubScore(volumeInfo);
  const sentimentScore = sentimentSubScore(sentimentInfo);
  const riskScore = calculateRiskScore(fundamentals);

  const hasAny =
    technicalScore !== null ||
    momentumScore !== null ||
    fundamentalScore !== null ||
    volumeScore !== null ||
    sentimentScore !== null ||
    riskScore !== null;

  if (!hasAny) return null;

  const weights = {
    technical: 0.35,
    momentum: 0.2,
    fundamental: 0.2,
    volume: 0.1,
    sentiment: 0.1,
    risk: 0.05,
  };

  const breakdown = {
    technical: technicalScore !== null ? technicalScore : 50,
    momentum: momentumScore !== null ? momentumScore : 50,
    fundamental: fundamentalScore !== null ? fundamentalScore : 50,
    volume: volumeScore !== null ? volumeScore : 50,
    sentiment: sentimentScore !== null ? sentimentScore : 50,
    risk: riskScore !== null ? riskScore : 50,
  };

  const total =
    breakdown.technical * weights.technical +
    breakdown.momentum * weights.momentum +
    breakdown.fundamental * weights.fundamental +
    breakdown.volume * weights.volume +
    breakdown.sentiment * weights.sentiment +
    breakdown.risk * weights.risk;

  return {
    score: Math.round(clamp0to100(total)),
    breakdown,
  };
}

// ============================================================
// 3. САУДА ЖОСПАРЫ (Entry / Stop Loss / Take Profit)
// ============================================================

export function computeTradePlan(pivot, currentPrice) {
  if (!pivot || typeof currentPrice !== "number") return null;

  const entry = currentPrice;
  const stopLoss = pivot.s1 !== null && pivot.s1 < entry ? pivot.s1 : Number((entry * 0.97).toFixed(2));
  const tp1 = pivot.r1 !== null && pivot.r1 > entry ? pivot.r1 : Number((entry * 1.03).toFixed(2));
  const tp2 = pivot.r2 !== null && pivot.r2 > tp1 ? pivot.r2 : Number((tp1 * 1.02).toFixed(2));

  const riskAmount = entry - stopLoss;
  const rewardAmount = tp1 - entry;
  const riskReward = riskAmount > 0 ? Number((rewardAmount / riskAmount).toFixed(2)) : null;

  return {
    entry: round2(entry),
    stopLoss: round2(stopLoss),
    takeProfit1: round2(tp1),
    takeProfit2: round2(tp2),
    riskReward,
  };
}

// ============================================================
// 4. СИГНАЛ (АЛУ / САТУ / ҰСТАУ)
// ============================================================

/**
 * technicals пен ағымдағы бағаны негізге алып, сигнал деңгейін
 * және себептерін қайтарады. level мәні тұрақты жол — түс/лейбл
 * тағайындауды шақырушы (page/portfolio/screener) өзі жасайды.
 */
export function getSignal(technicals, currentPrice) {
  if (!technicals || typeof technicals !== "object") return null;

  const rsi = typeof technicals.rsi === "number" ? technicals.rsi : null;
  const sma20 = typeof technicals.sma20 === "number" ? technicals.sma20 : null;
  const sma50 = typeof technicals.sma50 === "number" ? technicals.sma50 : null;
  const macd = typeof technicals.macd === "number" ? technicals.macd : null;
  const price = typeof currentPrice === "number" ? currentPrice : null;

  let score = 0;
  const reasons = [];

  if (rsi !== null) {
    if (rsi < 30) {
      score += 2;
      reasons.push("RSI артық сатылған аймақта (< 30)");
    } else if (rsi > 70) {
      score -= 2;
      reasons.push("RSI артық сатып алынған аймақта (> 70)");
    }
  }

  if (macd !== null) {
    if (macd > 0) {
      score += 1;
      reasons.push("MACD оң аймақта — өсу үрдісі");
    } else {
      score -= 1;
      reasons.push("MACD теріс аймақта — төмендеу үрдісі");
    }
  }

  if (sma20 !== null && sma50 !== null) {
    if (sma20 > sma50) {
      score += 1;
      reasons.push("SMA20 > SMA50 — қысқа мерзімді үрдіс жоғары");
    } else {
      score -= 1;
      reasons.push("SMA20 < SMA50 — қысқа мерзімді үрдіс төмен");
    }
  }

  if (sma20 !== null && price !== null) {
    score += price > sma20 ? 1 : -1;
  }

  if (reasons.length === 0) return null;

  let level = "hold";
  let label = "ҰСТАУ";

  if (score >= 3) {
    level = "strongBuy";
    label = "СЕНІМДІ САТЫП АЛУ";
  } else if (score >= 1) {
    level = "buy";
    label = "САТЫП АЛУ";
  } else if (score <= -3) {
    level = "strongSell";
    label = "СЕНІМДІ САТУ";
  } else if (score <= -1) {
    level = "sell";
    label = "САТУ";
  }

  return { level, label, reasons, score };
}

/**
 * Сигнал деңгейін (level) шақырушы беттің өз colors объектісіндегі
 * түске түрлендіру үшін ортақ карта. Мысалы:
 *   const color = SIGNAL_COLOR_KEY[signal.level]; // "gain" | "gainBright" | ...
 * содан кейін: colors[SIGNAL_COLOR_KEY[signal.level]]
 */
export const SIGNAL_COLOR_KEY = {
  strongBuy: "gain",
  buy: "gainBright",
  hold: "hold",
  sell: "lossBright",
  strongSell: "loss",
};

// ============================================================
// 5. ТОЛЫҚ АКЦИЯ ДЕРЕКТЕРІ (Finnhub + Alpha Vantage)
// ============================================================

/**
 * Бір symbol үшін Finnhub (quote/profile/metric/earnings/sentiment)
 * және Alpha Vantage (күнделікті OHLCV) деректерін алып, Core Engine
 * арқылы техникалық көрсеткіштер, Swing Score, сауда жоспарын
 * есептеп, дайын нәтиже қайтарады.
 *
 * Бұл функцияны /api/stock/route.js ЖӘНЕ /api/ai-screener/route.js
 * бірдей пайдаланады — деректерді алу логикасы бір ғана жерде.
 */
export async function fetchStockData(symbol, keys) {
  const finnhubKey = keys.finnhubKey;
  const alphaKey = keys.alphaKey;

  if (!finnhubKey) {
    return { error: "Finnhub API key орнатылмаган" };
  }

  const quoteUrl = "https://finnhub.io/api/v1/quote?symbol=" + symbol + "&token=" + finnhubKey;
  const profileUrl = "https://finnhub.io/api/v1/stock/profile2?symbol=" + symbol + "&token=" + finnhubKey;
  const metricUrl = "https://finnhub.io/api/v1/stock/metric?symbol=" + symbol + "&metric=all&token=" + finnhubKey;
  const earningsUrl = "https://finnhub.io/api/v1/calendar/earnings?symbol=" + symbol + "&token=" + finnhubKey;
  const sentimentUrl = "https://finnhub.io/api/v1/news-sentiment?symbol=" + symbol + "&token=" + finnhubKey;

  const quoteRes = await fetch(quoteUrl, { next: { revalidate: 60 } });
  const profileRes = await fetch(profileUrl, { next: { revalidate: 86400 } });
  const metricRes = await fetch(metricUrl, { next: { revalidate: 86400 } });
  const earningsRes = await fetch(earningsUrl, { next: { revalidate: 43200 } });
  const sentimentRes = await fetch(sentimentUrl, { next: { revalidate: 43200 } });

  if (!quoteRes.ok) {
    const quoteErrText = await quoteRes.text();
    return { error: "Quote API катесi", status: quoteRes.status, detail: quoteErrText.slice(0, 300) };
  }

  const quote = await quoteRes.json();
  const profile = profileRes.ok ? await profileRes.json() : {};
  const metricData = metricRes.ok ? await metricRes.json() : {};
  const metric = metricData && metricData.metric ? metricData.metric : {};

  if (!quote || typeof quote.c !== "number" || quote.c === 0) {
    return { error: "Ticker табылмады немесе деректер жок" };
  }

  const peValue =
    numOrNull(metric.peExclExtraTTM) ?? numOrNull(metric.peTTM) ?? numOrNull(metric.peNormalizedAnnual);
  const epsValue =
    peValue !== null && peValue > 0
      ? quote.c / peValue
      : numOrNull(metric.epsExclExtraItemsTTM) ?? numOrNull(metric.epsTTM);

  const fundamentals = {
    pe: peValue,
    eps: epsValue,
    roe: numOrNull(metric.roeTTM),
    netMargin: numOrNull(metric.netProfitMarginTTM),
    revenueGrowth: numOrNull(metric.revenueGrowthTTMYoy),
    epsGrowth: numOrNull(metric.epsGrowthTTMYoy),
    dividendYield: numOrNull(metric.dividendYieldIndicatedAnnual),
    week52High: numOrNull(metric["52WeekHigh"]),
    week52Low: numOrNull(metric["52WeekLow"]),
    beta: numOrNull(metric.beta),
  };

  let earningsInfo = null;
  try {
    const earningsData = earningsRes.ok ? await earningsRes.json() : null;
    const calendar =
      earningsData && Array.isArray(earningsData.earningsCalendar) ? earningsData.earningsCalendar : [];

    if (calendar.length > 0) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const sortedCal = calendar.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
      const next = sortedCal.find((e) => e.date >= todayStr);
      const lastPast = sortedCal
        .slice()
        .reverse()
        .find((e) => e.date < todayStr);

      earningsInfo = {
        nextDate: next ? next.date : null,
        lastDate: lastPast ? lastPast.date : null,
        lastEpsActual: lastPast ? numOrNull(lastPast.epsActual) : null,
        lastEpsEstimate: lastPast ? numOrNull(lastPast.epsEstimate) : null,
      };
    }
  } catch (e) {
    earningsInfo = null;
  }

  let sentimentInfo = null;
  try {
    const sentData = sentimentRes.ok ? await sentimentRes.json() : null;
    if (sentData && sentData.sentiment) {
      const bullish = numOrNull(sentData.sentiment.bullishPercent);
      const bearish = numOrNull(sentData.sentiment.bearishPercent);
      const newsScore = numOrNull(sentData.companyNewsScore);
      if (bullish !== null || bearish !== null) {
        sentimentInfo = {
          bullishPercent: bullish !== null ? Math.round(bullish * 100) : null,
          bearishPercent: bearish !== null ? Math.round(bearish * 100) : null,
          newsScore: newsScore !== null ? Math.round(newsScore * 100) : null,
        };
      }
    }
  } catch (e) {
    sentimentInfo = null;
  }

  let technicals = null;
  let history = [];
  let volumeInfo = null;
  let pivot = null;

  if (alphaKey) {
    const alphaUrl =
      "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" +
      symbol +
      "&outputsize=compact&apikey=" +
      alphaKey;
    const alphaRes = await fetch(alphaUrl, { next: { revalidate: 1800 } });
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

      const last30dates = allDates.slice(-30);
      history = last30dates.map((d) => ({ date: d, close: parseFloat(series[d]["4. close"]) }));

      const lastDateKey = allDates[allDates.length - 1];
      const lastDay = series[lastDateKey];
      const lh = parseFloat(lastDay["2. high"]);
      const ll = parseFloat(lastDay["3. low"]);
      const lc = parseFloat(lastDay["4. close"]);
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
        debugAlphaError: alphaData ? alphaData["Note"] || alphaData["Information"] || "no_series" : "fetch_failed",
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
      debugAlphaError: "ALPHAVANTAGE_API_KEY жок",
    };
  }

  const swingScore = calculateSwingScore(technicals, volumeInfo, sentimentInfo);
  const tradePlan = computeTradePlan(pivot, quote.c);

  return {
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
    history,
    volume: volumeInfo,
    pivot,
    sentiment: sentimentInfo,
    swingScore,
    tradePlan,
    fundamentals,
    earnings: earningsInfo,
  };
}

/** Берілген миллисекунд уақытша күту (rate-limit сақтау үшін) */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
