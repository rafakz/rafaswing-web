"use client";

/**
 * ProChart — candlestick графигі + EMA20/EMA50 overlay + volume
 * + support/resistance (pivot) + Entry/Stop/TP1/TP2 деңгейлері.
 *
 * props:
 *   chartData: [{ date, open, high, low, close, volume, ema20, ema50 }]
 *   pivot: { s1, r1, ... } | null
 *   tradePlan: { entry, stopLoss, takeProfit1, takeProfit2 } | null
 *   colors: беттің өз түс палитрасы (gain/loss/gold/textFaint/border)
 */
export default function ProChart({ chartData, pivot, tradePlan, colors }) {
  if (!Array.isArray(chartData) || chartData.length < 2) return null;

  const width = 700;
  const priceHeight = 320;
  const volumeHeight = 80;
  const gap = 10;
  const bottomAxisHeight = 16;
  const legendHeight = 16;
  const totalHeight = priceHeight + gap + volumeHeight + bottomAxisHeight + legendHeight;
  const paddingLeft = 52;
  const paddingRight = 12;
  const paddingTop = 12;
  const paddingBottom = 4;

  const plotWidth = width - paddingLeft - paddingRight;
  const n = chartData.length;
  const candleSlot = plotWidth / n;
  const candleWidth = Math.max(2, candleSlot * 0.6);

  // ---- Баға диапазоны (candle + EMA + trade plan деңгейлерін ескеріп) ----
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  chartData.forEach((d) => {
    if (typeof d.low === "number") minPrice = Math.min(minPrice, d.low);
    if (typeof d.high === "number") maxPrice = Math.max(maxPrice, d.high);
    if (typeof d.ema20 === "number") {
      minPrice = Math.min(minPrice, d.ema20);
      maxPrice = Math.max(maxPrice, d.ema20);
    }
    if (typeof d.ema50 === "number") {
      minPrice = Math.min(minPrice, d.ema50);
      maxPrice = Math.max(maxPrice, d.ema50);
    }
  });

  const levelCandidates = [];
  if (pivot) {
    if (typeof pivot.s1 === "number") levelCandidates.push(pivot.s1);
    if (typeof pivot.r1 === "number") levelCandidates.push(pivot.r1);
  }
  if (tradePlan) {
    if (typeof tradePlan.stopLoss === "number") levelCandidates.push(tradePlan.stopLoss);
    if (typeof tradePlan.takeProfit1 === "number") levelCandidates.push(tradePlan.takeProfit1);
    if (typeof tradePlan.takeProfit2 === "number") levelCandidates.push(tradePlan.takeProfit2);
  }
  levelCandidates.forEach((v) => {
    minPrice = Math.min(minPrice, v);
    maxPrice = Math.max(maxPrice, v);
  });

  if (!isFinite(minPrice) || !isFinite(maxPrice)) return null;
  const pricePad = (maxPrice - minPrice) * 0.06 || 1;
  minPrice -= pricePad;
  maxPrice += pricePad;

  function priceY(p) {
    return paddingTop + ((maxPrice - p) / (maxPrice - minPrice)) * (priceHeight - paddingTop - paddingBottom);
  }

  function xAt(i) {
    return paddingLeft + i * candleSlot + candleSlot / 2;
  }

  // ---- Volume диапазоны ----
  let maxVolume = 0;
  chartData.forEach((d) => {
    if (typeof d.volume === "number") maxVolume = Math.max(maxVolume, d.volume);
  });
  const volumeTop = priceHeight + gap;

  function volY(v) {
    if (!maxVolume) return volumeTop + volumeHeight;
    return volumeTop + volumeHeight - (v / maxVolume) * volumeHeight;
  }

  // ---- EMA сызықтары ----
  function buildLinePath(key) {
    let path = "";
    let started = false;
    chartData.forEach((d, i) => {
      const v = d[key];
      if (typeof v !== "number") {
        started = false;
        return;
      }
      const x = xAt(i);
      const y = priceY(v);
      path += started ? ` L ${x} ${y}` : `M ${x} ${y}`;
      started = true;
    });
    return path;
  }

  const ema20Path = buildLinePath("ema20");
  const ema50Path = buildLinePath("ema50");

  // ---- Y айсы белгілері (баға) ----
  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => minPrice + ((maxPrice - minPrice) * i) / yTicks);

  // ---- X айсы белгілері (күн, шамамен 5-6 белгі) ----
  const xTickCount = Math.min(6, n);
  const xTickIdx = Array.from({ length: xTickCount }, (_, i) => Math.round((i * (n - 1)) / (xTickCount - 1 || 1)));

  function formatDateShort(d) {
    if (!d) return "";
    const parts = d.split("-");
    if (parts.length !== 3) return d;
    return parts[1] + "/" + parts[2];
  }

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${width} ${totalHeight}`}
        width="100%"
        style={{ minWidth: "560px", display: "block" }}
      >
        {/* ---- Баға торы (grid) ---- */}
        {yTickValues.map((v, i) => (
          <g key={`grid-${i}`}>
            <line
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={priceY(v)}
              y2={priceY(v)}
              stroke={colors.border}
              strokeWidth="1"
              strokeDasharray="2,3"
              opacity="0.5"
            />
            <text x={4} y={priceY(v) + 3} fontSize="9" fill={colors.textFaint} fontFamily="monospace">
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        {/* ---- Support/Resistance (pivot) ---- */}
        {pivot && typeof pivot.r1 === "number" ? (
          <g>
            <line x1={paddingLeft} x2={width - paddingRight} y1={priceY(pivot.r1)} y2={priceY(pivot.r1)} stroke={colors.gain} strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
            <text x={width - paddingRight} y={priceY(pivot.r1) - 3} fontSize="8" fill={colors.gain} textAnchor="end" fontFamily="monospace">R1 {pivot.r1}</text>
          </g>
        ) : null}
        {pivot && typeof pivot.s1 === "number" ? (
          <g>
            <line x1={paddingLeft} x2={width - paddingRight} y1={priceY(pivot.s1)} y2={priceY(pivot.s1)} stroke={colors.loss} strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
            <text x={width - paddingRight} y={priceY(pivot.s1) - 3} fontSize="8" fill={colors.loss} textAnchor="end" fontFamily="monospace">S1 {pivot.s1}</text>
          </g>
        ) : null}

        {/* ---- Entry / Stop / TP деңгейлері ---- */}
        {tradePlan && typeof tradePlan.entry === "number" ? (
          <g>
            <line x1={paddingLeft} x2={width - paddingRight} y1={priceY(tradePlan.entry)} y2={priceY(tradePlan.entry)} stroke={colors.gold} strokeWidth="1.2" opacity="0.8" />
            <text x={paddingLeft + 2} y={priceY(tradePlan.entry) - 3} fontSize="8" fill={colors.gold} fontFamily="monospace">Entry {tradePlan.entry}</text>
          </g>
        ) : null}
        {tradePlan && typeof tradePlan.stopLoss === "number" ? (
          <g>
            <line x1={paddingLeft} x2={width - paddingRight} y1={priceY(tradePlan.stopLoss)} y2={priceY(tradePlan.stopLoss)} stroke={colors.loss} strokeWidth="1.2" strokeDasharray="6,3" opacity="0.85" />
            <text x={paddingLeft + 2} y={priceY(tradePlan.stopLoss) - 3} fontSize="8" fill={colors.loss} fontFamily="monospace">SL {tradePlan.stopLoss}</text>
          </g>
        ) : null}
        {tradePlan && typeof tradePlan.takeProfit1 === "number" ? (
          <g>
            <line x1={paddingLeft} x2={width - paddingRight} y1={priceY(tradePlan.takeProfit1)} y2={priceY(tradePlan.takeProfit1)} stroke={colors.gain} strokeWidth="1.2" strokeDasharray="6,3" opacity="0.85" />
            <text x={paddingLeft + 2} y={priceY(tradePlan.takeProfit1) - 3} fontSize="8" fill={colors.gain} fontFamily="monospace">TP1 {tradePlan.takeProfit1}</text>
          </g>
        ) : null}
        {tradePlan && typeof tradePlan.takeProfit2 === "number" ? (
          <g>
            <line x1={paddingLeft} x2={width - paddingRight} y1={priceY(tradePlan.takeProfit2)} y2={priceY(tradePlan.takeProfit2)} stroke={colors.gainBright || colors.gain} strokeWidth="1" strokeDasharray="2,4" opacity="0.7" />
            <text x={paddingLeft + 2} y={priceY(tradePlan.takeProfit2) - 3} fontSize="8" fill={colors.gainBright || colors.gain} fontFamily="monospace">TP2 {tradePlan.takeProfit2}</text>
          </g>
        ) : null}

        {/* ---- Candlestick ---- */}
        {chartData.map((d, i) => {
          if (typeof d.open !== "number" || typeof d.close !== "number") return null;
          const up = d.close >= d.open;
          const color = up ? colors.gain : colors.loss;
          const x = xAt(i);
          const yHigh = priceY(d.high);
          const yLow = priceY(d.low);
          const yOpen = priceY(d.open);
          const yClose = priceY(d.close);
          const bodyTop = Math.min(yOpen, yClose);
          const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));

          return (
            <g key={`candle-${i}`}>
              <line x1={x} x2={x} y1={yHigh} y2={yLow} stroke={color} strokeWidth="1" />
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={color}
              />
            </g>
          );
        })}

        {/* ---- EMA overlay сызықтары ---- */}
        {ema20Path ? <path d={ema20Path} fill="none" stroke={colors.goldBright || colors.gold} strokeWidth="1.3" opacity="0.9" /> : null}
        {ema50Path ? <path d={ema50Path} fill="none" stroke={colors.textMuted} strokeWidth="1.3" opacity="0.8" /> : null}

        {/* ---- X осі белгілері ---- */}
        {xTickIdx.map((idx, i) => (
          <text
            key={`xtick-${i}`}
            x={xAt(idx)}
            y={volumeTop + volumeHeight + 12}
            fontSize="8"
            fill={colors.textFaint}
            textAnchor="middle"
            fontFamily="monospace"
          >
            {formatDateShort(chartData[idx] ? chartData[idx].date : "")}
          </text>
        ))}

        {/* ---- Volume ---- */}
        {chartData.map((d, i) => {
          if (typeof d.volume !== "number" || typeof d.open !== "number" || typeof d.close !== "number") return null;
          const up = d.close >= d.open;
          const color = up ? colors.gain : colors.loss;
          const x = xAt(i);
          const yTop = volY(d.volume);
          return (
            <rect
              key={`vol-${i}`}
              x={x - candleWidth / 2}
              y={yTop}
              width={candleWidth}
              height={volumeTop + volumeHeight - yTop}
              fill={color}
              opacity="0.5"
            />
          );
        })}

        {/* ---- Легенда ---- */}
        <g>
          <line x1={paddingLeft} x2={paddingLeft + 14} y1={volumeTop + volumeHeight + bottomAxisHeight + 6} y2={volumeTop + volumeHeight + bottomAxisHeight + 6} stroke={colors.goldBright || colors.gold} strokeWidth="2" />
          <text x={paddingLeft + 18} y={volumeTop + volumeHeight + bottomAxisHeight + 9} fontSize="8" fill={colors.textFaint}>EMA20</text>
          <line x1={paddingLeft + 60} x2={paddingLeft + 74} y1={volumeTop + volumeHeight + bottomAxisHeight + 6} y2={volumeTop + volumeHeight + bottomAxisHeight + 6} stroke={colors.textMuted} strokeWidth="2" />
          <text x={paddingLeft + 78} y={volumeTop + volumeHeight + bottomAxisHeight + 9} fontSize="8" fill={colors.textFaint}>EMA50</text>
        </g>
      </svg>
    </div>
  );
}
