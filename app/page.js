"use client";

import { useState, useEffect, useRef } from "react";
import NavMenu from "./NavMenu";
import Header from "./Header";
import ProChart from "./ProChart";
import FloatingChat from "./FloatingChat";
import { supabase } from "./supabaseClient";

/* ---------- Дизайн токендары ---------- */
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

const globalCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
html, body { background-color: ${colors.bg}; color: ${colors.textPrimary}; font-family: ${fontBody}; margin: 0; padding: 0; overflow-x: hidden; }
* { box-sizing: border-box; }
.glass-card { background: ${colors.card}; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid ${colors.cardBorder}; border-radius: 20px; }
.tradeiq-search-capsule { transition: border-color 0.3s ease, box-shadow 0.3s ease; }
.tradeiq-search-capsule:focus-within { border-color: rgba(59,130,246,0.6) !important; box-shadow: 0 0 20px rgba(59,130,246,0.15); }
.tradeiq-search-btn { transition: all 0.2s ease; }
.tradeiq-search-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
.tradeiq-search-btn:active { transform: scale(0.97); }
.tradeiq-overview-card { transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
.tradeiq-overview-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.2) !important; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
.glow-bg { position: absolute; width: 400px; height: 400px; background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(0,0,0,0) 70%); border-radius: 50%; z-index: -1; pointer-events: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade { animation: fadeInUp 0.5s ease-out; }
.tradeiq-content-shell { margin-left: 0; }
@media (min-width: 1024px) { .tradeiq-content-shell { margin-left: 240px; } }
.audio-bar { width: 4px; background-color: ${colors.goldBright}; border-radius: 2px; animation-name: sound; animation-iteration-count: infinite; animation-direction: alternate; }
.bar1 { animation-duration: 0.4s; height: 10px; }
.bar2 { animation-duration: 0.2s; height: 18px; }
.bar3 { animation-duration: 0.6s; height: 8px; }
.bar4 { animation-duration: 0.3s; height: 22px; }
.bar5 { animation-duration: 0.5s; height: 12px; }
@keyframes sound { 0% { height: 4px; opacity: 0.5; } 100% { height: 24px; opacity: 1; box-shadow: 0 0 10px ${colors.goldBright}; } }
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
  const width = 300; const height = 60; const padY = 2;
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
    <div className="animate-fade" style={{ marginBottom: "20px", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: colors.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: colors.goldBright }}>🧠</span> AI Нарық көңіл-күйі
        </div>
        <div style={{ fontSize: "0.85rem", fontWeight: "700", color: color }}>{text} ({score}%)</div>
      </div>
      <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "100%", background: `linear-gradient(90deg, ${colors.lossBright} 0%, ${colors.hold} 50%, ${colors.gainBright} 100%)`, borderRadius: "4px", opacity: 0.8 }} />
        <div style={{ position: "absolute", left: `calc(${score}% - 4px)`, top: "-3px", width: "8px", height: "14px", background: "#fff", borderRadius: "4px", boxShadow: "0 0 8px rgba(0,0,0,0.8)", transition: "left 1s ease" }} />
      </div>
    </div>
  );
}

function AiPsychologist({ data }) {
  if (!data || !data.technicals) return null;
  const rsi = data.technicals.rsi || 50;
  const change = data.changePercent || 0;
  let message, type, icon;

  if (change <= -2 || rsi < 35) {
     type = "panic"; icon = "🧘‍♂️";
     message = `${data.symbol} құлап жатыр. Эмоциямен (дүрбелеңмен) минусқа сатуға асықпаңыз. Бұл нарықтағы уақытша түзету болуы мүмкін, салқынқанды шешім қабылдаңыз.`;
  } else if (change >= 4 || rsi > 70) {
     type = "fomo"; icon = "🔥";
     message = `${data.symbol} күрт өсіп жатыр! "Құр қалам" (FOMO) деген қорқынышпен дәл қазір ең жоғарғы бағада сатып алудан сақ болыңыз. Нарық сабырлыларды жақсы көреді.`;
  } else {
     type = "calm"; icon = "⚖️";
     message = `Нарық қалыпты күйде. Инвестициялық шешім қабылдамас бұрын төмендегі AI талдауы мен фундаменталды сандарды мұқият оқып шығыңыз.`;
  }
  
  const bg = type === 'panic' ? 'rgba(139, 92, 246, 0.1)' : type === 'fomo' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)';
  const border = type === 'panic' ? 'rgba(139, 92, 246, 0.3)' : type === 'fomo' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)';
  const textColor = type === 'panic' ? '#a78bfa' : type === 'fomo' ? '#fbbf24' : '#60a5fa';

  return (
    <div className="animate-fade" style={{ marginBottom: "24px", padding: "16px", borderRadius: "16px", background: bg, border: `1px solid ${border}`, display: "flex", gap: "14px", alignItems: "flex-start" }}>
       <div style={{ fontSize: "2rem", filter: `drop-shadow(0 0 10px ${textColor})` }}>{icon}</div>
       <div>
          <h4 style={{ margin: "0 0 6px 0", color: textColor, fontSize: "0.95rem", fontWeight: "bold" }}>Трейдер психологы</h4>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#e2e8f0", lineHeight: "1.5" }}>{message}</p>
       </div>
    </div>
  );
}

