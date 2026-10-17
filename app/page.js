"use client";

import { useState, useEffect } from "react";
import NavMenu from "./NavMenu";
import Header from "./Header";
import ProChart from "./ProChart";
import { supabase } from "./supabaseClient";
import { getSignal } from "../lib/tradeiq-engine";

/* ---------- Дизайн токендары (Жаңа Premium/Neon стиль) ---------- */
const colors = {
  bg: "#0B0F19", 
  card: "rgba(20, 28, 45, 0.6)", 
  cardBorder: "rgba(255, 255, 255, 0.08)",
  gold: "#3b82f6", 
  goldBright: "#60a5fa",
  textPrimary: "#ffffff",
  textMuted: "#9ca3af",
  textFaint: "#6b7280",
  gain: "#10b981", 
  gainBright: "#34d399",
  loss: "#ef4444", 
  lossBright: "#f87171",
  hold: "#eab308", 
};

const AI_SUGGESTIONS = [
  "AAPL акциясына талдау жаса",
  "Нарық жағдайы қалай?",
  "Swing trading бойынша кеңес бер",
];

const fontDisplay = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontBody = fontDisplay;
const fontMono = fontDisplay;

/* Custom CSS - Глобальді стильдер мен анимациялар */
const globalCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
html, body { 
  background-color: ${colors.bg}; 
  color: ${colors.textPrimary}; 
  font-family: ${fontBody}; 
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}
* { box-sizing: border-box; }
.glass-card {
  background: ${colors.card};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid ${colors.cardBorder};
  border-radius: 16px;
}
.tradeiq-input:focus { outline: none; border-color: ${colors.gold} !important; box-shadow: 0 0 10px rgba(59,130,246,0.3); }
.tradeiq-search-btn { transition: all 0.2s ease; }
.tradeiq-search-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
.tradeiq-search-btn:active { transform: scale(0.97); }
.tradeiq-overview-card { transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
.tradeiq-overview-card:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.2) !important; }
.tradeiq-news-item { transition: all 0.2s ease; text-decoration: none; color: inherit; }
.tradeiq-news-item:hover { background: rgba(255,255,255,0.05); border-color: rgba(59,130,246,0.3) !important; transform: translateX(3px); }
.glow-bg {
  position: absolute;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%);
  border-radius: 50%;
  z-index: -1;
  pointer-events: none;
}
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade { animation: fadeInUp 0.5s ease-out; }
.tradeiq-content-shell { margin-left: 0; }
@media (min-width: 1024px) {
  .tradeiq-content-shell { margin-left: 240px; }
}
`;

/* ---------- Логотип ---------- */
function TradeIQMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="12" y1="18" x2="12" y2="38" stroke={colors.loss} strokeWidth="2.4" strokeLinecap="round" style={{filter: 'drop-shadow(0 0 4px #ef4444)'}} />
      <rect x="9" y="24" width="6" height="10" rx="1.5" fill={colors.loss} />
      <line x1="24" y1="10" x2="24" y2="40" stroke={colors.gain} strokeWidth="2.4" strokeLinecap="round" style={{filter: 'drop-shadow(0 0 4px #10b981)'}} />
      <rect x="21" y="18" width="6" height="16" rx="1.5" fill={colors.gain} />
      <line x1="36" y1="6" x2="36" y2="32" stroke={colors.gain} strokeWidth="2.4" strokeLinecap="round" style={{filter: 'drop-shadow(0 0 4px #10b981)'}} />
      <rect x="33" y="12" width="6" height="14" rx="1.5" fill={colors.gain} />
    </svg>
  );
}

/* ---------- Sparkline (Кішкентай карточка графигі) ---------- */
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

  const lineColor = isUp ? "#10b981" : "#ef4444"; 
  const areaPoints = `0,${height} ${points.join(" ")} ${width},${height}`;

  return (
    <div style={{ position: "absolute", bottom: "4px", right: "4px", width: "80px", height: "40px", pointerEvents: "none", opacity: 0.8 }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        <polygon points={areaPoints} fill={lineColor} opacity="0.1" />
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={lineColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{filter: `drop-shadow(0 0 3px ${lineColor})`}}
        />
      </svg>
    </div>
  );
}

/* ---------- Халал скрин карточкасы ---------- */
function HalalCard({ halal }) {
  if (!halal || typeof halal !== "object" || !Array.isArray(halal.checks)) return null;

  const toneOf = (s) =>
    s === "pass" ? colors.gain : s === "fail" ? colors.loss : s === "doubtful" ? colors.hold : colors.textFaint;
  const markOf = (s) => (s === "pass" ? "✓" : s === "fail" ? "✕" : s === "doubtful" ? "⚠" : "?");
  const tone = toneOf(halal.status);

  return (
    <div style={{ marginTop: "22px", paddingTop: "16px", borderTop: `1px solid ${colors.cardBorder}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: colors.gold, textTransform: "uppercase", letterSpacing: "0.6px", textShadow: "0 0 5px rgba(59,130,246,0.5)" }}>
          Халал скрин
        </div>
        <div style={{ fontSize: "0.7rem", fontWeight: "700", color: tone, border: `1px solid ${tone}`, backgroundColor: `${tone}15`, borderRadius: "999px", padding: "3px 10px", textAlign: "center" }}>
          {halal.label}
        </div>
      </div>
      {halal.summary && <div style={{ fontSize: "0.78rem", color: colors.textMuted, lineHeight: "1.45", marginBottom: "12px" }}>{halal.summary}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {halal.checks.map((c) => (
          <div key={c.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", fontSize: "0.8rem" }}>
            <div style={{ minWidth: 0, color: colors.textPrimary }}>
              {c.label}
              {c.note && <div style={{ fontSize: "0.68rem", color: colors.textFaint, marginTop: "2px" }}>{c.note}</div>}
            </div>
            <div style={{ flexShrink: 0, fontFamily: fontMono, fontWeight: "700", color: toneOf(c.status), textAlign: "right" }}>
              {c.display ? c.display + " " : ""}
              {markOf(c.status)}
            </div>
          </div>
        ))}
      </div>
      {halal.disclaimer && <div style={{ marginTop: "12px", fontSize: "0.66rem", color: colors.textFaint, lineHeight: "1.5" }}>⚠ {halal.disclaimer}</div>}
    </div>
  );
}

