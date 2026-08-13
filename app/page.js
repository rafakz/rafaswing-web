"use client";

import { useState } from "react";

// RSI, MACD, SMA20/50 негізінде сауда сигналын есептеу
function getSignal(technicals, currentPrice) {
  if (!technicals) return null;

  const { rsi, sma20, sma50, macd } = technicals;
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

  if (sma20 !== null && currentPrice > sma20) {
    score += 1;
  } else if (sma20 !== null) {
    score -= 1;
  }

  let label = "ҰСТАУ";
  let color = "#facc15";

  if (score >= 3) {
    label = "СЕНІМДІ САТЫП АЛУ";
    color = "#22c55e";
  } else if (score >= 1) {
    label = "САТЫП АЛУ";
    color = "#4ade80";
  } else if (score <= -3) {
    label = "СЕНІМДІ САТУ";
    color = "#dc2626";
  } else if (score <= -1) {
    label = "САТУ";
    color = "#f87171";
  }

  return { label, color, reasons };
}

function formatNewsDate(unixSeconds) {
  if (!unixSeconds) return "";
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleDateString("kk-KZ", {
    day: "2-digit",
    month: "2-digit",
  });
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
        setError(json.error || "Қате шықты");
      } else {
        setData(json);
      }
    } catch (err) {
      setError("Байланыс қатесі");
    } finally {
      setLoading(false);
    }

    // Жаңалықтарды бөлек жүктейміз (баға дереу шығуы үшін)
    setNewsLoading(true);
    try {
      const newsRes = await fetch(`/api/news?symbol=${symbol}`);
      const newsJson = await newsRes.json();
      if (newsRes.ok && Array.isArray(newsJson.news)) {
        setNews(newsJson.news);
      }
    } catch (err) {
      // жаңалықтар жүктелмесе, үнсіз қалдырамыз
    } finally {
      setNewsLoading(false);
    }
  }

  const isUp = data && data.change >= 0;
  const signal = data ? getSignal(data.technicals, data.currentPrice) : null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", marginBottom: "4px" }}>
        🚀 RafaSwing
      </h1>
      <p style={{ color: "#94a3b8", marginBottom: "24px", fontSize: "0.9rem" }}>
        Swing trading & investment platform
      </p>

      <form
        onSubmit={searchStock}
        style={{ display: "flex", gap: "8px", width: "100%", maxWidth: "360px" }}
      >
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="Ticker жаз (мыс. AAPL)"
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid #334155",
            background: "#1e293b",
            color: "white",
            fontSize: "1rem",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "12px 20px",
            borderRadius: "10px",
            border: "none",
            background: "#22c55e",
            color: "#0f172a",
            fontWeight: "bold",
            fontSize: "1rem",
          }}
        >
          Іздеу
        </button>
      </form>

      {loading && (
        <p style={{ marginTop: "24px", color: "#94a3b8" }}>Жүктелуде...</p>
      )}

      {error && (
        <p style={{ marginTop: "24px", color: "#f87171" }}>{error}</p>
      )}

      {data && (
        <div
          style={{
            marginTop: "24px",
            width: "100%",
            maxWidth: "360px",
            background: "#1e293b",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {data.logo && (
              <img
                src={data.logo}
                alt={data.symbol}
                width={36}
                height={36}
                style={{ borderRadius: "8px" }}
              />
            )}
            <div>
              <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                {data.symbol}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                {data.name}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "16px", display: "flex", alignItems: "baseline", gap: "10px" }}>
            <span style={{ fontSize: "1.8rem", fontWeight: "bold" }}>
              ${data.currentPrice.toFixed(2)}
            </span>
            <span
              style={{
                fontSize: "1rem",
                color: isUp ? "#4ade80" : "#f87171",
              }}
            >
              {isUp ? "▲" : "▼"} {data.change.toFixed(2)} (
              {data.changePercent.toFixed(2)}%)
            </span>
          </div>

          <div
            style={{
              marginTop: "16px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              fontSize: "0.85rem",
              color: "#cbd5e1",
            }}
          >
            <div>Ашылу: ${data.open.toFixed(2)}</div>
            <div>Жабылу (алдыңғы): ${data.previousClose.toFixed(2)}</div>
            <div>Максимум: ${data.high.toFixed(2)}</div>
            <div>Минимум: ${data.low.toFixed(2)}</div>
            {data.marketCap && (
              <div>Market Cap: ${data.marketCap.toFixed(0)}M</div>
            )}
            {data.industry && <div>Сала: {data.industry}</div>}
          </div>

          {/* ТЕХНИКАЛЫҚ АНАЛИЗ БЛОГЫ */}
          {data.technicals && (
            <div
              style={{
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid #334155",
              }}
            >
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "bold",
                  marginBottom: "10px",
                  color: "#e2e8f0",
                }}
              >
                📊 Техникалық анализ
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  fontSize: "0.85rem",
                  color: "#cbd5e1",
                }}
              >
                <div>
                  RSI (14):{" "}
                  <span
                    style={{
                      color:
                        data.technicals.rsi > 70
                          ? "#f87171"
                          : data.technicals.rsi < 30
                          ? "#4ade80"
                          : "#e2e8f0",
                      fontWeight: "bold",
                    }}
                  >
                    {data.technicals.rsi ?? "—"}
                  </span>
                </div>
                <div>
                  MACD:{" "}
                  <span
                    style={{
                      color: data.technicals.macd > 0 ? "#4ade80" : "#f87171",
                      fontWeight: "bold",
                    }}
                  >
                    {data.technicals.macd ?? "—"}
                  </span>
                </div>
                <div>SMA20: ${data.technicals.sma20 ?? "—"}</div>
                <div>SMA50: ${data.technicals.sma50 ?? "—"}</div>
              </div>

              {signal && (
                <div
                  style={{
                    marginTop: "14px",
                    padding: "12px",
                    borderRadius: "10px",
                    background: "#0f172a",
                    border: `1px solid ${signal.color}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: "bold",
                      color: signal.color,
                      marginBottom: "6px",
                    }}
                  >
                    Сигнал: {signal.label}
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "18px",
                      fontSize: "0.78rem",
                      color: "#94a3b8",
                    }}
                  >
                    {signal.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ЖАНАЛЫҚТАР БЛОГЫ */}
          <div
            style={{
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px solid #334155",
            }}
          >
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: "bold",
                marginBottom: "10px",
                color: "#e2e8f0",
              }}
            >
              📰 Соңғы жаңалықтар
            </div>

            {newsLoading && (
              <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                Жаңалықтар жүктелуде...
              </p>
            )}

            {!newsLoading && news.length === 0 && (
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                Соңғы 7 күнде жаңалық табылмады.
              </p>
            )}

            {!newsLoading && news.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {news.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      textDecoration: "none",
                      color: "inherit",
                      background: "#0f172a",
                      borderRadius: "10px",
                      padding: "10px 12px",
                      border: "1px solid #334155",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "#e2e8f0",
                        lineHeight: "1.3",
                        marginBottom: "6px",
                      }}
                    >
                      {item.headline}
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#64748b",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{item.source}</span>
                      <span>{formatNewsDate(item.datetime)}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