function HalalCard({ halal, currentPrice, currency, usdkzt }) {
  const [shares, setShares] = useState("");
  if (!halal || typeof halal !== "object" || !Array.isArray(halal.checks)) return null;
  const toneOf = (s) => s === "pass" ? colors.gain : s === "fail" ? colors.loss : s === "doubtful" ? colors.hold : colors.textFaint;
  const markOf = (s) => s === "pass" ? "✓" : s === "fail" ? "✕" : s === "doubtful" ? "⚠" : "?";
  const tone = toneOf(halal.status);

  let purificationRate = 0;
  const nonCompliant = halal.checks.find(c => c.key === "nonCompliantIncome");
  if (nonCompliant && nonCompliant.display) {
      const val = parseFloat(nonCompliant.display.replace('%', ''));
      if (!isNaN(val) && val > 0) purificationRate = val;
  }

  const numShares = parseFloat(shares);
  let totalValue = 0, zakatAmount = 0;
  if (!isNaN(numShares) && numShares > 0 && currentPrice) {
      totalValue = numShares * currentPrice * (currency === "KZT" ? usdkzt : 1);
      zakatAmount = totalValue * 0.025;
  }

  return (
    <div className="animate-fade" style={{ marginTop: "24px", paddingTop: "20px", borderTop: `1px solid ${colors.cardBorder}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: colors.gold, textTransform: "uppercase" }}>🕌 Халал Инвестиция</div>
        <div style={{ fontSize: "0.75rem", fontWeight: "700", color: tone, border: `1px solid ${tone}`, padding: "4px 12px", borderRadius: "999px" }}>{halal.label}</div>
      </div>
      <div style={{ fontSize: "0.8rem", color: colors.textMuted, marginBottom: "20px" }}>{halal.summary}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
        {halal.checks.map((c) => (
          <div key={c.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", fontSize: "0.85rem", paddingBottom: "8px", borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
            <div style={{ color: colors.textPrimary }}>{c.label}{c.note && <div style={{ fontSize: "0.7rem", color: colors.textFaint, marginTop: "4px" }}>{c.note}</div>}</div>
            <div style={{ fontFamily: fontMono, fontWeight: "700", color: toneOf(c.status) }}>{c.display ? c.display + " " : ""}{markOf(c.status)}</div>
          </div>
        ))}
      </div>
      {halal.status === "pass" && (
        <div style={{ background: "rgba(16,185,129,0.05)", border: `1px solid rgba(16,185,129,0.2)`, borderRadius: "16px", padding: "20px" }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: colors.gainBright, textTransform: "uppercase" }}>Зекет және Тазарту</h4>
            {purificationRate > 0 && <div style={{ fontSize: "0.8rem", color: colors.textMuted, marginBottom: "16px" }}>Дивидендтің <strong style={{ color: colors.lossBright }}>{purificationRate}%</strong> тазарту ұсынылады.</div>}
            <input type="number" value={shares} onChange={e => setShares(e.target.value)} placeholder="Акция саны..." style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", marginBottom: "10px" }} />
            {totalValue > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "10px" }}>
                    <div><span style={{ fontSize: "0.65rem", color: colors.textFaint }}>Құны</span><div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>{currency === "KZT" ? "₸" + totalValue.toLocaleString() : "$" + totalValue.toFixed(2)}</div></div>
                    <div style={{ textAlign: "right" }}><span style={{ fontSize: "0.65rem", color: colors.gainBright }}>Зекет (2.5%)</span><div style={{ fontSize: "1rem", fontWeight: "bold", color: colors.gainBright }}>{currency === "KZT" ? "₸" + zakatAmount.toLocaleString() : "$" + zakatAmount.toFixed(2)}</div></div>
                </div>
            )}
        </div>
      )}
    </div>
  );
}

function AiRadioPlayer({ stockData, isUp }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  const togglePlay = () => {
    if (!synth) return;
    if (isPlaying) { synth.cancel(); setIsPlaying(false); } 
    else {
      let textToRead = "Қайырлы күн! Бұл TradeIQ AI нарық шолуы. ";
      if (stockData) {
        textToRead += `${stockData.symbol} акциясының қазіргі бағасы ${stockData.currentPrice} доллар. `;
        textToRead += isUp ? "Бүгін акция құны өсіп жатыр. " : "Бүгін акция құны төмендеуде. ";
        if (stockData.halal && stockData.halal.status === "pass") textToRead += "Бұл компания халал стандарттарына толық сай келеді. ";
        textToRead += "Сәтті сауда тілейміз!";
      } else {
        textToRead += "Нарықтағы соңғы жаңалықтарды білу үшін жоғарыдағы іздеу жолағына акция тикерін жазыңыз.";
      }
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = "kk-KZ";
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      synth.speak(utterance);
      setIsPlaying(true);
    }
  };
  useEffect(() => { return () => { if (synth && isPlaying) synth.cancel(); }; }, [synth, isPlaying]);

  return (
    <div className="glass-card animate-fade" style={{ marginBottom: "40px", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid rgba(59,130,246,0.5)`, background: "linear-gradient(90deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)", boxShadow: "0 10px 30px rgba(59,130,246,0.15)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button onClick={togglePlay} style={{ width: "48px", height: "48px", borderRadius: "50%", background: isPlaying ? "rgba(239,68,68,0.2)" : colors.gold, border: isPlaying ? `1px solid ${colors.lossBright}` : "none", color: isPlaying ? colors.lossBright : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.3s" }}>
          {isPlaying ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "3px" }}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>}
        </button>
        <div>
          <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>TradeIQ Подкаст <span style={{ fontSize: "0.6rem", background: colors.lossBright, color: "#fff", padding: "2px 6px", borderRadius: "4px" }}>LIVE</span></h4>
          <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: colors.textMuted }}>Күндік нарық шолуы</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", height: "24px", width: "40px" }}>
        {isPlaying ? <><div className="audio-bar bar1"></div><div className="audio-bar bar2"></div><div className="audio-bar bar3"></div><div className="audio-bar bar4"></div><div className="audio-bar bar5"></div></> : <div style={{ fontSize: "1.2rem", opacity: 0.5 }}>🎙️</div>}
      </div>
    </div>
  );
}

