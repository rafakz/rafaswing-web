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