function formatNewsDate(unixSeconds) {
  if (!unixSeconds || typeof unixSeconds !== "number") return "";
  try { return new Date(unixSeconds * 1000).toLocaleDateString("kk-KZ", { day: "2-digit", month: "2-digit" }); } catch (e) { return ""; }
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
  const [sectors, setSectors] = useState([]);
  const [sectorsLoading, setSectorsLoading] = useState(true);
  const [homeNews, setHomeNews] = useState([]);
  const [homeNewsLoading, setHomeNewsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [watchlistSymbols, setWatchlistSymbols] = useState([]);
  const [watchlistBusy, setWatchlistBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data ? data.session : null); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => { setSession(newSession); });
    return () => { if (listener && listener.subscription) listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadWatchlist() {
      if (!session || !session.user) { setWatchlistSymbols([]); return; }
      const { data: rows } = await supabase.from("watchlist").select("symbol");
      if (!cancelled && rows) { setWatchlistSymbols(rows.map((r) => r.symbol)); }
    }
    loadWatchlist();
    return () => { cancelled = true; };
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
    } catch (err) {} finally { setWatchlistBusy(false); }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadHomeNews() {
      setHomeNewsLoading(true);
      try {
        const res = await fetch("/api/news?symbol=SPY");
        const json = await res.json();
        if (!cancelled && res.ok && Array.isArray(json.news)) { setHomeNews(json.news.slice(0, 3)); }
      } catch (err) {} finally { if (!cancelled) setHomeNewsLoading(false); }
    }
    loadHomeNews();
    return () => { cancelled = true; };
  }, []);

  // ТЕК НАСДАҚ ЖӘНЕ S&P 500 ИНДЕКСКЕРІ ҚАЛДЫРЫЛДЫ
  const OVERVIEW_SYMBOLS = [ 
    { symbol: "QQQ", label: "NASDAQ" }, 
    { symbol: "SPY", label: "S&P 500" } 
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
          } catch (err) { return { ...item, error: true }; }
        })
      );
      if (!cancelled) { setOverview(results); setOverviewLoading(false); }
    }
    loadOverview();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadSectors() {
      setSectorsLoading(true);
      try {
        const res = await fetch("/api/sectors");
        const json = await res.json();
        if (!cancelled && res.ok && Array.isArray(json.sectors)) { setSectors(json.sectors); }
      } catch (err) {} finally { if (!cancelled) setSectorsLoading(false); }
    }
    loadSectors();
    return () => { cancelled = true; };
  }, []);

  function loadFromOverview(symbol) {
    setTicker(symbol);
    searchStock({ preventDefault: () => {} }, symbol);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const symbolParam = params.get("symbol");
    if (symbolParam) { loadFromOverview(symbolParam.toUpperCase()); }
  }, []);

  async function searchStock(e, symbolOverride) {
    e.preventDefault();
    const raw = symbolOverride || ticker;
    if (!raw || !raw.trim()) return;
    const symbol = raw.trim().toUpperCase();
    setLoading(true); setError(""); setData(null); setNews([]); setAiSummary(""); setAiError(""); setChatMessages([]); setChatInput(""); setChatError("");
    try {
      const res = await fetch(`/api/stock?symbol=${symbol}`);
      const json = await res.json();
      if (!res.ok) { setError((json && json.error) || "Қате шықты"); } else { setData(json); }
    } catch (err) { setError("Байланыс қатесі"); } finally { setLoading(false); }
    setNewsLoading(true);
    try {
      const newsRes = await fetch(`/api/news?symbol=${symbol}`);
      const newsJson = await newsRes.json();
      if (newsRes.ok && newsJson && Array.isArray(newsJson.news)) { setNews(newsJson.news); }
    } catch (err) {} finally { setNewsLoading(false); }
  }

  async function getAiSummary() {
    if (!data) return;
    setAiLoading(true); setAiError(""); setAiSummary("");
    try {
      const signal = getSignal(data.technicals, data.currentPrice);
      const res = await fetch("/api/summary", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: data.symbol, name: data.name, currentPrice: data.currentPrice, changePercent: data.changePercent, technicals: data.technicals, fundamentals: data.fundamentals, swingScore: data.swingScore, tradePlan: data.tradePlan, signalLabel: signal ? signal.label : "" }),
      });
      const json = await res.json();
      if (json && json.error) { setAiError(json.error + (json.detail ? " — " + json.detail : "")); } 
      else if (json && json.summary) { setAiSummary(json.summary); } 
      else { setAiError("Белгісіз жауап"); }
    } catch (err) { setAiError("Байланыс қатесі"); } finally { setAiLoading(false); }
  }

  async function sendChatMessage(e, textOverride) {
    e.preventDefault();
    const text = (textOverride || chatInput).trim();
    if (!text || chatLoading) return;
    const newMessages = [...chatMessages, { role: "user", text: text }];
    setChatMessages(newMessages); setChatInput(""); setChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, stockContext: data ? { symbol: data.symbol, name: data.name, currentPrice: data.currentPrice, technicals: data.technicals, swingScore: data.swingScore, swingScoreBreakdown: data.swingScoreBreakdown, fundamentals: data.fundamentals, tradePlan: data.tradePlan } : null }),
      });
      const json = await res.json();
      if (json && json.error) { setChatMessages([...newMessages, { role: "assistant", text: "Қате: " + json.error + (json.detail ? " — " + json.detail : "") }]); } 
      else if (json && json.reply) { setChatMessages([...newMessages, { role: "assistant", text: json.reply }]); }
    } catch (err) { setChatMessages([...newMessages, { role: "assistant", text: "Байланыс қатесі болды." }]); } finally { setChatLoading(false); }
  }

  const isUp = !!(data && typeof data.change === "number" && data.change >= 0);
  const signal = data ? getSignal(data.technicals, data.currentPrice) : null;
  const hasHistory = data && Array.isArray(data.history) && data.history.length > 1;
  const hasTechnicals = data && data.technicals && typeof data.technicals === "object";

  return (
    <main style={{ minHeight: "100vh", position: "relative", paddingBottom: "100px" }}>
      <style>{globalCss}</style>
      
      {/* Background Glows */}
      <div className="glow-bg" style={{ top: "-50px", left: "-50px" }}></div>
      <div className="glow-bg" style={{ top: "30%", right: "-100px", background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(0,0,0,0) 70%)" }}></div>

      <NavMenu />

      <div className="tradeiq-content-shell" style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px", position: "relative", zIndex: 10 }}>
        <Header overview={overview} />

        <div style={{ paddingTop: "32px", display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* ---------- БРЕНД ---------- */}
          <div className="animate-fade" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px", width: "100%", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <TradeIQMark size={42} />
              <h2 style={{ fontSize: "2.5rem", fontWeight: "800", letterSpacing: "-1px", margin: 0 }}>
                Trade<span style={{ color: colors.gold, textShadow: "0 0 10px rgba(59,130,246,0.8)" }}>IQ</span>
              </h2>
            </div>
            <p style={{ color: colors.gold, fontSize: "0.65rem", fontWeight: "bold", letterSpacing: "3px", marginTop: "8px", textShadow: "0 0 8px rgba(59,130,246,0.5)" }}>
              AI-POWERED TRADING
            </p>
            <p style={{ color: colors.textFaint, fontSize: "0.8rem", marginTop: "12px", textAlign: "center" }}>
              Свинг-трейдинг және инвестиция платформасы
            </p>
          </div>

          {/* ---------- ІЗДЕУ ФОРМАСЫ ---------- */}
          <form className="animate-fade" onSubmit={searchStock} style={{ display: "flex", gap: "8px", width: "100%", marginBottom: "32px" }}>
            <div className="glass-card" style={{ flex: 1, display: "flex", alignItems: "center", padding: "4px 16px", borderRadius: "16px" }}>
              <span style={{ fontSize: "1.2rem", color: colors.textFaint, marginRight: "8px" }}>🔍</span>
              <input
                className="tradeiq-input"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="Ticker жаз (мыс. AAPL)"
                style={{ width: "100%", background: "transparent", border: "none", color: colors.textPrimary, padding: "12px 0", fontSize: "0.9rem", fontFamily: fontBody }}
              />
            </div>
            <button
              type="submit"
              className="tradeiq-search-btn"
              style={{ padding: "0 24px", borderRadius: "16px", border: "none", background: colors.gold, color: "#fff", fontWeight: "600", fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 0 15px rgba(59,130,246,0.4)" }}
            >
              Іздеу
            </button>
          </form>

          {/* ---------- НАРЫҚ ШОЛУЫ (НАСДАҚ ЖӘНЕ S&P 500) ---------- */}
          <div className="animate-fade" style={{ width: "100%", marginBottom: "32px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", marginTop: 0 }}>Нарық шолуы</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {overviewLoading && overview.length === 0
                ? OVERVIEW_SYMBOLS.map((item) => (
                    <div key={item.symbol} className="glass-card" style={{ padding: "16px", minHeight: "100px", opacity: 0.5 }}>
                      <div style={{ color: colors.textFaint, fontSize: "0.8rem" }}>{item.label}</div>
                      <div style={{ color: colors.textFaint, fontSize: "0.8rem", marginTop: "8px" }}>Жүктелуде...</div>
                    </div>
                  ))
                : overview.map((item) => {
                    const up = typeof item.change === "number" && item.change >= 0;
                    const glowColor = up ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)";
                    const textColor = up ? colors.gain : colors.loss;
                    const iconBg = up ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)";
                    const iconColor = up ? colors.gain : colors.gold;

                    return (
                      <button
                        key={item.symbol}
                        onClick={() => loadFromOverview(item.symbol)}
                        className="glass-card tradeiq-overview-card"
                        style={{ textAlign: "left", padding: "16px", cursor: "pointer", position: "relative", overflow: "hidden", border: item.error ? `1px solid ${colors.cardBorder}` : `1px solid ${glowColor}`, boxShadow: item.error ? "none" : `0 0 15px ${glowColor.replace('0.3','0.1')} inset` }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                          <span style={{ background: iconBg, color: iconColor, fontSize: "0.65rem", fontWeight: "bold", padding: "3px 6px", borderRadius: "4px" }}>
                            {item.symbol.slice(0, 3)}
                          </span>
                          <span style={{ color: colors.textMuted, fontSize: "0.85rem", fontWeight: "500" }}>{item.label}</span>
                        </div>
                        {item.error ? (
                          <div style={{ color: colors.textFaint, fontSize: "0.8rem", marginTop: "8px" }}>Деректер жоқ</div>
                        ) : (
                          <>
                            <div style={{ color: colors.textPrimary, fontSize: "1.3rem", fontWeight: "700", fontFamily: fontMono }}>
                              {safeNum(item.currentPrice, 2)}
                            </div>
                            <div style={{ color: textColor, fontSize: "0.8rem", marginTop: "4px", fontFamily: fontMono, display: "flex", alignItems: "center", gap: "4px" }}>
                              <span>{up ? "▲" : "▼"}</span> {safeNum(item.changePercent, 2)}%
                            </div>
                            {Array.isArray(item.history) && item.history.length > 1 && (
                              <Sparkline history={item.history} isUp={up} />
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
            </div>
          </div>

          {/* ---------- AI ТАЛДАУ ---------- */}
          <div className="animate-fade" style={{ width: "100%", marginBottom: "32px" }}>
            <div className="glass-card" style={{ padding: "20px", position: "relative", overflow: "hidden", borderColor: "rgba(59,130,246,0.3)" }}>
              <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: "rgba(59,130,246,0.1)", filter: "blur(40px)", borderRadius: "50%" }}></div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", position: "relative", zIndex: 2 }}>
                <span style={{ color: colors.goldBright, fontSize: "1.2rem" }}>✦</span>
                <h3 style={{ margin: 0, fontWeight: "700", fontSize: "1rem" }}>TradeIQ AI</h3>
              </div>
              <p style={{ color: colors.textMuted, fontSize: "0.75rem", marginBottom: "16px", position: "relative", zIndex: 2 }}>Қалай көмектесе аламын? ✨</p>

              {chatMessages.length > 0 ? (
                <div className="hide-scrollbar" style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto", marginBottom: "12px", position: "relative", zIndex: 2 }}>
                  {chatMessages.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                        maxWidth: "85%",
                        background: m.role === "user" ? colors.gold : "rgba(255,255,255,0.05)",
                        color: m.role === "user" ? "#fff" : colors.textPrimary,
                        border: m.role === "user" ? "none" : `1px solid ${colors.cardBorder}`,
                        borderRadius: m.role === "user" ? "16px 16px 0 16px" : "16px 16px 16px 0",
                        padding: "10px 14px",
                        fontSize: "0.85rem",
                        lineHeight: "1.4"
                      }}
                    >
                      {m.text}
                    </div>
                  ))}
                  {chatLoading && <div style={{ alignSelf: "flex-start", color: colors.textFaint, fontSize: "0.75rem", fontStyle: "italic" }}>Жазып жатыр...</div>}
                </div>
              ) : (
                <div className="hide-scrollbar" style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "4px", position: "relative", zIndex: 2 }}>
                  {AI_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendChatMessage({ preventDefault: () => {} }, suggestion)}
                      className="tradeiq-search-btn"
                      style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "12px", border: `1px solid ${colors.cardBorder}`, background: "rgba(255,255,255,0.03)", color: colors.textMuted, fontSize: "0.75rem", cursor: "pointer" }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {chatError && <p style={{ color: colors.lossBright, fontSize: "0.75rem", marginBottom: "8px", position: "relative", zIndex: 2 }}>{chatError}</p>}

              <form onSubmit={sendChatMessage} style={{ display: "flex", gap: "8px", position: "relative", zIndex: 2 }}>
                <input
                  className="tradeiq-input"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Сұрағыңызды жазыңыз..."
                  style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.cardBorder}`, borderRadius: "12px", padding: "10px 14px", color: colors.textPrimary, fontSize: "0.85rem", fontFamily: fontBody }}
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="tradeiq-search-btn"
                  style={{ padding: "0 20px", borderRadius: "12px", border: "none", background: colors.gold, color: "#fff", fontWeight: "600", fontSize: "0.85rem", cursor: chatLoading ? "default" : "pointer", boxShadow: "0 0 10px rgba(59,130,246,0.3)" }}
                >
                  Жіберу
                </button>
              </form>
            </div>
          </div>

          {/* ---------- СЕКТОРЛАР ---------- */}
          <div className="animate-fade" style={{ width: "100%", marginBottom: "32px" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: "700", color: colors.textPrimary, marginBottom: "16px", marginTop: 0 }}>Секторлар — ақша қай жаққа құйылып жатыр</h3>
            <div className="glass-card" style={{ padding: "20px" }}>
              {sectorsLoading && sectors.length === 0 ? (
                <div style={{ fontSize: "0.8rem", color: colors.textFaint, textAlign: "center" }}>Жүктелуде...</div>
              ) : sectors.length === 0 ? (
                <div style={{ fontSize: "0.8rem", color: colors.textFaint, textAlign: "center" }}>Сектор деректері жоқ</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {sectors.map((s) => {
                    const up = typeof s.changePercent === "number" && s.changePercent >= 0;
                    const magnitude = Math.min(Math.abs(s.changePercent || 0) / 2, 1);
                    return (
                      <div key={s.symbol} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.75rem" }}>
                        <span style={{ width: "110px", color: colors.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</span>
                        <div style={{ flex: 1, height: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "5px", overflow: "hidden", position: "relative" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.max(2, magnitude * 100)}%`,
                              background: up ? colors.gain : colors.loss,
                              borderRadius: "5px",
                              boxShadow: `0 0 8px ${up ? colors.gain : colors.loss}`
                            }}
                          />
                        </div>
                        <span style={{ width: "50px", textAlign: "right", fontFamily: fontMono, fontWeight: "600", color: up ? colors.gainBright : colors.lossBright }}>
                          {up ? "▲" : "▼"}{safeNum(Math.abs(s.changePercent), 2)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {loading && <p style={{ margin: "24px 0", color: colors.textMuted, animation: "fadeInUp 1s infinite alternate" }}>Мәліметтер ізделуде...</p>}
          {error && <p style={{ margin: "24px 0", color: colors.lossBright }}>{error}</p>}

          {/* ---------- БАСТЫ НӘТИЖЕ КАРТОЧКАСЫ ---------- */}
          {data && (
            <div className="glass-card animate-fade" style={{ width: "100%", padding: "24px", position: "relative", overflow: "hidden", marginBottom: "32px", borderRadius: "24px" }}>
              <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: "rgba(59,130,246,0.15)", filter: "blur(40px)", borderRadius: "50%" }}></div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {data.logo ? (
                    <img src={data.logo} alt="" style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(255,255,255,0.05)" }} />
                  ) : (
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(59,130,246,0.2)", color: colors.goldBright, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                      {data.symbol?.slice(0,2)}
                    </div>
                  )}
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "800", letterSpacing: "1px" }}>{data.symbol}</h2>
                    <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: colors.textMuted }}>{data.name}</p>
                  </div>
                </div>
                {session?.user && (
                  <button 
                    onClick={() => toggleWatchlist(data.symbol)}
                    style={{ background: "transparent", border: "none", fontSize: "1.8rem", cursor: "pointer", color: watchlistSymbols.includes(data.symbol) ? "#f59e0b" : colors.textFaint, transition: "transform 0.2s" }}
                  >
                    {watchlistSymbols.includes(data.symbol) ? "★" : "☆"}
                  </button>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", fontFamily: fontMono, marginBottom: "24px", position: "relative", zIndex: 2 }}>
                <span style={{ fontSize: "2.5rem", fontWeight: "800" }}>${safeNum(data.currentPrice, 2)}</span>
                <span style={{ fontSize: "0.9rem", fontWeight: "600", color: isUp ? colors.gain : colors.loss }}>
                  {isUp ? "▲" : "▼"}{safeNum(Math.abs(data.change), 2)} ({safeNum(data.changePercent, 2)}%)
                </span>
              </div>

              {Array.isArray(data.chartData) && data.chartData.length > 1 ? (
                <div style={{ marginBottom: "24px", height: "160px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: `1px solid ${colors.cardBorder}`, overflow: "hidden" }}>
                  <ProChart chartData={data.chartData} pivot={data.pivot} tradePlan={data.tradePlan} colors={colors} />
                </div>
              ) : hasHistory && (
                <div style={{ marginBottom: "24px", height: "80px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: `1px solid ${colors.cardBorder}`, position: "relative", overflow: "hidden" }}>
                  <Sparkline history={data.history} isUp={isUp} />
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "16px", border: `1px solid ${colors.cardBorder}`, marginBottom: "24px", fontSize: "0.75rem", color: colors.textMuted, fontFamily: fontMono }}>
                <div>Open: <span style={{ color: colors.textPrimary }}>${safeNum(data.open, 2)}</span></div>
                <div>Prev Close: <span style={{ color: colors.textPrimary }}>${safeNum(data.previousClose, 2)}</span></div>
                <div>High: <span style={{ color: colors.textPrimary }}>${safeNum(data.high, 2)}</span></div>
                <div>Low: <span style={{ color: colors.textPrimary }}>${safeNum(data.low, 2)}</span></div>
                {data.marketCap && <div>Mkt Cap: <span style={{ color: colors.textPrimary }}>${(data.marketCap/1000).toFixed(1)}B</span></div>}
              </div>

              {data.tradePlan && (
                <div style={{ marginBottom: "24px", padding: "16px", borderRadius: "16px", border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.05)" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: colors.goldBright, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: colors.gold, boxShadow: "0 0 5px #3b82f6" }}></span>
                    Сауда жоспары
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.85rem", fontFamily: fontMono }}>
                    <div>Entry: <span style={{ color: colors.textPrimary, fontWeight: "bold" }}>${safeNum(data.tradePlan.entry, 2)}</span></div>
                    <div>Stop Loss: <span style={{ color: colors.lossBright, fontWeight: "bold" }}>${safeNum(data.tradePlan.stopLoss, 2)}</span></div>
                    <div>TP 1: <span style={{ color: colors.gainBright, fontWeight: "bold" }}>${safeNum(data.tradePlan.takeProfit1, 2)}</span></div>
                    <div>TP 2: <span style={{ color: colors.gainBright, fontWeight: "bold" }}>${safeNum(data.tradePlan.takeProfit2, 2)}</span></div>
                  </div>
                </div>
              )}

              {hasTechnicals && (
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "0.75rem", fontWeight: "bold", color: colors.textFaint, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", marginTop: 0 }}>Техникалық анализ</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.75rem", fontFamily: fontMono, color: colors.textMuted }}>
                    <div>RSI (14): <span style={{ color: data.technicals.rsi > 70 ? colors.lossBright : data.technicals.rsi < 30 ? colors.gainBright : colors.textPrimary }}>{safeNum(data.technicals.rsi, 2)}</span></div>
                    <div>MACD: <span style={{ color: data.technicals.macd > 0 ? colors.gainBright : colors.lossBright }}>{safeNum(data.technicals.macd, 2)}</span></div>
                    <div>SMA20: ${safeNum(data.technicals.sma20, 2)}</div>
                    <div>SMA50: ${safeNum(data.technicals.sma50, 2)}</div>
                  </div>
                  
                  {signal && (
                    <div style={{ marginTop: "16px", padding: "12px", borderRadius: "12px", border: `1px solid rgba(255,255,255,0.1)`, background: "rgba(255,255,255,0.03)" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: "bold", fontFamily: fontMono, marginBottom: "8px", color: signal.level === 'bullish' ? colors.gainBright : signal.level === 'bearish' ? colors.lossBright : colors.hold }}>
                        Сигнал: {signal.label}
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.7rem", color: colors.textMuted, lineHeight: "1.5" }}>
                        {signal.reasons.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={getAiSummary}
                disabled={aiLoading}
                className="tradeiq-search-btn"
                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: `1px solid rgba(59,130,246,0.5)`, background: "rgba(59,130,246,0.05)", color: colors.goldBright, fontWeight: "bold", fontSize: "0.85rem", cursor: aiLoading ? "default" : "pointer", boxShadow: "0 0 15px rgba(59,130,246,0.15)", marginTop: "8px" }}
              >
                {aiLoading ? "Талдау жасалуда..." : "✨ AI қорытынды алу"}
              </button>
              
              {aiSummary && (
                <div style={{ marginTop: "16px", padding: "16px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.cardBorder}`, fontSize: "0.85rem", color: "#e2e8f0", lineHeight: "1.6" }}>
                  {aiSummary}
                </div>
              )}

              <HalalCard halal={data.halal} />
            </div>
          )}

          {/* ---------- НАРЫҚ ЖАҢАЛЫҚТАРЫ ---------- */}
          <div className="animate-fade" style={{ width: "100%", marginBottom: "32px" }}>
            <div className="glass-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "700", color: colors.textPrimary }}>Нарық жаңалықтары</h3>
                <a href="/news" style={{ fontSize: "0.75rem", color: colors.goldBright, textDecoration: "none" }}>Барлығы →</a>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {homeNewsLoading ? (
                  <div style={{ fontSize: "0.75rem", color: colors.textFaint }}>Жүктелуде...</div>
                ) : (
                  homeNews.map((item, i) => (
                    <a key={i} href={item.url} target="_blank" rel="noreferrer" className="tradeiq-news-item" style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "8px", borderRadius: "12px", border: "1px solid transparent" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.cardBorder}`, flexShrink: 0 }}></div>
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "#e2e8f0", lineHeight: "1.4", marginBottom: "4px" }}>
                          {item.headline}
                        </div>
                        <div style={{ fontSize: "0.65rem", color: colors.textFaint, fontFamily: fontMono }}>
                          {item.source} · {formatNewsDate(item.datetime)}
                        </div>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>
          </div>

          <p style={{ margin: "16px 0 32px", textAlign: "center", color: colors.textFaint, fontSize: "0.7rem" }}>© TradeIQ — дала рухымен сауда</p>
        </div>
      </div>
    </main>
  );
}
