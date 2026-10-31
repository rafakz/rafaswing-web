"use client";

import { color, font, radius, space } from "../lib/theme";
import { HINTS } from "../lib/metric-hints";
import { computeAtr, avgVolume } from "../lib/metrics";
import { Card } from "./ui";

function safeNum(v, digits) {
  return typeof v !== "number" || isNaN(v) ? "—" : v.toFixed(digits);
}

function fmtVolume(v) {
  if (typeof v !== "number" || isNaN(v)) return "—";
  if (v >= 1e9) return (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return String(Math.round(v));
}

/* Бағалау: мән + түс (theme.js түстері) */
function evaluate(key, value) {
  if (typeof value !== "number" || isNaN(value)) return null;
  if (key === "pe") {
    if (value > 0 && value < 15) return { text: "Тартымды", c: color.gainStrong };
    if (value >= 15 && value <= 25) return { text: "Қалыпты", c: color.neutral };
    return { text: "Қымбат", c: color.lossStrong };
  }
  if (key === "debt") {
    if (value < 1) return { text: "Қауіпсіз", c: color.gainStrong };
    if (value <= 2) return { text: "Орташа", c: color.neutral };
    return { text: "Қауіпті", c: color.lossStrong };
  }
  if (key === "current") {
    if (value >= 1.5) return { text: "Өтімді", c: color.gainStrong };
    if (value >= 1) return { text: "Қалыпты", c: color.neutral };
    return { text: "Нашар", c: color.lossStrong };
  }
  if (key === "roe") {
    if (value >= 15) return { text: "Тиімді", c: color.gainStrong };
    if (value >= 5) return { text: "Қалыпты", c: color.neutral };
    return { text: "Тиімсіз", c: color.lossStrong };
  }
  if (key === "margin") {
    if (value >= 10) return { text: "Табысты", c: color.gainStrong };
    if (value > 0) return { text: "Аз маржа", c: color.neutral };
    return { text: "Шығын", c: color.lossStrong };
  }
  if (key === "pb") {
    if (value >= 1 && value <= 3) return { text: "Әділ", c: color.gainStrong };
    if (value > 0 && value < 1) return { text: "Арзан", c: color.neutral };
    return { text: "Қымбат", c: color.lossStrong };
  }
  return null;
}

function Tile({ title, value, verdict, hint }) {
  return (
    <Card padding={space.md} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: font.xs, color: color.textMuted }}>{title}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: space.sm }}>
        <span style={{ fontSize: font.lg, fontWeight: font.semibold, color: color.textPrimary }}>{value}</span>
        {verdict && (
          <span style={{ fontSize: font.xs, fontWeight: font.semibold, color: verdict.c }}>{verdict.text}</span>
        )}
      </div>
      {hint && (
        <div style={{ fontSize: font.xs, color: color.textMuted, lineHeight: 1.5, marginTop: space.xs }}>{hint}</div>
      )}
    </Card>
  );
}

const sectionTitle = {
  fontSize: font.xs,
  fontWeight: font.semibold,
  color: color.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.6px",
  margin: `${space.lg}px 0 ${space.md}px`,
};

const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: space.sm };

export default function FundamentalsPanel({ data, fmt }) {
  const f = data.fundamentals || {};
  const price = data.currentPrice;

  const atr = computeAtr(data.chartData);
  const avgVol = avgVolume(data.chartData);
  const inst = typeof data.institutionalOwnership === "number" ? data.institutionalOwnership : null;

  const atrPct = atr !== null && typeof price === "number" && price > 0 ? (atr / price) * 100 : null;

  const pe = typeof f.peRatio === "number" ? f.peRatio : null;
  const debt = typeof f.debtToEquity === "number" ? f.debtToEquity : null;
  const current = typeof f.currentRatio === "number" ? f.currentRatio : null;
  const roe = typeof f.roe === "number" ? f.roe : null;
  const margin = typeof f.profitMargin === "number" ? f.profitMargin : null;
  const pb = typeof f.pbRatio === "number" ? f.pbRatio : null;

  return (
    <div>
      <div style={sectionTitle}>Фундаменталды талдау</div>

      <div style={{ ...grid2, marginBottom: space.sm }}>
        <Tile title="Нарық құны" value={data.marketCap ? "$" + (data.marketCap / 1000).toFixed(1) + "B" : "—"} hint={HINTS.marketCap} />
        <Tile title="EPS" value={typeof f.eps === "number" ? fmt(f.eps) : "—"} hint={HINTS.eps} />
        <Tile title="Дивиденд" value={f.dividendYield ? safeNum(f.dividendYield, 2) + "%" : "—"} hint={HINTS.dividend} />
      </div>

      <div style={grid2}>
        <Tile title="P/E" value={safeNum(pe, 2)} verdict={evaluate("pe", pe)} hint={HINTS.pe} />
        <Tile title="Қарыз / капитал" value={safeNum(debt, 2)} verdict={evaluate("debt", debt)} hint={HINTS.debtToEquity} />
        <Tile title="Өтімділік (Current)" value={safeNum(current, 2)} verdict={evaluate("current", current)} hint={HINTS.currentRatio} />
        <Tile title="ROE" value={roe !== null ? safeNum(roe, 2) + "%" : "—"} verdict={evaluate("roe", roe)} hint={HINTS.roe} />
        <Tile title="Таза маржа" value={margin !== null ? safeNum(margin, 2) + "%" : "—"} verdict={evaluate("margin", margin)} hint={HINTS.profitMargin} />
        <Tile title="P/B" value={safeNum(pb, 2)} verdict={evaluate("pb", pb)} hint={HINTS.pb} />
      </div>

      <div style={sectionTitle}>Тәуекел және өтімділік</div>
      <div style={grid2}>
        <Tile
          title="ATR (14 күн)"
          value={atr !== null ? fmt(atr) + (atrPct !== null ? ` (${atrPct.toFixed(1)}%)` : "") : "—"}
          hint={HINTS.atr}
        />
        <Tile title="Орташа көлем (20 күн)" value={fmtVolume(avgVol)} hint={HINTS.avgVolume} />
        <div style={{ gridColumn: "1 / -1" }}>
          <Tile
            title="Институционалдық иелік"
            value={inst !== null ? inst.toFixed(1) + "%" : "—"}
            hint={HINTS.institutional + (inst === null ? " Деректер әзірге қосылмаған." : "")}
          />
        </div>
      </div>
    </div>
  );
}
