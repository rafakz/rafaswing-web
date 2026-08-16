"use client";

import { useState } from "react";

/* ---------- Дизайн токендары ---------- */
const colors = {
  bg: "#0B0F1A",
  card: "#141B2E",
  border: "#263248",
  gold: "#C9A227",
  goldBright: "#E8C468",
  textPrimary: "#F5F1E6",
  textMuted: "#8A93A6",
  textFaint: "#5B6478",
  gain: "#4FA98B",
  gainBright: "#6FCBA8",
  loss: "#C2542D",
  lossBright: "#E2764C",
  hold: "#D4A24C",
};

const fontDisplay = "'Georgia', 'Times New Roman', serif";
const fontBody = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontMono = "'SF Mono', 'Consolas', 'Menlo', monospace";

/* ---------- Логотип ---------- */
function NogaiMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="38" cy="9" r="3" fill={colors.gold} />
      <path
        d="M3 33 L12 21 L18 27 L26 13 L34 23 L45 17"
        stroke={colors.gold}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1="3" y1="40" x2="45" y2="40" stroke={colors.border} strokeWidth="1.4" />
    </svg>
  );
}

/* ---------- Sparkline (толығымен қорғалған) ---------- */
function Sparkline({ history, isUp }) {
  if (!Array.isArray(history) || history.length < 2) return null;

  const closes = history
    .map((h) => (h && typeof h.close === "number" ? h.close : null))
    .filter((c) => c !== null && !isNaN(c));

  if (closes.length < 2) return null;

  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;

  const width = 320;
  const height = 64;
  const padY = 6;

  const points = closes.map((c, i) => {
    const x = (i / (closes.length - 1)) * width;
    const y = padY + (1 - (c - min) / range) * (height - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const lineColor = isUp ? colors.gain : colors.loss;
  const areaPoints = `0,${height} ${points.join(" ")} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      style={{ display: "block", marginTop: "14px" }}
    >
      <polygon points={areaPoints} fill={lineColor} opacity="0.08" />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- Сигнал есептеу (толығымен қорғалған) ---------- */
function getSignal(technicals, currentPrice) {
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
    if (price > sma20) {
      score += 1;
    } else {
      score -= 1;
    }
  }

  if (reasons.length === 0) return null;

  let label = "ҰСТАУ";
  let color = colors.hold;

  if (score >= 3) {
    label = "СЕНІМДІ САТЫП АЛУ";
    color = colors.gain;
  } else if (score >= 1) {
    label = "САТЫП АЛУ";
    color = colors.gainBright;
  } else if (score <= -3) {
    label = "СЕНІМДІ САТУ";
    color = colors.loss;
  } else if (score <= -1) {
    label = "САТУ";
    color = colors.lossBright;
  }

  return { label, color, reasons };
}

function formatNewsDate(unixSeconds) {
  if (!unixSeconds || typeof unixSeconds !== "number") return "";
  try {
    const d = new Date(unixSeconds * 1000);
    return d.toLocaleDateString("kk-KZ", { day: "2-digit", month: "2-digit" });
  } catch (e) {
    return "";
  }
}

function safeNum(v, digits) {
  if (typeof v !== "number" || isNaN(v)) return "—";
  return v.toFixed(digits);
}

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);

  async function searchStock(e) {
    e.preventDefault();
    if (!ticker.trim()) return;

    const symbol = ticker.trim().toUpperCase();

    setLoading(true);
    setError("");
    setData(null);
    setNews([]);

    try {
      const res = await fetch(`/api/stock?symbol=${symbol}`);
      const json = await res.json();

      if (!res.ok) {
        setError((json && json.error) || "Қате шықты");
      } else {
        setData(json);
      }
    } catch (err) {
      setError("Байланыс қатесі");
    } finally {
      setLoading(false);
    }

    setNewsLoading(true);
    try {
      const newsRes = await fetch(`/api/news?symbol=${symbol}`);
      const newsJson = await newsRes.json();
      if (newsRes.ok && newsJson && Array.isArray(newsJson.news)) {
        setNews(newsJson.news);
      }
    } catch (err) {
      // үнсіз қалдырамыз
    } finally {
      setNewsLoading(false);
    }
  }

  const isUp = !!(data && typeof data.change === "number" && data.change >= 0);
  const signal = data ? getSignal(data.technicals, data.currentPrice) : null;
  const hasHistory = data && Array.isArray(data.history) && data.history.length > 1;
  const hasTechnicals = data && data.technicals && typeof data.technicals === "object";
  const hasNews = Array.isArray(news) && news.length > 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.textPrimary,
        padding: "32px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: fontBody,
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .noghai-card { animation: fadeInUp 0.4s ease-out; }
        .noghai-news-item { transition: border-color 0.15s ease, transform 0.15s ease; }
        .noghai-news-item:hover { border-color: ${colors.gold} !important; transform: translateX(2px); }
        .noghai-search-btn { transition: filter 0.15s ease, transform 0.1s ease; }
        .noghai-search-btn:hover { filter: brightness(1.12); }
        .noghai-search-btn:active { transform: scale(0.97); }
        .noghai-input:focus { outline: none; border-color: ${colors.gold} !important; }
      `}</style>

      {/* ---------- ЛОГОТИП / БРЕНД ---------- */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <NogaiMark size={40} />
        <h1
          style={{
            fontFamily: fontDisplay,
            fontSize: "2.1rem",
            fontWeight: "bold",
            letterSpacing: "0.5px",
            margin: 0,
            color: colors.textPrimary,
          }}
        >
          Ноғай
        </h1>
      </div>
      <p style={{ color: colors.gold, marginTop: "6px", marginBottom: "2px", fontSize: "0.85rem", letterSpacing: "0.3px" }}>
        Дала дәстүрінен жылдамдық пен дәлдік
      </p>
      <p style={{ color: colors.textFaint, marginBottom: "26px", fontSize: "0.75rem" }}>
        Свинг-трейдинг және инвестиция платформасы
      </p>

      {/* ---------- ІЗДЕУ ФОРМАСЫ ---------- */}
      <form onSubmit={searchStock} style={{ display: "flex", gap: "8px", width: "100%", maxWidth: "360px" }}>
        <input
          className="noghai-input"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="Ticker жаз (мыс. AAPL)"
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: "10px",
            border: `1px solid ${colors.border}`,
            background: colors.card,
            color: colors.textPrimary,
            fontSize: "1rem",
            fontFamily: fontBody,
          }}
        />
        <button
          type="submit"
          className="noghai-search-btn"
          style={{
            padding: "12px 22px",
            borderRadius: "10px",
            border: "none",
            background: colors.gold,
            color: colors.bg,
            fontWeight: "bold",
            fontSize: "1rem",
            fontFamily: fontBody,
            cursor: "pointer",
          }}
        >
          Іздеу
        </button>
      </form>

      {loading && <p style={{ marginTop: "24px", color: colors.textMuted }}>Жүктелуде...</p>}

      {error ? <p style={{ marginTop: "24px", color: colors.lossBright }}>{error}</p> : null}

      {data ? (
        <div
          className="noghai-card"
          style={{
            marginTop: "26px",
            width: "100%",
            maxWidth: "360px",
            background: colors.card,
            borderRadius: "16px",
            padding: "20px",
            border: `1px solid ${colors.border}`,
          }}
        >
          {/* ---------- НЕГІЗГІ АҚПАРАТ ---------- */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {data.logo ? (
              <img src={data.logo} alt={data.symbol || ""} width={36} height={36} style={{ borderRadius: "8px" }} />
            ) : null}
            <div>
              <div style={{ fontWeight: "bold", fontSize: "1.1rem", fontFamily: fontMono, letterSpacing: "0.5px" }}>
                {data.symbol || "—"}
              </div>
              <div style={{ color: colors.textMuted, fontSize: "0.85rem" }}>{data.name || ""}</div>
            </div>
          </div>

          <div style={{ marginTop: "16px", display: "flex", alignItems: "baseline", gap: "10px", fontFamily: fontMono }}>
            <span style={{ fontSize: "1.9rem", fontWeight: "bold" }}>${safeNum(data.currentPrice, 2)}</span>
            <span style={{ fontSize: "1rem", color: isUp ? colors.gain : colors.loss }}>
              {isUp ? "▲" : "▼"} {safeNum(data.change, 2)} ({safeNum(data.changePercent, 2)}%)
            </span>
          </div>

          {/* ---------- SPARKLINE ГРАФИК ---------- */}
          {hasHistory ? (
            <>
              <Sparkline history={data.history} isUp={isUp} />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.68rem",
                  color: colors.textFaint,
                  fontFamily: fontMono,
                  marginTop: "2px",
                }}
              >
                <span>{data.history.length} күн</span>
                <span>соңғы баға үрдісі</span>
              </div>
            </>
          ) : null}

          <div
            style={{
              marginTop: "16px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              fontSize: "0.85rem",
              color: colors.textMuted,
              fontFamily: fontMono,
            }}
          >
            <div>Ашылу: ${safeNum(data.open, 2)}</div>
            <div>Жабылу (алдыңғы): ${safeNum(data.previousClose, 2)}</div>
            <div>Максимум: ${safeNum(data.high, 2)}</div>
            <div>Минимум: ${safeNum(data.low, 2)}</div>
            {typeof data.marketCap === "number" ? <div>Market Cap: ${data.marketCap.toFixed(0)}M</div> : null}
            {data.industry ? <div style={{ fontFamily: fontBody }}>Сала: {data.industry}</div> : null}
          </div>

          {/* ---------- ФУНДАМЕНТАЛДЫ КӨРСЕТКІШТЕР ---------- */}
          {data.fundamentals && typeof data.fundamentals === "object" ? (
            <div style={{ marginTop: "22px", paddingTop: "16px", borderTop: `1px solid ${colors.border}` }}>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  marginBottom: "12px",
                  color: colors.gold,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                }}
              >
                Фундаменталды көрсеткіштер
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  fontSize: "0.85rem",
                  color: colors.textMuted,
                  fontFamily: fontMono,
                }}
              >
                <div>P/E: {safeNum(data.fundamentals.pe, 2)}</div>
                <div>EPS: ${safeNum(data.fundamentals.eps, 2)}</div>
                <div>ROE: {safeNum(data.fundamentals.roe, 1)}%</div>
                <div>Таза маржа: {safeNum(data.fundamentals.netMargin, 1)}%</div>
                <div>Кіріс өсімі: {safeNum(data.fundamentals.revenueGrowth, 1)}%</div>
                <div>EPS өсімі: {safeNum(data.fundamentals.epsGrowth, 1)}%</div>
                <div>Дивиденд: {safeNum(data.fundamentals.dividendYield, 2)}%</div>
                <div>Beta: {safeNum(data.fundamentals.beta, 2)}</div>
                <div>52 апта макс: ${safeNum(data.fundamentals.week52High, 2)}</div>
                <div>52 апта мин: ${safeNum(data.fundamentals.week52Low, 2)}</div>
              </div>
            </div>
          ) : null}

          {/* ---------- EARNINGS ---------- */}
          {data.earnings && (data.earnings.nextDate || data.earnings.lastDate) ? (
            <div style={{ marginTop: "16px", fontSize: "0.85rem", color: colors.textMuted, fontFamily: fontMono }}>
              {data.earnings.nextDate ? (
                <div style={{ color: colors.hold, fontWeight: "bold" }}>
                  ⚠ Алдағы есеп: {data.earnings.nextDate}
                </div>
              ) : null}
              {data.earnings.lastDate && typeof data.earnings.lastEpsActual === "number" && typeof data.earnings.lastEpsEstimate === "number" ? (
                <div style={{ marginTop: "4px" }}>
                  Соңғы есеп ({data.earnings.lastDate}): факт ${data.earnings.lastEpsActual.toFixed(2)} / болжам ${data.earnings.lastEpsEstimate.toFixed(2)}{" "}
                  <span style={{ color: data.earnings.lastEpsActual >= data.earnings.lastEpsEstimate ? colors.gain : colors.loss, fontWeight: "bold" }}>
                    {data.earnings.lastEpsActual >= data.earnings.lastEpsEstimate ? "(асып түсті)" : "(төмен шықты)"}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* ---------- ТЕХНИКАЛЫҚ АНАЛИЗ ---------- */}
          {hasTechnicals ? (
            <div style={{ marginTop: "22px", paddingTop: "16px", borderTop: `1px solid ${colors.border}` }}>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  marginBottom: "12px",
                  color: colors.gold,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                }}
              >
                Техникалық анализ
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  fontSize: "0.85rem",
                  color: colors.textMuted,
                  fontFamily: fontMono,
                }}
              >
                <div>
                  RSI (14):{" "}
                  <span
                    style={{
                      color:
                        typeof data.technicals.rsi === "number" && data.technicals.rsi > 70
                          ? colors.loss
                          : typeof data.technicals.rsi === "number" && data.technicals.rsi < 30
                          ? colors.gain
                          : colors.textPrimary,
                      fontWeight: "bold",
                    }}
                  >
                    {safeNum(data.technicals.rsi, 2)}
                  </span>
                </div>
                <div>
                  MACD:{" "}
                  <span
                    style={{
                      color:
                        typeof data.technicals.macd === "number" && data.technicals.macd > 0
                          ? colors.gain
                          : colors.loss,
                      fontWeight: "bold",
                    }}
                  >
                    {safeNum(data.technicals.macd, 2)}
                  </span>
                </div>
                <div>SMA20: ${safeNum(data.technicals.sma20, 2)}</div>
                <div>SMA50: ${safeNum(data.technicals.sma50, 2)}</div>
                {data.volume && typeof data.volume === "object" ? (
                  <div style={{ gridColumn: "1 / -1" }}>
                    Volume:{" "}
                    <span
                      style={{
                        color:
                          typeof data.volume.ratio === "number" && data.volume.ratio > 1.5
                            ? colors.gainBright
                            : typeof data.volume.ratio === "number" && data.volume.ratio < 0.7
                            ? colors.textFaint
                            : colors.textPrimary,
                        fontWeight: "bold",
                      }}
                    >
                      {typeof data.volume.latest === "number"
                        ? (data.volume.latest / 1e6).toFixed(2) + "M"
                        : "—"}
                    </span>
                    {typeof data.volume.ratio === "number" ? (
                      <span style={{ color: colors.textFaint }}>
                        {" "}
                        (орташадан {data.volume.ratio}×)
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {signal ? (
                <div
                  style={{
                    marginTop: "14px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: colors.bg,
                    border: `1px solid ${signal.color}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "bold",
                      color: signal.color,
                      marginBottom: "6px",
                      fontFamily: fontMono,
                      letterSpacing: "0.3px",
                    }}
                  >
                    Сигнал: {signal.label}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.78rem", color: colors.textMuted }}>
                    {signal.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* ---------- ЖАНАЛЫҚТАР ---------- */}
          <div style={{ marginTop: "22px", paddingTop: "16px", borderTop: `1px solid ${colors.border}` }}>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: "bold",
                marginBottom: "12px",
                color: colors.gold,
                textTransform: "uppercase",
                letterSpacing: "0.6px",
              }}
            >
              Соңғы жаңалықтар
            </div>

            {newsLoading ? <p style={{ color: colors.textMuted, fontSize: "0.85rem" }}>Жаңалықтар жүктелуде...</p> : null}

            {!newsLoading && !hasNews ? (
              <p style={{ color: colors.textFaint, fontSize: "0.85rem" }}>Соңғы 7 күнде жаңалық табылмады.</p>
            ) : null}

            {!newsLoading && hasNews ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {news.map((item, i) => (
                  <a
                    key={i}
                    href={item && item.url ? item.url : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="noghai-news-item"
                    style={{
                      display: "block",
                      textDecoration: "none",
                      color: "inherit",
                      background: colors.bg,
                      borderRadius: "10px",
                      padding: "10px 12px",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div style={{ fontSize: "0.85rem", color: colors.textPrimary, lineHeight: "1.35", marginBottom: "6px" }}>
                      {item && item.headline ? item.headline : ""}
                    </div>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: colors.textFaint,
                        display: "flex",
                        justifyContent: "space-between",
                        fontFamily: fontMono,
                      }}
                    >
                      <span>{item && item.source ? item.source : ""}</span>
                      <span>{item ? formatNewsDate(item.datetime) : ""}</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <p style={{ marginTop: "40px", color: colors.textFaint, fontSize: "0.7rem" }}>© Ноғай — дала рухымен сауда</p>
    </main>
  );
}
