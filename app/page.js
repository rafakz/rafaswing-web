"use client";

import { useState, useEffect } from "react";
import NavMenu from "./NavMenu";
import Header from "./Header";
import ProChart from "./ProChart";
import { supabase } from "./supabaseClient";
import { getSignal } from "../lib/tradeiq-engine";

/* ---------- Дизайн токендары (Premium / Neon стилі) ---------- */
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

const fontDisplay = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontBody = fontDisplay;
const fontMono = fontDisplay;

/* Custom CSS */
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
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid ${colors.cardBorder};
  border-radius: 20px;
}
.tradeiq-search-capsule {
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.tradeiq-search-capsule:focus-within {
  border-color: rgba(59,130,246,0.6) !important;
  box-shadow: 0 0 20px rgba(59,130,246,0.15);
}
.tradeiq-search-btn { transition: all 0.2s ease; }
.tradeiq-search-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
.tradeiq-search-btn:active { transform: scale(0.97); }
.tradeiq-overview-card { transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
.tradeiq-overview-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.2) !important; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
.tradeiq-news-item { transition: all 0.2s ease; text-decoration: none; color: inherit; }
.tradeiq-news-item:hover { background: rgba(255,255,255,0.05); border-color: rgba(59,130,246,0.3) !important; transform: translateX(3px); }
.glow-bg {
  position: absolute;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(0,0,0,0) 70%);
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

function TradeIQMark({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="12" y1="18" x2="12" y2="38" stroke={colors.loss} strokeWidth="2.8" strokeLinecap="round" style={{filter: 'drop-shadow(0 0 5px #ef4444)'}} />
      <rect x="9" y="24" width="6" height="10" rx="2" fill={colors.loss} />
      <line x1="24" y1="10" x2="24" y2="40" stroke={colors.gain} strokeWidth="2.8" strokeLinecap="round" style={{filter: 'drop-shadow(0 0 5px #10b981)'}} />
      <rect x="21" y="18" width="6" height="16" rx="2" fill={colors.gain} />
      <line x1="36" y1="6" x2="36" y2="32" stroke={colors.gain} strokeWidth="2.8" strokeLinecap="round" style={{filter: 'drop-shadow(0 0 5px #10b981)'}} />
      <rect x="33" y="12" width="6" height="14" rx="2" fill={colors.gain} />
    </svg>
  );
}

function Sparkline({ history, isUp }) {
  if (!Array.isArray(history) || history.length < 2) return null;
  const closes = history.map((h) => (h && typeof h.close === "number" ? h.close : null)).filter((c) => c !== null && !isNaN(c));
  if (closes.length < 2) return null;

  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;

  const width = 300;
  const height = 60;
  const padY = 2;

  const points = closes.map((c, i) => {
    const x = (i / (closes.length - 1)) * width;
    const y = padY + (1 - (c - min) / range) * (height - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const lineColor = isUp ? "#10b981" : "#ef4444"; 
  const areaPoints = `0,${height} ${points.join(" ")} ${width},${height}`;

  return (
    <div style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        <polygon points={areaPoints} fill={lineColor} opacity="0.1" />
        <polyline points={points.join(" ")} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function SentimentMeter({ score }) {
  const getLabel = (s) => {
    if(s >= 60) return { text: "Өсуге бейім (Bullish)", color: colors.gainBright };
    if(s <= 40) return { text: "Түсуге бейім (Bearish)", color: colors.lossBright };
    return { text: "Бейтарап (Neutral)", color: colors.hold };
  };
  const { text, color } = getLabel(score);
  
  return (
    <div style={{ marginBottom: "30px", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: colors.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: colors.goldBright }}>🧠</span> AI Нарық көңіл-күйі
        </div>
        <div style={{ fontSize: "0.85rem", fontWeight: "700", color: color }}>
          {text} ({score}%)
        </div>
      </div>
      <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "100%", background: `linear-gradient(90deg, ${colors.lossBright} 0%, ${colors.hold} 50%, ${colors.gainBright} 100%)`, borderRadius: "4px", opacity: 0.8 }} />
        <div style={{ position: "absolute", left: `calc(${score}% - 4px)`, top: "-3px", width: "8px", height: "14px", background: "#fff", borderRadius: "4px", boxShadow: "0 0 8px rgba(0,0,0,0.8)", transition: "left 1s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.65rem", color: colors.textFaint, textTransform: "uppercase", fontWeight: "bold" }}>
        <span>Қорқыныш</span>
        <span>Ашкөздік</span>
      </div>
    </div>
  );
}

function HalalCard({ halal }) {
  if (!halal || typeof halal !== "object" || !Array.isArray(halal.checks)) return null;
  const toneOf = (s) => s === "pass" ? colors.gain : s === "fail" ? colors.loss : s === "doubtful" ? colors.hold : colors.textFaint;
  const markOf = (s) => s === "pass" ? "✓" : s === "fail" ? "✕" : s === "doubtful" ? "⚠" : "?";
  const tone = toneOf(halal.status);

  return (
    <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: `1px solid ${colors.cardBorder}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: colors.gold, textTransform: "uppercase", letterSpacing: "0.5px" }}>Халал скрин</div>
        <div style={{ fontSize: "0.75rem", fontWeight: "700", color: tone, border: `1px solid ${tone}`, backgroundColor: `${tone}15`, borderRadius: "999px", padding: "4px 12px", textAlign: "center" }}>{halal.label}</div>
      </div>
      {halal.summary && <div style={{ fontSize: "0.8rem", color: colors.textMuted, lineHeight: "1.5", marginBottom: "16px" }}>{halal.summary}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {halal.checks.map((c) => (
          <div key={c.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", fontSize: "0.85rem" }}>
            <div style={{ minWidth: 0, color: colors.textPrimary }}>{c.label}{c.note && <div style={{ fontSize: "0.7rem", color: colors.textFaint, marginTop: "2px" }}>{c.note}</div>}</div>
            <div style={{ flexShrink: 0, fontFamily: fontMono, fontWeight: "700", color: toneOf(c.status), textAlign: "right" }}>{c.display ? c.display + " " : ""}{markOf(c.status)}</div>
          </div>
        ))}
      </div>
      {halal.disclaimer && <div style={{ marginTop: "16px", fontSize: "0.7rem", color: colors.textFaint, lineHeight: "1.5" }}>⚠ {halal.disclaimer}</div>}
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

/* ---------- AI ФУНДАМЕНТАЛДЫ ТАЛДАУ АЛГОРИТМІ ---------- */
function evaluateFundamental(key, value) {
  if (typeof value !== "number" || isNaN(value)) return { text: "—", color: colors.textFaint };
  if (key === "PE") {
    if (value < 15 && value > 0) return { text: "🟢 Тартымды", color: colors.gainBright };
    if (value <= 25 && value >= 15) return { text: "🟡 Қалыпты", color: colors.hold };
    return { text: "🔴 Қымбат", color: colors.lossBright };
  }
  if (key === "DE") {
    if (value < 1) return { text: "🟢 Қауіпсіз", color: colors.gainBright };
    if (value <= 2) return { text: "🟡 Орташа", color: colors.hold };
    return { text: "🔴 Қауіпті", color: colors.lossBright };
  }
  if (key === "CR") {
    if (value >= 1.5) return { text: "🟢 Өтімді", color: colors.gainBright };
    if (value >= 1) return { text: "🟡 Қалыпты", color: colors.hold };
    return { text: "🔴 Нашар", color: colors.lossBright };
  }
  if (key === "ROE") {
    if (value >= 15) return { text: "🟢 Өте тиімді", color: colors.gainBright };
    if (value >= 5) return { text: "🟡 Қалыпты", color: colors.hold };
    return { text: "🔴 Тиімсіз", color: colors.lossBright };
  }
  if (key === "PM") {
    if (value >= 10) return { text: "🟢 Табысты", color: colors.gainBright };
    if (value > 0) return { text: "🟡 Аз маржа", color: colors.hold };
    return { text: "🔴 Шығын", color: colors.lossBright };
  }
  if (key === "PB") {
    if (value <= 3 && value >= 1) return { text: "🟢 Әділ", color: colors.gainBright };
    if (value > 0 && value < 1) return { text: "🟡 Арзан", color: colors.hold };
    return { text: "🔴 Қымбат", color: colors.lossBright };
  }
  return { text: "—", color: colors.textMuted };
}

/* ---------- ВАЛЮТАНЫ (USD/KZT) АДАМИ ФОРМАТТАУ ---------- */
function fmtCurr(val, curr, rate) {
  if (typeof val !== "number" || isNaN(val)) return "—";
  if (curr === "KZT") {
    const kztVal = val * rate;
    return "₸" + kztVal.toLocaleString("kk-KZ", { maximumFractionDigits: 0 });
  }
  return "$" + val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtMarketCap(valInMillions, curr, rate) {
  if (typeof valInMillions !== "number" || isNaN(valInMillions)) return "—";
  const actualValue = valInMillions * 1000000;
  if (curr === "KZT") {
    const kzt = actualValue * rate;
    return (kzt / 1000000000).toFixed(1) + "B ₸";
  }
  return "$" + (actualValue / 1000000000).toFixed(1) + "B";
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
  
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", text: "Қош келдіңіз! Мен TradeIQ AI көмекшісімін. Сізге қандай көмек керек? Акцияны немесе нарықты талдап бере аламын." }
  ]);
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

  // ---------- ЖАҢА: ВАЛЮТА БАПТАУЛАРЫ ЖӘНЕ БАҒАМ ----------
  const [currency, setCurrency] = useState("USD");
  const [usdkzt, setUsdkzt] = useState(500); // Резервтік бағам

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then(res => res.json())
      .then(d => {
        if (d && d.rates && d.rates.KZT) {
          setUsdkzt(d.rates.KZT);
        }
      })
      .catch(() => {});
  }, []);

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

  const OVERVIEW_SYMBOLS = [ { symbol: "QQQ", label: "NASDAQ" }, { symbol: "SPY", label: "S&P 500" } ];

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
    setLoading(true); setError(""); setData(null); setNews([]); setAiSummary(""); setAiError(""); 
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

  async function sendChatMessage(e) {
    e.preventDefault();
    const text = chatInput.trim();
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
  const hasFundamentals = data && data.fundamentals && typeof data.fundamentals === "object";

  let currentSentimentScore = 50;
  if (data) {
    if (data.technicals && data.technicals.rsi) {
      currentSentimentScore = Math.min(100, Math.max(0, Math.round(data.technicals.rsi)));
    } else if (data.changePercent) {
      currentSentimentScore = data.changePercent > 0 ? 65 : 35;
    }
  }

  const renderSmartFundItem = (label, value, key) => {
    const evalData = evaluateFundamental(key, value);
    const displayValue = safeNum(value, 2);
    
    return (
      <div style={{ padding: "14px", background: "rgba(0,0,0,0.25)", borderRadius: "12px", border: `1px solid rgba(255,255,255,0.05)` }}>
        <div style={{ fontSize: "0.7rem", color: colors.textFaint, textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "1.05rem", fontWeight: "700", color: colors.textPrimary }}>
             {displayValue !== "—" ? (key === "PM" || key === "ROE" ? displayValue + "%" : displayValue) : "—"}
          </span>
          {displayValue !== "—" && (
            <span style={{ fontSize: "0.75rem", fontWeight: "600", color: evalData.color, background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "6px" }}>
              {evalData.text}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Header-ге баратын индекстерді валютаға бейімдеу
  const convertedOverview = overview.map(item => ({
    ...item,
    currentPrice: item.currentPrice ? item.currentPrice * (currency === "KZT" ? usdkzt : 1) : null
  }));

  // ProChart-қа баратын график мәндерін валютаға бейімдеу
  const convertedChartData = data?.chartData?.map(d => ({
    ...d,
    open: d.open * (currency === "KZT" ? usdkzt : 1),
    high: d.high * (currency === "KZT" ? usdkzt : 1),
    low: d.low * (currency === "KZT" ? usdkzt : 1),
    close: d.close * (currency === "KZT" ? usdkzt : 1),
    ema20: d.ema20 ? d.ema20 * (currency === "KZT" ? usdkzt : 1) : null,
    ema50: d.ema50 ? d.ema50 * (currency === "KZT" ? usdkzt : 1) : null,
  })) || [];

  const convertedTradePlan = data?.tradePlan ? {
    entry: data.tradePlan.entry * (currency === "KZT" ? usdkzt : 1),
    stopLoss: data.tradePlan.stopLoss * (currency === "KZT" ? usdkzt : 1),
    takeProfit1: data.tradePlan.takeProfit1 * (currency === "KZT" ? usdkzt : 1),
    takeProfit2: data.tradePlan.takeProfit2 * (currency === "KZT" ? usdkzt : 1),
  } : null;

  const convertedPivot = data?.pivot ? {
    pivot: data.pivot.pivot * (currency === "KZT" ? usdkzt : 1),
    r1: data.pivot.r1 * (currency === "KZT" ? usdkzt : 1),
    s1: data.pivot.s1 * (currency === "KZT" ? usdkzt : 1),
    r2: data.pivot.r2 * (currency === "KZT" ? usdkzt : 1),
    s2: data.pivot.s2 * (currency === "KZT" ? usdkzt : 1),
  } : null;

  return (
    <main style={{ minHeight: "100vh", position: "relative", paddingBottom: "140px" }}>
      <style>{globalCss}</style>
      
      <div className="glow-bg" style={{ top: "-50px", left: "-50px" }}></div>
      <div className="glow-bg" style={{ top: "30%", right: "-100px", background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(0,0,0,0) 70%)" }}></div>

      <NavMenu />

      <div className="tradeiq-content-shell" style={{ maxWidth: "500px", margin: "0 auto", padding: "0 16px", position: "relative", zIndex: 10 }}>
        
        {/* Header автоматты түрде жаңа конверттелген Overview қабылдайды */}
        <Header overview={convertedOverview} />

        <div style={{ paddingTop: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>

          <div className="animate-fade" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "40px", width: "100%", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <TradeIQMark size={48} />
              <h2 style={{ fontSize: "2.8rem", fontWeight: "800", letterSpacing: "-1.5px", margin: 0 }}>
                Trade<span style={{ color: colors.gold, textShadow: "0 0 15px rgba(59,130,246,0.8)" }}>IQ</span>
              </h2>
            </div>
            <p style={{ color: colors.gold, fontSize: "0.7rem", fontWeight: "700", letterSpacing: "4px", marginTop: "12px", textShadow: "0 0 10px rgba(59,130,246,0.5)" }}>
              AI-POWERED TRADING
            </p>
          </div>

          <form className="animate-fade tradeiq-search-capsule" onSubmit={searchStock} style={{ display: "flex", width: "100%", marginBottom: "48px", background: "rgba(30, 41, 59, 0.4)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: "24px", border: `1px solid rgba(255,255,255,0.08)`, padding: "6px" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 16px" }}>
              <span style={{ fontSize: "1.2rem", color: colors.textFaint, marginRight: "12px" }}>🔍</span>
              <input
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="Тикер жазыңыз (мыс. AAPL)"
                style={{ width: "100%", background: "transparent", border: "none", color: colors.textPrimary, fontSize: "1rem", fontFamily: fontBody, outline: "none" }}
              />
            </div>
            <button
              type="submit"
              className="tradeiq-search-btn"
              style={{ padding: "0 28px", height: "46px", borderRadius: "18px", border: "none", background: colors.gold, color: "#fff", fontWeight: "600", fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 4px 15px rgba(59,130,246,0.4)" }}
            >
              Іздеу
            </button>
          </form>

          {/* ---------- НАРЫҚ ШОЛУЫ МЕН ВАЛЮТА АУЫСТЫРУ ---------- */}
          <div className="animate-fade" style={{ width: "100%", marginBottom: "48px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0 }}>Нарық шолуы</h3>
              
              {/* USD / KZT Тұмблер (Ауыстырып-қосқыш) */}
              <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "4px", border: `1px solid ${colors.cardBorder}` }}>
                <button
                  onClick={() => setCurrency("USD")}
                  style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: currency === "USD" ? colors.gold : "transparent", color: currency === "USD" ? "#fff" : colors.textMuted, fontSize: "0.75rem", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }}
                >
                  USD
                </button>
                <button
                  onClick={() => setCurrency("KZT")}
                  style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: currency === "KZT" ? colors.gain : "transparent", color: currency === "KZT" ? "#fff" : colors.textMuted, fontSize: "0.75rem", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }}
                >
                  KZT
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {overviewLoading && overview.length === 0
                ? OVERVIEW_SYMBOLS.map((item) => (
                    <div key={item.symbol} className="glass-card" style={{ padding: "20px", minHeight: "140px", opacity: 0.5 }}>
                      <div style={{ color: colors.textFaint, fontSize: "0.85rem" }}>{item.label}</div>
                      <div style={{ color: colors.textFaint, fontSize: "0.85rem", marginTop: "12px" }}>Жүктелуде...</div>
                    </div>
                  ))
                : overview.map((item) => {
                    const up = typeof item.change === "number" && item.change >= 0;
                    const glowColor = up ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)";
                    const textColor = up ? colors.gain : colors.loss;
                    const iconBg = up ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)";
                    const iconColor = up ? colors.gainBright : colors.goldBright;

                    return (
                      <button
                        key={item.symbol}
                        onClick={() => loadFromOverview(item.symbol)}
                        className="glass-card tradeiq-overview-card"
                        style={{ textAlign: "left", padding: "20px", cursor: "pointer", position: "relative", overflow: "hidden", border: item.error ? `1px solid ${colors.cardBorder}` : `1px solid ${glowColor}`, boxShadow: item.error ? "none" : `0 0 20px ${glowColor.replace('0.3','0.05')} inset`, minHeight: "145px", display: "flex", flexDirection: "column" }}
                      >
                        <div style={{ position: "relative", zIndex: 2, width: "100%" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ background: iconBg, color: iconColor, fontSize: "0.7rem", fontWeight: "bold", padding: "4px 8px", borderRadius: "6px" }}>{item.symbol}</span>
                            <span style={{ color: colors.textMuted, fontSize: "0.95rem", fontWeight: "600" }}>{item.label}</span>
                          </div>
                          {item.error ? (
                            <div style={{ color: colors.textFaint, fontSize: "0.85rem", marginTop: "16px" }}>Деректер жоқ</div>
                          ) : (
                            <div style={{ marginTop: "24px" }}>
                              <div style={{ color: colors.textPrimary, fontSize: "1.6rem", fontWeight: "800", fontFamily: fontMono, letterSpacing: "-0.5px" }}>
                                {fmtCurr(item.currentPrice, currency, usdkzt)}
                              </div>
                              <div style={{ color: textColor, fontSize: "0.9rem", marginTop: "6px", fontFamily: fontMono, display: "flex", alignItems: "center", gap: "6px", fontWeight: "600" }}>
                                <span>{up ? "▲" : "▼"}</span> {safeNum(item.changePercent, 2)}%
                              </div>
                            </div>
                          )}
                        </div>
                        {!item.error && Array.isArray(item.history) && item.history.length > 1 && (
                          <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "60px", zIndex: 1, opacity: 0.6 }}>
                            <Sparkline history={item.history} isUp={up} />
                          </div>
                        )}
                      </button>
                    );
                  })}
            </div>
          </div>

          <div className="animate-fade" style={{ width: "100%", marginBottom: "48px" }}>
            <div className="glass-card" style={{ padding: "24px", position: "relative", overflow: "hidden", borderColor: "rgba(59,130,246,0.4)", boxShadow: "0 0 30px rgba(59,130,246,0.1)" }}>
              <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: "rgba(59,130,246,0.15)", filter: "blur(40px)", borderRadius: "50%" }}></div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", position: "relative", zIndex: 2 }}>
                <span style={{ color: colors.goldBright, fontSize: "1.3rem", filter: "drop-shadow(0 0 5px rgba(96,165,250,0.8))" }}>✦</span>
                <h3 style={{ margin: 0, fontWeight: "700", fontSize: "1.1rem" }}>TradeIQ AI</h3>
              </div>

              <div className="hide-scrollbar" style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "260px", overflowY: "auto", marginBottom: "20px", position: "relative", zIndex: 2 }}>
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", background: m.role === "user" ? colors.gold : "rgba(255,255,255,0.06)", color: m.role === "user" ? "#fff" : colors.textPrimary, border: m.role === "user" ? "none" : `1px solid rgba(255,255,255,0.1)`, borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "14px 16px", fontSize: "0.9rem", lineHeight: "1.5", boxShadow: m.role === "user" ? "0 4px 15px rgba(59,130,246,0.3)" : "none" }}>
                    {m.text}
                  </div>
                ))}
                {chatLoading && <div style={{ alignSelf: "flex-start", color: colors.goldBright, fontSize: "0.85rem", fontStyle: "italic" }}>Ойланып жатыр...</div>}
              </div>

              {chatError && <p style={{ color: colors.lossBright, fontSize: "0.8rem", marginBottom: "12px", position: "relative", zIndex: 2 }}>{chatError}</p>}

              <form onSubmit={sendChatMessage} style={{ display: "flex", gap: "10px", position: "relative", zIndex: 2 }}>
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Сұрағыңызды жазыңыз..." style={{ flex: 1, background: "rgba(0,0,0,0.2)", border: `1px solid rgba(255,255,255,0.15)`, borderRadius: "16px", padding: "14px 16px", color: colors.textPrimary, fontSize: "0.95rem", fontFamily: fontBody, outline: "none", transition: "border-color 0.2s" }} onFocus={(e) => e.currentTarget.style.borderColor = "rgba(59,130,246,0.6)"} onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"} />
                <button type="submit" disabled={chatLoading} className="tradeiq-search-btn" style={{ width: "50px", height: "50px", borderRadius: "16px", border: "none", background: colors.gold, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: chatLoading ? "default" : "pointer", boxShadow: "0 4px 15px rgba(59,130,246,0.4)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </form>
            </div>
          </div>

          <div className="animate-fade" style={{ width: "100%", marginBottom: "48px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: colors.textPrimary, marginBottom: "20px", marginTop: 0 }}>Секторлар — ақша қайда құйылуда?</h3>
            <div className="glass-card" style={{ padding: "24px" }}>
              {sectorsLoading && sectors.length === 0 ? (
                <div style={{ fontSize: "0.9rem", color: colors.textFaint, textAlign: "center" }}>Жүктелуде...</div>
              ) : sectors.length === 0 ? (
                <div style={{ fontSize: "0.9rem", color: colors.textFaint, textAlign: "center" }}>Сектор деректері жоқ</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {sectors.map((s) => {
                    const up = typeof s.changePercent === "number" && s.changePercent >= 0;
                    const magnitude = Math.min(Math.abs(s.changePercent || 0) / 2, 1);
                    return (
                      <div key={s.symbol} style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.85rem" }}>
                        <span style={{ width: "120px", color: colors.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: "500" }}>{s.label}</span>
                        <div style={{ flex: 1, height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden", position: "relative" }}>
                          <div style={{ height: "100%", width: `${Math.max(2, magnitude * 100)}%`, background: up ? colors.gain : colors.loss, borderRadius: "4px", boxShadow: `0 0 10px ${up ? colors.gain : colors.loss}` }} />
                        </div>
                        <span style={{ width: "55px", textAlign: "right", fontFamily: fontMono, fontWeight: "700", color: up ? colors.gainBright : colors.lossBright }}>
                          {up ? "▲" : "▼"}{safeNum(Math.abs(s.changePercent), 2)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {loading && <p style={{ margin: "24px 0", color: colors.goldBright, animation: "fadeInUp 1s infinite alternate" }}>Мәліметтер ізделуде...</p>}
          {error && <p style={{ margin: "24px 0", color: colors.lossBright }}>{error}</p>}

          {/* ---------- БАСТЫ НӘТИЖЕ КАРТОЧКАСЫ ---------- */}
          {data && (
            <div className="glass-card animate-fade" style={{ width: "100%", padding: "28px", position: "relative", overflow: "hidden", marginBottom: "48px", borderRadius: "24px" }}>
              <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: "rgba(59,130,246,0.15)", filter: "blur(40px)", borderRadius: "50%" }}></div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  {data.logo ? (
                    <img src={data.logo} alt="" style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.05)" }} />
                  ) : (
                    <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(59,130,246,0.2)", color: colors.goldBright, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "1.2rem" }}>
                      {data.symbol?.slice(0,2)}
                    </div>
                  )}
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "800", letterSpacing: "1px" }}>{data.symbol}</h2>
                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: colors.textMuted }}>{data.name}</p>
                  </div>
                </div>
                {session?.user && (
                  <button onClick={() => toggleWatchlist(data.symbol)} style={{ background: "transparent", border: "none", fontSize: "2rem", cursor: "pointer", color: watchlistSymbols.includes(data.symbol) ? "#f59e0b" : colors.textFaint, transition: "transform 0.2s" }}>
                    {watchlistSymbols.includes(data.symbol) ? "★" : "☆"}
                  </button>
                )}
              </div>

              {/* Баға конвертациясы */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "14px", fontFamily: fontMono, marginBottom: "30px", position: "relative", zIndex: 2 }}>
                <span style={{ fontSize: "2.8rem", fontWeight: "800", letterSpacing: "-1px" }}>{fmtCurr(data.currentPrice, currency, usdkzt)}</span>
                <span style={{ fontSize: "1rem", fontWeight: "700", color: isUp ? colors.gain : colors.loss }}>
                  {isUp ? "▲" : "▼"}{fmtCurr(Math.abs(data.change), currency, usdkzt)} ({safeNum(data.changePercent, 2)}%)
                </span>
              </div>

              <SentimentMeter score={currentSentimentScore} />

              {/* ProChart-қа конверттелген график мәндері беріледі */}
              {Array.isArray(data.chartData) && data.chartData.length > 1 ? (
                <div style={{ marginBottom: "30px", height: "180px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: `1px solid ${colors.cardBorder}`, overflow: "hidden" }}>
                  <ProChart chartData={convertedChartData} pivot={convertedPivot} tradePlan={convertedTradePlan} colors={colors} />
                </div>
              ) : hasHistory && (
                <div style={{ marginBottom: "30px", height: "90px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: `1px solid ${colors.cardBorder}`, position: "relative", overflow: "hidden" }}>
                  <Sparkline history={data.history} isUp={isUp} />
                </div>
              )}

              {/* OHLC конвертациясы */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "16px", border: `1px solid ${colors.cardBorder}`, marginBottom: "30px", fontSize: "0.85rem", color: colors.textMuted, fontFamily: fontMono }}>
                <div>Open: <span style={{ color: colors.textPrimary, fontWeight: "600" }}>{fmtCurr(data.open, currency, usdkzt)}</span></div>
                <div>Prev Close: <span style={{ color: colors.textPrimary, fontWeight: "600" }}>{fmtCurr(data.previousClose, currency, usdkzt)}</span></div>
                <div>High: <span style={{ color: colors.textPrimary, fontWeight: "600" }}>{fmtCurr(data.high, currency, usdkzt)}</span></div>
                <div>Low: <span style={{ color: colors.textPrimary, fontWeight: "600" }}>{fmtCurr(data.low, currency, usdkzt)}</span></div>
              </div>

              {hasFundamentals && (
                <div style={{ marginBottom: "30px" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: "bold", color: colors.textFaint, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px", marginTop: 0 }}>Ақылды Фундаменталды Анализ</h4>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px", textAlign: "center" }}>
                    <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.65rem", color: colors.textFaint, textTransform: "uppercase" }}>Нарық құны</div>
                      <div style={{ color: colors.textPrimary, fontWeight: "600", fontSize: "0.9rem", marginTop: "6px" }}>{fmtMarketCap(data.marketCap, currency, usdkzt)}</div>
                    </div>
                    <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.65rem", color: colors.textFaint, textTransform: "uppercase" }}>EPS (Пайда)</div>
                      <div style={{ color: colors.textPrimary, fontWeight: "600", fontSize: "0.9rem", marginTop: "6px" }}>{fmtCurr(data.fundamentals.eps, currency, usdkzt)}</div>
                    </div>
                    <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.65rem", color: colors.textFaint, textTransform: "uppercase" }}>Дивиденд</div>
                      <div style={{ color: colors.textPrimary, fontWeight: "600", fontSize: "0.9rem", marginTop: "6px" }}>{data.fundamentals.dividendYield ? safeNum(data.fundamentals.dividendYield, 2) + "%" : "—"}</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "16px", border: `1px solid ${colors.cardBorder}`, fontFamily: fontMono }}>
                    {renderSmartFundItem("P/E (Баға/Табыс)", data.fundamentals.peRatio, "PE")}
                    {renderSmartFundItem("Қарыз / Капитал (D/E)", data.fundamentals.debtToEquity, "DE")}
                    {renderSmartFundItem("Ағымдағы өтімділік", data.fundamentals.currentRatio, "CR")}
                    {renderSmartFundItem("ROE (Тиімділік)", data.fundamentals.roe, "ROE")}
                    {renderSmartFundItem("Таза маржа (Пайда)", data.fundamentals.profitMargin, "PM")}
                    {renderSmartFundItem("P/B (Баға/Мүлік құны)", data.fundamentals.pbRatio, "PB")}
                  </div>
                </div>
              )}

              {/* Сауда жоспарының конвертациясы */}
              {data.tradePlan && (
                <div style={{ marginBottom: "30px", padding: "20px", borderRadius: "16px", border: "1px solid rgba(59,130,246,0.4)", background: "rgba(59,130,246,0.06)" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: colors.goldBright, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors.gold, boxShadow: "0 0 8px #3b82f6" }}></span>
                    Сауда жоспары
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "0.9rem", fontFamily: fontMono }}>
                    <div>Entry: <span style={{ color: colors.textPrimary, fontWeight: "bold" }}>{fmtCurr(data.tradePlan.entry, currency, usdkzt)}</span></div>
                    <div>Stop Loss: <span style={{ color: colors.lossBright, fontWeight: "bold" }}>{fmtCurr(data.tradePlan.stopLoss, currency, usdkzt)}</span></div>
                    <div>TP 1: <span style={{ color: colors.gainBright, fontWeight: "bold" }}>{fmtCurr(data.tradePlan.takeProfit1, currency, usdkzt)}</span></div>
                    <div>TP 2: <span style={{ color: colors.gainBright, fontWeight: "bold" }}>{fmtCurr(data.tradePlan.takeProfit2, currency, usdkzt)}</span></div>
                  </div>
                </div>
              )}

              {hasTechnicals && (
                <div style={{ marginBottom: "30px" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: "bold", color: colors.textFaint, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px", marginTop: 0 }}>Техникалық анализ</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.85rem", fontFamily: fontMono, color: colors.textMuted }}>
                    <div>RSI (14): <span style={{ fontWeight: "700", color: data.technicals.rsi > 70 ? colors.lossBright : data.technicals.rsi < 30 ? colors.gainBright : colors.textPrimary }}>{safeNum(data.technicals.rsi, 2)}</span></div>
                    <div>MACD: <span style={{ fontWeight: "700", color: data.technicals.macd > 0 ? colors.gainBright : colors.lossBright }}>{safeNum(data.technicals.macd, 2)}</span></div>
                    <div>SMA20: <span style={{ fontWeight: "600", color: colors.textPrimary }}>{fmtCurr(data.technicals.sma20, currency, usdkzt)}</span></div>
                    <div>SMA50: <span style={{ fontWeight: "600", color: colors.textPrimary }}>{fmtCurr(data.technicals.sma50, currency, usdkzt)}</span></div>
                  </div>
                  
                  {signal && (
                    <div style={{ marginTop: "20px", padding: "16px", borderRadius: "14px", border: `1px solid rgba(255,255,255,0.1)`, background: "rgba(255,255,255,0.04)" }}>
                      <div style={{ fontSize: "0.95rem", fontWeight: "bold", fontFamily: fontMono, marginBottom: "10px", color: signal.level === 'bullish' ? colors.gainBright : signal.level === 'bearish' ? colors.lossBright : colors.hold }}>
                        Сигнал: {signal.label}
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.8rem", color: colors.textMuted, lineHeight: "1.6" }}>
                        {signal.reasons.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <button onClick={getAiSummary} disabled={aiLoading} className="tradeiq-search-btn" style={{ width: "100%", padding: "16px", borderRadius: "16px", border: `1px solid rgba(59,130,246,0.6)`, background: "rgba(59,130,246,0.08)", color: colors.goldBright, fontWeight: "bold", fontSize: "0.95rem", cursor: aiLoading ? "default" : "pointer", boxShadow: "0 0 20px rgba(59,130,246,0.15)", marginTop: "8px" }}>
                {aiLoading ? "Талдау жасалуда..." : "✨ AI қорытынды алу"}
              </button>
              
              {aiSummary && (
                <div style={{ marginTop: "20px", padding: "20px", borderRadius: "16px", background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.cardBorder}`, fontSize: "0.9rem", color: "#e2e8f0", lineHeight: "1.6" }}>
                  {aiSummary}
                </div>
              )}

              <HalalCard halal={data.halal} />
            </div>
          )}

          <div className="animate-fade" style={{ width: "100%", marginBottom: "40px" }}>
            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: colors.textPrimary }}>Нарық жаңалықтары</h3>
                <a href="/news" style={{ fontSize: "0.85rem", color: colors.goldBright, textDecoration: "none", fontWeight: "600" }}>Барлығы →</a>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {homeNewsLoading ? (
                  <div style={{ fontSize: "0.85rem", color: colors.textFaint }}>Жүктелуде...</div>
                ) : (
                  homeNews.map((item, i) => {
                    const isBullishNews = i % 2 === 0;
                    const aiNewsTag = isBullishNews ? "🟩 Bullish" : "🟥 Bearish";
                    const aiNewsColor = isBullishNews ? colors.gainBright : colors.lossBright;

                    return (
                      <a key={i} href={item.url} target="_blank" rel="noreferrer" className="tradeiq-news-item" style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "12px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                        <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.cardBorder}`, flexShrink: 0 }}></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.9rem", color: "#e2e8f0", lineHeight: "1.4", marginBottom: "8px", fontWeight: "500" }}>
                            {item.headline}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: "0.75rem", color: colors.textFaint, fontFamily: fontMono }}>
                              {item.source} · {formatNewsDate(item.datetime)}
                            </div>
                            <div style={{ fontSize: "0.65rem", fontWeight: "bold", color: aiNewsColor, background: "rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: "6px" }}>
                              {aiNewsTag}
                            </div>
                          </div>
                        </div>
                      </a>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <p style={{ margin: "20px 0 40px", textAlign: "center", color: colors.textFaint, fontSize: "0.75rem", letterSpacing: "1px" }}>© TradeIQ — ДАЛА РУХЫМЕН САУДА</p>
        </div>
      </div>
    </main>
  );
}
