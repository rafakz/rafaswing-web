"use client";

import { useState, useEffect } from "react";
import NavMenu from "./NavMenu";
import Header from "./Header";
import FloatingChat from "./FloatingChat";
import { supabase } from "./supabaseClient";

/* ---------- Дизайн токендары ---------- */
const colors = {
  bg: "#0B132B",
  card: "#0F1A3D",
  border: "#1E3A8A",
  gold: "#D4AF37",
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
function TradeIQMark({ size = 40 }) {
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

  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const [overview, setOverview] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [homeNews, setHomeNews] = useState([]);
  const [homeNewsLoading, setHomeNewsLoading] = useState(true);

  const [session, setSession] = useState(null);
  const [watchlistSymbols, setWatchlistSymbols] = useState([]);
  const [watchlistBusy, setWatchlistBusy] = useState(false);

  const [alertPrice, setAlertPrice] = useState("");
  const [alertDirection, setAlertDirection] = useState("above");
  const [alertSubmitting, setAlertSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data ? data.session : null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      if (listener && listener.subscription) listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadWatchlist() {
      if (!session || !session.user) {
        setWatchlistSymbols([]);
        return;
      }
      const { data: rows } = await supabase.from("watchlist").select("symbol");
      if (!cancelled && rows) {
        setWatchlistSymbols(rows.map((r) => r.symbol));
      }
    }
    loadWatchlist();
    return () => {
      cancelled = true;
    };
  }, [session]);

  async function toggleWatchlist(symbol) {
    if (!session || !session.user || !symbol) return;
    setWatchlistBusy(true);
    const inList = watchlistSymbols.includes(symbol);
    try {
      if (inList) {
        await supabase.from("watchlist").delete().eq("user_id", session.user.id).eq("symbol", symbol);
        setWatchlistSymbols((prev) => prev.filter((s) => s !== symbol));
      } else {
        await supabase.from("watchlist").insert({ user_id: session.user.id, symbol });
        setWatchlistSymbols((prev) => [...prev, symbol]);
      }
    } catch (err) {
      // үнсіз
    } finally {
      setWatchlistBusy(false);
    }
  }

  async function createAlert(e) {
    e.preventDefault();
    setAlertMessage("");

    if (!session || !session.user) {
      setAlertMessage("Алдымен кіру керек");
      return;
    }
    if (!data || !data.symbol) return;

    const price = parseFloat(alertPrice);
    if (!price || price <= 0) {
      setAlertMessage("Дұрыс баға енгіз");
      return;
    }

    setAlertSubmitting(true);
    try {
      const { error: insertError } = await supabase.from("price_alerts").insert({
        user_id: session.user.id,
        symbol: data.symbol,
        direction: alertDirection,
        target_price: price,
      });
      if (insertError) {
        setAlertMessage(insertError.message);
      } else {
        setAlertPrice("");
        setAlertMessage("Дабыл қойылды ✓");
      }
    } catch (err) {
      setAlertMessage("Қате шықты");
    } finally {
      setAlertSubmitting(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadHomeNews() {
      setHomeNewsLoading(true);
      try {
        const res = await fetch("/api/news?symbol=SPY");
        const json = await res.json();
        if (!cancelled && res.ok && Array.isArray(json.news)) {
          setHomeNews(json.news.slice(0, 3));
        }
      } catch (err) {
        // үнсіз қалдырамыз, блок бос көрінеді
      } finally {
        if (!cancelled) setHomeNewsLoading(false);
      }
    }

    loadHomeNews();
    return () => {
      cancelled = true;
    };
  }, []);

  const OVERVIEW_SYMBOLS = [
    { symbol: "ONEQ", label: "NASDAQ" },
    { symbol: "QQQ", label: "QQQ" },
    { symbol: "SPY", label: "SPX" },
    { symbol: "QQQM", label: "NDX" },
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      setOverviewLoading(true);
      const results = await Promise.all(
        OVERVIEW_SYMBOLS.map(async (item) => {
          try {
            const res = await fetch(`/api/stock?symbol=${encodeURIComponent(item.symbol)}`);
            const json = await res.json();
            if (!res.ok) return { ...item, error: true };
            return { ...item, ...json };
          } catch (err) {
            return { ...item, error: true };
          }
        })
      );
      if (!cancelled) {
        setOverview(results);
        setOverviewLoading(false);
      }
    }

    loadOverview();
    return () => {
      cancelled = true;
    };
  }, []);

  function loadFromOverview(symbol) {
    setTicker(symbol);
    searchStock({ preventDefault: () => {} }, symbol);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const symbolParam = params.get("symbol");
    if (symbolParam) {
      loadFromOverview(symbolParam.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function searchStock(e, symbolOverride) {
    e.preventDefault();
    const raw = symbolOverride || ticker;
    if (!raw || !raw.trim()) return;

    const symbol = raw.trim().toUpperCase();

    setLoading(true);
    setError("");
    setData(null);
    setNews([]);
    setAiSummary("");
    setAiError("");
    setChatMessages([]);
    setChatInput("");
    setChatError("");

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

  async function getAiSummary() {
    if (!data) return;
    setAiLoading(true);
    setAiError("");
    setAiSummary("");

    try {
      const signal = getSignal(data.technicals, data.currentPrice);
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: data.symbol,
          name: data.name,
          currentPrice: data.currentPrice,
          changePercent: data.changePercent,
          technicals: data.technicals,
          fundamentals: data.fundamentals,
          swingScore: data.swingScore,
          tradePlan: data.tradePlan,
          signalLabel: signal ? signal.label : ""
        }),
      });
      const json = await res.json();
      if (json && json.error) {
        setAiError(json.error + (json.detail ? " — " + json.detail : ""));
      } else if (json && json.summary) {
        setAiSummary(json.summary);
      } else {
        setAiError("Белгісіз жауап");
      }
    } catch (err) {
      setAiError("Байланыс қатесі");
    } finally {
      setAiLoading(false);
    }
  }

  async function sendChatMessage(e) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const newMessages = [...chatMessages, { role: "user", text: text }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          stockContext: data
            ? {
                symbol: data.symbol,
                name: data.name,
                currentPrice: data.currentPrice,
                technicals: data.technicals,
                swingScore: data.swingScore,
              }
            : null,
        }),
      });
      const json = await res.json();
      if (json && json.error) {
        setChatMessages([
          ...newMessages,
          { role: "assistant", text: "Қате: " + json.error + (json.detail ? " — " + json.detail : "") },
        ]);
      } else if (json && json.reply) {
        setChatMessages([...newMessages, { role: "assistant", text: json.reply }]);
      }
    } catch (err) {
      setChatMessages([...newMessages, { role: "assistant", text: "Байланыс қатесі болды." }]);
    } finally {
      setChatLoading(false);
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
        fontFamily: fontBody,
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tradeiq-card { animation: fadeInUp 0.4s ease-out; }
        .tradeiq-news-item { transition: border-color 0.15s ease, transform 0.15s ease; }
        .tradeiq-news-item:hover { border-color: ${colors.gold} !important; transform: translateX(2px); }
        .tradeiq-search-btn { transition: filter 0.15s ease, transform 0.1s ease; }
        .tradeiq-search-btn:hover { filter: brightness(1.12); }
        .tradeiq-search-btn:active { transform: scale(0.97); }
        .tradeiq-input:focus { outline: none; border-color: ${colors.gold} !important; }
        .tradeiq-content-shell { margin-left: 0; }
        @media (min-width: 1024px) {
          .tradeiq-content-shell { margin-left: 240px; }
        }
      `}</style>

      <NavMenu />

      <div className="tradeiq-content-shell">
        <Header overview={overview} />

        <div
          style={{
            padding: "32px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >

      {/* ---------- ЛОГОТИП / БРЕНД ---------- */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <TradeIQMark size={40} />
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
          TradeIQ
        </h1>
      </div>
      <p style={{ color: colors.gold, marginTop: "6px", marginBottom: "2px", fontSize: "0.7rem", letterSpacing: "1.5px", fontWeight: "600" }}>
        AI-POWERED TRADING
      </p>
      <p style={{ color: colors.textPrimary, marginTop: "10px", marginBottom: "2px", fontSize: "0.9rem" }}>
        Ақылды инвестиция. Нақты талдау.
      </p>
      <p style={{ color: colors.textFaint, marginBottom: "26px", fontSize: "0.75rem" }}>
        Свинг-трейдинг және инвестиция платформасы
      </p>

      {/* ---------- ІЗДЕУ ФОРМАСЫ ---------- */}
      <form onSubmit={searchStock} style={{ display: "flex", gap: "8px", width: "100%", maxWidth: "360px" }}>
        <input
          className="tradeiq-input"
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
          className="tradeiq-search-btn"
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

      {/* ---------- НАРЫҚ ШОЛУЫ ---------- */}
      <div style={{ width: "100%", maxWidth: "760px", marginTop: "28px" }}>
        <div
          style={{
            fontSize: "0.85rem",
            fontWeight: "bold",
            color: colors.textPrimary,
            marginBottom: "12px",
          }}
        >
          Нарық шолуы
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
          }}
        >
          {overviewLoading && overview.length === 0
            ? OVERVIEW_SYMBOLS.map((item) => (
                <div
                  key={item.symbol}
                  className="tradeiq-card"
                  style={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "14px",
                    padding: "14px",
                    minHeight: "84px",
                  }}
                >
                  <div style={{ color: colors.textFaint, fontSize: "0.78rem" }}>{item.label}</div>
                  <div style={{ color: colors.textFaint, fontSize: "0.8rem", marginTop: "10px" }}>Жүктелуде...</div>
                </div>
              ))
            : overview.map((item) => {
                const up = typeof item.change === "number" && item.change >= 0;
                return (
                  <button
                    key={item.symbol}
                    onClick={() => loadFromOverview(item.symbol)}
                    className="tradeiq-card"
                    style={{
                      textAlign: "left",
                      background: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "14px",
                      padding: "14px",
                      cursor: "pointer",
                      fontFamily: fontBody,
                    }}
                  >
                    <div style={{ color: colors.gold, fontSize: "0.78rem", fontWeight: "600" }}>{item.label}</div>
                    {item.error ? (
                      <div style={{ color: colors.textFaint, fontSize: "0.78rem", marginTop: "10px" }}>
                        Деректер жоқ
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            color: colors.textPrimary,
                            fontSize: "1.05rem",
                            fontWeight: "bold",
                            fontFamily: fontMono,
                            marginTop: "6px",
                          }}
                        >
                          {safeNum(item.currentPrice, 2)}
                        </div>
                        <div
                          style={{
                            color: up ? colors.gain : colors.loss,
                            fontSize: "0.8rem",
                            fontFamily: fontMono,
                            marginTop: "2px",
                          }}
                        >
                          {up ? "▲" : "▼"} {safeNum(item.changePercent, 2)}%
                        </div>
                        {Array.isArray(item.history) && item.history.length > 1 ? (
                          <Sparkline history={item.history} isUp={up} />
                        ) : null}
                      </>
                    )}
                  </button>
                );
              })}
        </div>
      </div>

      {loading && <p style={{ marginTop: "24px", color: colors.textMuted }}>Жүктелуде...</p>}

      {error ? <p style={{ marginTop: "24px", color: colors.lossBright }}>{error}</p> : null}

      {data ? (
        <div
          className="tradeiq-card"
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
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
            {session && session.user && data.symbol ? (
              <button
                onClick={() => toggleWatchlist(data.symbol)}
                disabled={watchlistBusy}
                aria-label="Таңдаулыларға қосу"
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.4rem",
                  cursor: watchlistBusy ? "default" : "pointer",
                  color: watchlistSymbols.includes(data.symbol) ? colors.gold : colors.textFaint,
                  flexShrink: 0,
                }}
              >
                {watchlistSymbols.includes(data.symbol) ? "★" : "☆"}
              </button>
            ) : null}
          </div>

          {session && session.user && data.symbol ? (
            <form
              onSubmit={createAlert}
              style={{
                marginTop: "14px",
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.78rem", color: colors.textFaint }}>🔔 Дабыл:</span>
              <select
                value={alertDirection}
                onChange={(e) => setAlertDirection(e.target.value)}
                style={{
                  padding: "6px 8px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  color: colors.textPrimary,
                  fontSize: "0.78rem",
                  fontFamily: fontBody,
                }}
              >
                <option value="above">жоғары болса</option>
                <option value="below">төмен болса</option>
              </select>
              <input
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                placeholder="Баға ($)"
                type="number"
                step="any"
                style={{
                  width: "100px",
                  padding: "6px 8px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  color: colors.textPrimary,
                  fontSize: "0.78rem",
                  fontFamily: fontBody,
                  boxSizing: "border-box",
                }}
              />
              <button
                type="submit"
                disabled={alertSubmitting}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background: colors.gold,
                  color: colors.bg,
                  fontWeight: "bold",
                  fontSize: "0.78rem",
                  fontFamily: fontBody,
                  cursor: alertSubmitting ? "default" : "pointer",
                }}
              >
                Қою
              </button>
              {alertMessage ? (
                <span style={{ fontSize: "0.72rem", color: colors.textFaint }}>{alertMessage}</span>
              ) : null}
            </form>
          ) : null}

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
                {typeof data.technicals.ema20 === "number" || typeof data.technicals.ema50 === "number" || typeof data.technicals.ema200 === "number" ? (
                  <>
                    <div>EMA20: ${safeNum(data.technicals.ema20, 2)}</div>
                    <div>EMA50: ${safeNum(data.technicals.ema50, 2)}</div>
                    <div>EMA200: ${safeNum(data.technicals.ema200, 2)}</div>
                  </>
                ) : null}
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

          {/* ---------- SENTIMENT ---------- */}
          {data.sentiment && typeof data.sentiment === "object" && typeof data.sentiment.bullishPercent === "number" ? (
            <div style={{ marginTop: "16px", fontSize: "0.85rem", color: colors.textMuted, fontFamily: fontMono }}>
              Sentiment:{" "}
              <span style={{ color: colors.gain, fontWeight: "bold" }}>▲ {data.sentiment.bullishPercent}%</span>
              {"  "}
              <span style={{ color: colors.loss, fontWeight: "bold" }}>▼ {data.sentiment.bearishPercent}%</span>
            </div>
          ) : null}

          {/* ---------- SWING SCORE ---------- */}
          {typeof data.swingScore === "number" ? (
            <div
              style={{
                marginTop: "18px",
                padding: "14px",
                borderRadius: "10px",
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: colors.textFaint, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>
                Swing Score
              </div>
              <div
                style={{
                  fontSize: "2.2rem",
                  fontWeight: "bold",
                  fontFamily: fontMono,
                  color:
                    data.swingScore >= 65 ? colors.gain : data.swingScore <= 35 ? colors.loss : colors.hold,
                }}
              >
                {data.swingScore}
                <span style={{ fontSize: "1rem", color: colors.textFaint }}> /100</span>
              </div>
            </div>
          ) : null}

          {/* ---------- ENTRY / STOP LOSS / TAKE PROFIT ---------- */}
          {data.tradePlan && typeof data.tradePlan === "object" ? (
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${colors.border}` }}>
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
                Сауда жоспары
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  fontSize: "0.85rem",
                  fontFamily: fontMono,
                }}
              >
                <div style={{ color: colors.textPrimary }}>Entry: ${safeNum(data.tradePlan.entry, 2)}</div>
                <div style={{ color: colors.loss }}>Stop Loss: ${safeNum(data.tradePlan.stopLoss, 2)}</div>
                <div style={{ color: colors.gain }}>TP1: ${safeNum(data.tradePlan.takeProfit1, 2)}</div>
                <div style={{ color: colors.gainBright }}>TP2: ${safeNum(data.tradePlan.takeProfit2, 2)}</div>
              </div>
              {typeof data.tradePlan.riskReward === "number" ? (
                <div style={{ marginTop: "8px", fontSize: "0.78rem", color: colors.textFaint, fontFamily: fontMono }}>
                  Risk/Reward: 1:{data.tradePlan.riskReward}
                </div>
              ) : null}
              <div style={{ marginTop: "8px", fontSize: "0.68rem", color: colors.textFaint }}>
                ⚠ Бұл автоматты есептеу, инвестиция кеңесі емес.
              </div>
            </div>
          ) : null}

          {/* ---------- AI ҚОРЫТЫНДЫ ---------- */}
          <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: `1px solid ${colors.border}` }}>
            <button
              onClick={getAiSummary}
              disabled={aiLoading}
              className="tradeiq-search-btn"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "10px",
                border: `1px solid ${colors.gold}`,
                background: "transparent",
                color: colors.gold,
                fontWeight: "bold",
                fontSize: "0.85rem",
                fontFamily: fontBody,
                cursor: aiLoading ? "default" : "pointer",
              }}
            >
              {aiLoading ? "Талдау жасалуда..." : "🤖 AI қорытынды алу"}
            </button>

            {aiError ? (
              <p style={{ marginTop: "10px", color: colors.lossBright, fontSize: "0.8rem" }}>{aiError}</p>
            ) : null}

            {aiSummary ? (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  fontSize: "0.85rem",
                  color: colors.textPrimary,
                  lineHeight: "1.5",
                }}
              >
                {aiSummary}
              </div>
            ) : null}
          </div>

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
                    className="tradeiq-news-item"
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

      {/* ---------- НАРЫҚ ЖАҢАЛЫҚТАРЫ ---------- */}
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          marginTop: "32px",
        }}
      >
        {/* ---- Нарық жаңалықтары ---- */}
        <div
          className="tradeiq-card"
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: colors.textPrimary }}>Нарық жаңалықтары</div>
            <a href="/news" style={{ fontSize: "0.75rem", color: colors.gold, textDecoration: "none" }}>
              Барлығын көру →
            </a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {homeNewsLoading && homeNews.length === 0 ? (
              <div style={{ fontSize: "0.78rem", color: colors.textFaint }}>Жүктелуде...</div>
            ) : homeNews.length === 0 ? (
              <div style={{ fontSize: "0.78rem", color: colors.textFaint }}>Жаңалықтар табылмады</div>
            ) : (
              homeNews.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tradeiq-news-item"
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                    textDecoration: "none",
                    border: "1px solid transparent",
                    borderRadius: "8px",
                    padding: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: "0.78rem", color: colors.textPrimary, lineHeight: "1.3" }}>
                      {item.headline}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: colors.textFaint, marginTop: "2px" }}>
                      {item.source} · {formatNewsDate(item.datetime)}
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>

      </div>

      <p style={{ marginTop: "40px", color: colors.textFaint, fontSize: "0.7rem" }}>© TradeIQ — дала рухымен сауда</p>

        </div>
      </div>

      <FloatingChat
        chatMessages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        chatLoading={chatLoading}
        chatError={chatError}
        onSubmit={sendChatMessage}
      />
    </main>
  );
}