function safeNum(v, digits) { return (typeof v !== "number" || isNaN(v)) ? "—" : v.toFixed(digits); }
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
function fmtCurr(val, curr, rate) {
  if (typeof val !== "number" || isNaN(val)) return "—";
  if (curr === "KZT") return "₸" + (val * rate).toLocaleString("kk-KZ", { maximumFractionDigits: 0 });
  return "$" + val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtMarketCap(valInM, curr, rate) {
  if (typeof valInM !== "number" || isNaN(valInM)) return "—";
  const v = valInM * 1000000;
  if (curr === "KZT") return (v * rate / 1000000000).toFixed(1) + "B ₸";
  return "$" + (v / 1000000000).toFixed(1) + "B";
}

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const [overview, setOverview] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [watchlistSymbols, setWatchlistSymbols] = useState([]);
  
  const [currency, setCurrency] = useState("USD");
  const [usdkzt, setUsdkzt] = useState(500);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD").then(r => r.json()).then(d => { if (d?.rates?.KZT) setUsdkzt(d.rates.KZT); }).catch(()=>{});
    supabase.auth.getSession().then(({ data }) => setSession(data?.session));
  }, []);

  useEffect(() => {
    async function loadWatchlist() {
      if (!session?.user) { setWatchlistSymbols([]); return; }
      const { data: rows } = await supabase.from("watchlist").select("symbol");
      if (rows) setWatchlistSymbols(rows.map((r) => r.symbol));
    }
    loadWatchlist();
  }, [session]);

  async function toggleWatchlist(symbol) {
    if (!session?.user || !symbol) return;
    if (watchlistSymbols.includes(symbol)) {
      await supabase.from("watchlist").delete().eq("user_id", session.user.id).eq("symbol", symbol);
      setWatchlistSymbols(prev => prev.filter(s => s !== symbol));
    } else {
      await supabase.from("watchlist").insert({ user_id: session.user.id, symbol });
      setWatchlistSymbols(prev => [...prev, symbol]);
    }
  }

  const OVERVIEW_SYMBOLS = [{ symbol: "QQQ", label: "NASDAQ" }, { symbol: "SPY", label: "S&P 500" }];
  useEffect(() => {
    setOverviewLoading(true);
    Promise.all(OVERVIEW_SYMBOLS.map(async (item) => {
      try {
        const res = await fetch(`/api/stock?symbol=${item.symbol}`);
        return { ...item, ...(await res.json()) };
      } catch { return { ...item, error: true }; }
    })).then(res => { setOverview(res); setOverviewLoading(false); });
  }, []);

  function loadFromOverview(symbol) { setTicker(symbol); searchStock(null, symbol); }

  async function getAiSummary(stockData) {
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(stockData) });
      const json = await res.json();
      if (res.ok && json.summary) setSummary(json.summary);
    } catch(err) {}
    setSummaryLoading(false);
  }

  async function searchStock(e, sym) {
    e?.preventDefault();
    const symbol = (sym || ticker).trim().toUpperCase();
    if (!symbol) return;
    setLoading(true); setError(""); setData(null); setSummary("");
    try {
      const res = await fetch(`/api/stock?symbol=${symbol}`);
      const json = await res.json();
      if (!res.ok) setError(json.error || "Қате"); 
      else { setData(json); getAiSummary(json); }
    } catch { setError("Байланыс қатесі"); } finally { setLoading(false); }
  }

  async function sendChatMessage(e) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    const newMessages = [...chatMessages, { role: "user", text }];
    setChatMessages(newMessages); setChatInput(""); setChatLoading(true); setChatError("");
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: newMessages, stockContext: data }) });
      const json = await res.json();
      if (!res.ok || json.error) setChatError(json.error || "Қате шықты");
      else setChatMessages([...newMessages, { role: "assistant", text: json.reply }]);
    } catch { setChatError("Желі қатесі"); } finally { setChatLoading(false); }
  }

  const isUp = data?.change >= 0;
  let currentSentimentScore = 50;
  if (data) {
    if (data.technicals?.rsi) currentSentimentScore = Math.min(100, Math.max(0, Math.round(data.technicals.rsi)));
    else if (data.changePercent) currentSentimentScore = data.changePercent > 0 ? 65 : 35;
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
          {displayValue !== "—" && <span style={{ fontSize: "0.75rem", fontWeight: "600", color: evalData.color, background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "6px" }}>{evalData.text}</span>}
        </div>
      </div>
    );
  };

  return (
    <main style={{ minHeight: "100vh", position: "relative", paddingBottom: "140px" }}>
      <style>{globalCss}</style>
      <div className="glow-bg" style={{ top: "-50px", left: "-50px" }}></div>
      <NavMenu />

      <div className="tradeiq-content-shell" style={{ maxWidth: "500px", margin: "0 auto", padding: "0 16px", zIndex: 10 }}>
        
        {/* Жоғарғы Header */}
        <Header overview={overview} />

        <div style={{ paddingTop: "24px" }}>
          
          <div className="animate-fade" style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "30px" }}>
            <TradeIQMark size={40} />
            <h2 style={{ fontSize: "2.4rem", margin: 0, fontWeight: "800" }}>Trade<span style={{ color: colors.gold }}>IQ</span></h2>
          </div>

          <form onSubmit={searchStock} className="tradeiq-search-capsule animate-fade" style={{ display: "flex", background: "rgba(30,41,59,0.4)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.08)", padding: "6px", marginBottom: "30px" }}>
            <input value={ticker} onChange={e => setTicker(e.target.value)} placeholder="Тикер жазыңыз (мыс. AAPL)" style={{ flex: 1, padding: "0 16px", background: "transparent", border: "none", color: "#fff", outline: "none", fontSize: "1rem" }} />
            <button type="submit" className="tradeiq-search-btn" style={{ padding: "0 24px", height: "46px", borderRadius: "18px", background: colors.gold, border: "none", color: "#fff", fontWeight: "600", cursor: "pointer" }}>Іздеу</button>
          </form>

          {/* ПОДКАСТ (ҚАЙТАРЫЛДЫ) */}
          <AiRadioPlayer stockData={data} isUp={isUp} />

          {/* НАРЫҚ ШОЛУЫ (QQQ, SPY) (ҚАЙТАРЫЛДЫ) */}
          <div className="animate-fade" style={{ width: "100%", marginBottom: "48px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0 }}>Нарық шолуы</h3>
              <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "4px", border: `1px solid ${colors.cardBorder}` }}>
                <button onClick={() => setCurrency("USD")} style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: currency === "USD" ? colors.gold : "transparent", color: currency === "USD" ? "#fff" : colors.textMuted, fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}>USD</button>
                <button onClick={() => setCurrency("KZT")} style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: currency === "KZT" ? colors.gain : "transparent", color: currency === "KZT" ? "#fff" : colors.textMuted, fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}>KZT</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {overviewLoading ? (
                 <div style={{ color: colors.textMuted, padding: "20px" }}>Жүктелуде...</div>
              ) : (
                overview.map((item) => {
                  const up = item.change >= 0;
                  return (
                    <button key={item.symbol} onClick={() => loadFromOverview(item.symbol)} className="glass-card tradeiq-overview-card" style={{ textAlign: "left", padding: "20px", cursor: "pointer", position: "relative", overflow: "hidden", minHeight: "145px", display: "flex", flexDirection: "column" }}>
                      <div style={{ position: "relative", zIndex: 2, width: "100%" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ background: up ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)", color: up ? colors.gainBright : colors.goldBright, fontSize: "0.7rem", fontWeight: "bold", padding: "4px 8px", borderRadius: "6px" }}>{item.symbol}</span>
                          <span style={{ color: colors.textMuted, fontSize: "0.95rem", fontWeight: "600" }}>{item.label}</span>
                        </div>
                        {!item.error && (
                          <div style={{ marginTop: "24px" }}>
                            <div style={{ color: colors.textPrimary, fontSize: "1.6rem", fontWeight: "800", fontFamily: fontMono }}>{fmtCurr(item.currentPrice, currency, usdkzt)}</div>
                            <div style={{ color: up ? colors.gain : colors.loss, fontSize: "0.9rem", marginTop: "6px", fontFamily: fontMono, fontWeight: "600" }}>{up ? "▲" : "▼"} {safeNum(item.changePercent, 2)}%</div>
                          </div>
                        )}
                      </div>
                      {!item.error && item.history?.length > 1 && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "60px", zIndex: 1, opacity: 0.6 }}><Sparkline history={item.history} isUp={up} /></div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {loading && <p style={{ color: colors.goldBright, textAlign: "center" }}>Мәліметтер ізделуде...</p>}
          {error && <p style={{ color: colors.lossBright, textAlign: "center" }}>{error}</p>}

          {data && (
            <div className="glass-card animate-fade" style={{ padding: "28px", marginBottom: "40px", borderRadius: "24px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: "rgba(59,130,246,0.15)", filter: "blur(40px)", borderRadius: "50%" }}></div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  {data.logo ? <img src={data.logo} alt="" style={{ width: "48px", height: "48px", borderRadius: "14px" }} /> : <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(59,130,246,0.2)", color: colors.goldBright, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "1.2rem" }}>{data.symbol?.slice(0,2)}</div>}
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "800" }}>{data.symbol}</h2>
                    <p style={{ margin: "4px 0 0", color: colors.textMuted, fontSize: "0.85rem" }}>{data.name}</p>
                  </div>
                </div>
                {session?.user && (
                  <button onClick={() => toggleWatchlist(data.symbol)} style={{ background: "transparent", border: "none", fontSize: "2rem", cursor: "pointer", color: watchlistSymbols.includes(data.symbol) ? "#f59e0b" : colors.textFaint }}>
                    {watchlistSymbols.includes(data.symbol) ? "★" : "☆"}
                  </button>
                )}
              </div>

              <div style={{ fontSize: "2.8rem", fontWeight: "800", fontFamily: fontMono, marginBottom: "20px", position: "relative", zIndex: 2 }}>
                {fmtCurr(data.currentPrice, currency, usdkzt)}
                <span style={{ fontSize: "1rem", color: isUp ? colors.gain : colors.loss, marginLeft: "12px" }}>{isUp ? "▲" : "▼"}{fmtCurr(Math.abs(data.change), currency, usdkzt)} ({safeNum(data.changePercent, 2)}%)</span>
              </div>

              {/* ПСИХОЛОГ */}
              <AiPsychologist data={data} />

              {/* СЕНТИМЕНТ МЕТР (ҚАЙТАРЫЛДЫ) */}
              <SentimentMeter score={currentSentimentScore} />

              {/* ЧАРТ */}
              {Array.isArray(data.chartData) && data.chartData.length > 1 ? (
                <div style={{ height: "180px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", marginBottom: "30px", overflow: "hidden", border: `1px solid ${colors.cardBorder}` }}>
                  <ProChart chartData={data.chartData.map(d => ({ ...d, open: d.open*(currency==="KZT"?usdkzt:1), high: d.high*(currency==="KZT"?usdkzt:1), low: d.low*(currency==="KZT"?usdkzt:1), close: d.close*(currency==="KZT"?usdkzt:1), ema20: d.ema20*(currency==="KZT"?usdkzt:1), ema50: d.ema50*(currency==="KZT"?usdkzt:1) }))} />
                </div>
              ) : data.history?.length > 1 && (
                <div style={{ height: "90px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", marginBottom: "30px", overflow: "hidden", border: `1px solid ${colors.cardBorder}` }}>
                  <Sparkline history={data.history} isUp={isUp} />
                </div>
              )}

              {/* OHLC Бағалары */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "16px", border: `1px solid ${colors.cardBorder}`, marginBottom: "30px", fontSize: "0.85rem", color: colors.textMuted, fontFamily: fontMono }}>
                <div>Open: <span style={{ color: "#fff", fontWeight: "600" }}>{fmtCurr(data.open, currency, usdkzt)}</span></div>
                <div>Prev Close: <span style={{ color: "#fff", fontWeight: "600" }}>{fmtCurr(data.previousClose, currency, usdkzt)}</span></div>
                <div>High: <span style={{ color: "#fff", fontWeight: "600" }}>{fmtCurr(data.high, currency, usdkzt)}</span></div>
                <div>Low: <span style={{ color: "#fff", fontWeight: "600" }}>{fmtCurr(data.low, currency, usdkzt)}</span></div>
              </div>

              {/* ФУНДАМЕНТАЛДЫ САРАПТАМА (6 КӨРСЕТКІШПЕН) */}
              {data.fundamentals && (
                <div style={{ marginBottom: "30px" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: "bold", color: colors.textFaint, textTransform: "uppercase", marginBottom: "16px" }}>Ақылды Фундаменталды Анализ</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px", textAlign: "center" }}>
                    <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.65rem", color: colors.textFaint, textTransform: "uppercase" }}>Нарық құны</div>
                      <div style={{ color: "#fff", fontWeight: "600", fontSize: "0.9rem", marginTop: "6px" }}>{fmtMarketCap(data.marketCap, currency, usdkzt)}</div>
                    </div>
                    <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.65rem", color: colors.textFaint, textTransform: "uppercase" }}>EPS</div>
                      <div style={{ color: "#fff", fontWeight: "600", fontSize: "0.9rem", marginTop: "6px" }}>{fmtCurr(data.fundamentals.eps, currency, usdkzt)}</div>
                    </div>
                    <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.65rem", color: colors.textFaint, textTransform: "uppercase" }}>Дивиденд</div>
                      <div style={{ color: "#fff", fontWeight: "600", fontSize: "0.9rem", marginTop: "6px" }}>{data.fundamentals.dividendYield ? safeNum(data.fundamentals.dividendYield, 2) + "%" : "—"}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "16px", border: `1px solid ${colors.cardBorder}`, fontFamily: fontMono }}>
                    {renderSmartFundItem("P/E (Баға/Табыс)", data.fundamentals.peRatio, "PE")}
                    {renderSmartFundItem("Қарыз / Капитал", data.fundamentals.debtToEquity, "DE")}
                    {renderSmartFundItem("Өтімділік (Current)", data.fundamentals.currentRatio, "CR")}
                    {renderSmartFundItem("ROE (Тиімділік)", data.fundamentals.roe, "ROE")}
                    {renderSmartFundItem("Таза маржа", data.fundamentals.profitMargin, "PM")}
                    {renderSmartFundItem("P/B (Баға/Баланс)", data.fundamentals.pbRatio, "PB")}
                  </div>
                </div>
              )}

              {/* ТЕХНИКАЛЫҚ АНАЛИЗ */}
              {data.technicals?.rsi && (
                <div style={{ marginBottom: "30px" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: "bold", color: colors.textFaint, textTransform: "uppercase", marginBottom: "16px" }}>Техникалық Анализ</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "16px", border: `1px solid ${colors.cardBorder}`, fontFamily: fontMono }}>
                    <div>RSI (Күш): <span style={{ color: data.technicals.rsi > 70 ? colors.lossBright : data.technicals.rsi < 30 ? colors.gainBright : "#fff", fontWeight: "bold" }}>{safeNum(data.technicals.rsi, 2)}</span></div>
                    <div>MACD: <span style={{ color: data.technicals.macd > 0 ? colors.gainBright : colors.lossBright, fontWeight: "bold" }}>{safeNum(data.technicals.macd, 2)}</span></div>
                    <div>SMA 20: <span style={{ color: "#fff", fontWeight: "bold" }}>{fmtCurr(data.technicals.sma20, currency, usdkzt)}</span></div>
                    <div>SMA 50: <span style={{ color: "#fff", fontWeight: "bold" }}>{fmtCurr(data.technicals.sma50, currency, usdkzt)}</span></div>
                  </div>
                </div>
              )}

              {/* AI ТҮСІНДІРМЕ (Толық мәтінді талдау) */}
              <div style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "16px", padding: "20px", marginBottom: "30px" }}>
                <h4 style={{ margin: "0 0 12px 0", color: colors.goldBright, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>✨</span> AI Толық Талдау
                </h4>
                {summaryLoading ? (
                  <div style={{ color: colors.textMuted, fontSize: "0.85rem", animation: "pulse 1.5s infinite" }}>AI мәліметтерді оқып, сараптама жасауда...</div>
                ) : summary ? (
                  <div style={{ color: "#e2e8f0", fontSize: "0.85rem", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{summary}</div>
                ) : null}
              </div>

              {/* СУИНГ ТРЕЙДИНГ ЖОСПАРЫ */}
              {data.tradePlan?.entry && (
                <div style={{ background: "rgba(59,130,246,0.05)", border: `1px solid rgba(59,130,246,0.3)`, borderRadius: "16px", padding: "20px" }}>
                  <h4 style={{ margin: "0 0 16px 0", color: colors.goldBright, textTransform: "uppercase" }}>🎯 Суинг-трейдинг жоспары</h4>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontFamily: fontMono, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}><span style={{ color: colors.textMuted }}>Кіру:</span><span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{fmtCurr(data.tradePlan.entry, currency, usdkzt)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontFamily: fontMono, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}><span style={{ color: colors.textMuted }}>Пайда алу (TP):</span><span style={{ fontWeight: "bold", color: colors.gainBright, fontSize: "1.1rem" }}>{fmtCurr(data.tradePlan.takeProfit1, currency, usdkzt)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fontMono }}><span style={{ color: colors.textMuted }}>Шығынды шектеу (SL):</span><span style={{ fontWeight: "bold", color: colors.lossBright, fontSize: "1.1rem" }}>{fmtCurr(data.tradePlan.stopLoss, currency, usdkzt)}</span></div>
                </div>
              )}

              {/* ХАЛАЛ & ЗЕКЕТ */}
              <HalalCard halal={data.halal} currentPrice={data.currentPrice} currency={currency} usdkzt={usdkzt} />
            </div>
          )}
        </div>
      </div>

      {/* FLOATING CHAT (Қалқымалы Чат - ҚАЙТАРЫЛДЫ) */}
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
