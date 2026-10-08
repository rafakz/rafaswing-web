/**
 * Свинг-трейдинг мақсаттары.
 *
 * Тейк-профит TP1 — кіру бағасынан әрқашан +15%.
 * TP2 — Swing Score-ға қарай +25%..+60% аралығында (ең көбі +200% шегімен).
 * Стоп-лосс (тәуекел) — Core Engine-ның өз мәні сақталады; жоқ болса, -3%.
 *
 * Ескерту: мұндай мақсаттар автоматты есеп, инвестиция кеңесі емес.
 */

export const TP_MIN_PCT = 15;
export const TP_MAX_PCT = 200;

function round2(v) {
  return Math.round(v * 100) / 100;
}

function clampPct(p) {
  return Math.min(TP_MAX_PCT, Math.max(TP_MIN_PCT, p));
}

/**
 * plan — computeTradePlan-нан келетін объект (stopLoss-ты пайдаланамыз);
 * price — ағымдағы баға; swingScore — 0..100.
 */
export function applySwingTargets(plan, price, swingScore) {
  if (typeof price !== "number" || !isFinite(price) || price <= 0) return plan;

  const base = plan && typeof plan === "object" ? plan : {};
  const entry = round2(price);

  const stop =
    typeof base.stopLoss === "number" && base.stopLoss > 0 && base.stopLoss < entry
      ? base.stopLoss
      : entry * 0.97;

  const risk = entry - stop;
  if (!(risk > 0)) return plan;

  const score = typeof swingScore === "number" && isFinite(swingScore) ? swingScore : 50;
  const tp1Pct = clampPct(TP_MIN_PCT);
  const tp2Pct = clampPct(score >= 70 ? 60 : score >= 60 ? 40 : 25);

  const reward = entry * (tp1Pct / 100);

  return {
    ...base,
    entry: entry,
    stopLoss: round2(stop),
    takeProfit1: round2(entry * (1 + tp1Pct / 100)),
    takeProfit2: round2(entry * (1 + tp2Pct / 100)),
    tp1Pct: tp1Pct,
    tp2Pct: tp2Pct,
    riskReward: round2(reward / risk),
  };
}
