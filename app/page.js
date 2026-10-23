"use client";

import { useState, useEffect, useRef } from "react";
import NavMenu from "./NavMenu";
import Header from "./Header";
import ProChart from "./ProChart";
import { supabase } from "./supabaseClient";
import { getSignal } from "../lib/tradeiq-engine";

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
    <div style={{ marginBottom: "20px", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
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
  if (!data || typeof data.changePercent !== 'number') return null;
  let message = ""; let type = ""; let icon = "🧠";
  if (data.changePercent <= -2) {
     type = "panic"; icon = "🧘‍♂️";
     message = `Сабыр етіңіз! ${data.symbol} бүгін ${Math.abs(data.changePercent).toFixed(2)}%-ға құлап жатыр. Эмоциямен (дүрбелеңмен) минусқа сатуға асықпаңыз. Бұл нарықтағы уақытша түзету (коррекция) болуы мүмкін, әрқашан салқынқанды шешім қабылдаңыз.`;
  } else if (data.changePercent >= 4) {
     type = "fomo"; icon = "🔥";
     message = `${data.symbol} күрт өсіп жатыр! "Құр қалам" (FOMO) деген қорқынышпен дәл қазір ең жоғарғы бағада сатып алудан сақ болыңыз. Нарық әрқашан сабырлыларды жақсы көреді.`;
  } else { return null; }
  
  const bg = type === 'panic' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)';
  const border = type === 'panic' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)';
  const textColor = type === 'panic' ? '#a78bfa' : '#fbbf24';

  return (
    <div className="animate-fade" style={{ marginBottom: "30px", padding: "16px", borderRadius: "16px", background: bg, border: `1px solid ${border}`, display: "flex", gap: "14px", alignItems: "flex-start" }}>
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
  const nonCompliantIncomeCheck = halal.checks.find(c => c.key === "nonCompliantIncome");
  if (nonCompliantIncomeCheck && nonCompliantIncomeCheck.display) {
      const incomeVal = parseFloat(nonCompliantIncomeCheck.display.replace('%', ''));
      if (!isNaN(incomeVal) && incomeVal > 0) { purificationRate = incomeVal; }
  }

  const numShares = parseFloat(shares);
  let totalValue = 0; let zakatAmount = 0;
  if (!isNaN(numShares) && numShares > 0 && currentPrice) {
      const baseValue = numShares * currentPrice;
      totalValue = baseValue * (currency === "KZT" ? usdkzt : 1);
      zakatAmount = totalValue * 0.025;
  }

  return (
    <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: `1px solid ${colors.cardBorder}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
        <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: colors.gold, textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "6px" }}>
           <span>🕌</span> Халал Инвестиция
        </div>
        <div style={{ fontSize: "0.75rem", fontWeight: "700", color: tone, border: `1px solid ${tone}`, backgroundColor: `${tone}15`, borderRadius: "999px", padding: "4px 12px", textAlign: "center" }}>{halal.label}</div>
      </div>
      {halal.summary && <div style={{ fontSize: "0.8rem", color: colors.textMuted, lineHeight: "1.5", marginBottom: "20px" }}>{halal.summary}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
        {halal.checks.map((c) => (
          <div key={c.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", fontSize: "0.85rem", paddingBottom: "8px", borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
            <div style={{ minWidth: 0, color: colors.textPrimary }}>{c.label}{c.note && <div style={{ fontSize: "0.7rem", color: colors.textFaint, marginTop: "4px" }}>{c.note}</div>}</div>
            <div style={{ flexShrink: 0, fontFamily: fontMono, fontWeight: "700", color: toneOf(c.status), textAlign: "right" }}>{c.display ? c.display + " " : ""}{markOf(c.status)}</div>
          </div>
        ))}
      </div>
      {halal.status === "pass" && (
        <div style={{ background: "rgba(16,185,129,0.05)", border: `1px solid rgba(16,185,129,0.2)`, borderRadius: "16px", padding: "20px" }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: colors.gainBright, textTransform: "uppercase", letterSpacing: "1px" }}>Зекет және Тазарту</h4>
            {purificationRate > 0 && (
                <div style={{ marginBottom: "16px", fontSize: "0.8rem", color: colors.textMuted }}>
                    Дивиденд алған жағдайда, оның <strong style={{ color: colors.lossBright }}>{purificationRate}%</strong> мөлшерін қайырымдылыққа жұмсау (тазарту) ұсынылады.
                </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: colors.textFaint, marginBottom: "6px" }}>Сізде қанша акция бар?</label>
                    <input 
                        type="number" value={shares} onChange={(e) => setShares(e.target.value)} placeholder="Мысалы: 10" 
                        style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: `1px solid rgba(255,255,255,0.1)`, padding: "10px", borderRadius: "10px", color: colors.textPrimary, fontFamily: fontMono, outline: "none" }}
                    />
                </div>
                {totalValue > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "10px", marginTop: "4px" }}>
                        <div>
                            <div style={{ fontSize: "0.65rem", color: colors.textFaint, textTransform: "uppercase" }}>Жалпы құны</div>
                            <div style={{ fontSize: "0.9rem", color: colors.textPrimary, fontWeight: "bold", fontFamily: fontMono }}>{fmtCurr(totalValue, currency, 1)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "0.65rem", color: colors.gainBright, textTransform: "uppercase" }}>Төленетін Зекет (2.5%)</div>
                            <div style={{ fontSize: "1rem", color: colors.gainBright, fontWeight: "bold", fontFamily: fontMono }}>{fmtCurr(zakatAmount, currency, 1)}</div>
                        </div>
                    </div>
                )}
            </div>
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
        <button onClick={togglePlay} style={{ width: "48px", height: "48px", borderRadius: "50%", background: isPlaying ? "rgba(239,68,68,0.2)" : colors.gold, border: isPlaying ? `1px solid ${colors.lossBright}` : "none", color: isPlaying ? colors.lossBright : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.3s", boxShadow: isPlaying ? "none" : "0 4px 15px rgba(59,130,246,0.5)" }}>
          {isPlaying ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "3px" }}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>}
        </button>
        <div>
          <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>TradeIQ Подкаст <span style={{ fontSize: "0.6rem", background: colors.lossBright, color: "#fff", padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>LIVE</span></h4>
          <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: colors.textMuted }}>Күндік нарық шолуы</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", height: "24px", width: "40px" }}>
        {isPlaying ? <><div className="audio-bar bar1"></div><div className="audio-bar bar2"></div><div className="audio-bar bar3"></div><div className="audio-bar bar4"></div><div className="audio-bar bar5"></div></> : <div style={{ fontSize: "1.2rem", opacity: 0.5 }}>🎙️</div>}
      </div>
    </div>
  );
}

function safeNum(v, digits) { if (typeof v !== "number" || isNaN(v)) return "—"; return v.toFixed(digits); }
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
  if (curr === "KZT") {
    const kztVal = val * rate;
    return "₸" + kztVal.toLocaleString("kk-KZ", { maximumFractionDigits: 0 });
  }
  return "$" + val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtMarketCap(valInMillions, curr, rate) {
  if (typeof valInMillions !== "number" || isNaN(valInMillions)) return "—";
  const actualValue = valInMillions * 1000000;
  if (curr === "KZT") return (actualValue * rate / 1000000000).toFixed(1) + "B ₸";
  return "$" + (actualValue / 1000000000).toFixed(1) + "B";
}

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [overview, setOverview] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [watchlistSymbols, setWatchlistSymbols] = useState([]);

  const [currency, setCurrency] = useState("USD");
  const [usdkzt, setUsdkzt] = useState(500);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then(res => res.json())
      .then(d => { if (d && d.rates && d.rates.KZT) setUsdkzt(d.rates.KZT); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data ? data.session : null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => { if (listener && listener.subscription) listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadWatchlist() {
      if (!session || !session.user) { setWatchlistSymbols([]); return; }
      const { data: rows } = await supabase.from("watchlist").select("symbol");
      if (!cancelled && rows) setWatchlistSymbols(rows.map((r) => r.symbol));
    }
    loadWatchlist();
    return () => { cancelled = true; };
  }, [session]);

  async function toggleWatchlist(symbol) {
    if (!session || !session.user || !symbol) return;
    const inList = watchlistSymbols.includes(symbol);
    try {
      if (inList) {
        await supabase.from("watchlist").delete().eq("user_id", session.user.id).eq("symbol", symbol);
        setWatchlistSymbols((prev) => prev.filter((s) => s !== symbol));
      } else {
        await supabase.from("watchlist").insert({ user_id: session.user.id, symbol });
        setWatchlistSymbols((prev) => [...prev, symbol]);
      }
    } catch (err) {}
  }

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

  function loadFromOverview(symbol) {
    setTicker(symbol);
    searchStock({ preventDefault: () => {} }, symbol);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const symbolParam = params.get("symbol");
    if (symbolParam) loadFromOverview(symbolParam.toUpperCase());
  }, []);

  async function searchStock(e, symbolOverride) {
    e.preventDefault();
    const raw = symbolOverride || ticker;
    if (!raw || !raw.trim()) return;
    const symbol = raw.trim().toUpperCase();
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch(`/api/stock?symbol=${symbol}`);
      const json = await res.json();
      if (!res.ok) setError((json && json.error) || "Қате шықты"); else setData(json);
    } catch (err) { setError("Байланыс қатесі"); } finally { setLoading(false); }
  }

  const isUp = !!(data && typeof data.change === "number" && data.change >= 0);
  const hasHistory = data && Array.isArray(data.history) && data.history.length > 1;
  const hasFundamentals = data && data.fundamentals && typeof data.fundamentals === "object";

  let currentSentimentScore = 50;
  if (data) {
    if (data.technicals && data.technicals.rsi) currentSentimentScore = Math.min(100, Math.max(0, Math.round(data.technicals.rsi)));
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
          {displayValue !== "—" && (
            <span style={{ fontSize: "0.75rem", fontWeight: "600", color: evalData.color, background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "6px" }}>{evalData.text}</span>
          )}
        </div>
      </div>
    );
  };

  const convertedOverview = overview.map(item => ({
    ...item, currentPrice: item.currentPrice ? item.currentPrice * (currency === "KZT" ? usdkzt : 1) : null
  }));

  const convertedChartData = data?.chartData?.map(d => ({
    ...d, open: d.open * (currency === "KZT" ? usdkzt : 1), high: d.high * (currency === "KZT" ? usdkzt : 1), low: d.low * (currency === "KZT" ? usdkzt : 1), close: d.close * (currency === "KZT" ? usdkzt : 1),
    ema20: d.ema20 ? d.ema20 * (currency === "KZT" ? usdkzt : 1) : null, ema50: d.ema50 ? d.ema50 * (currency === "KZT" ? usdkzt : 1) : null,
  })) || [];

  return (
    <main style={{ minHeight: "100vh", position: "relative", paddingBottom: "140px" }}>
      <style>{globalCss}</style>
      
      <div className="glow-bg" style={{ top: "-50px", left: "-50px" }}></div>
      <div className="glow-bg" style={{ top: "30%", right: "-100px", background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(0,0,0,0) 70%)" }}></div>

      <NavMenu />

      <div className="tradeiq-content-shell" style={{ maxWidth: "500px", margin: "0 auto", padding: "0 16px", position: "relative", zIndex: 10 }}>
        
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

          <form className="animate-fade tradeiq-search-capsule" onSubmit={searchStock} style={{ display: "flex", width: "100%", marginBottom: "30px", background: "rgba(30, 41, 59, 0.4)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: "24px", border: `1px solid rgba(255,255,255,0.08)`, padding: "6px" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 16px" }}>
              <span style={{ fontSize: "1.2rem", color: colors.textFaint, marginRight: "12px" }}>🔍</span>
              <input value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="Тикер жазыңыз (мыс. AAPL)" style={{ width: "100%", background: "transparent", border: "none", color: colors.textPrimary, fontSize: "1rem", fontFamily: fontBody, outline: "none" }} />
            </div>
            <button type="submit" className="tradeiq-search-btn" style={{ padding: "0 28px", height: "46px", borderRadius: "18px", border: "none", background: colors.gold, color: "#fff", fontWeight: "600", fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 4px 15px rgba(59,130,246,0.4)" }}>
              Іздеу
            </button>
          </form>

          <AiRadioPlayer stockData={data} isUp={isUp} />

          <div className="animate-fade" style={{ width: "100%", marginBottom: "48px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0 }}>Нарық шолуы</h3>
              <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "4px", border: `1px solid ${colors.cardBorder}` }}>
                <button onClick={() => setCurrency("USD")} style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: currency === "USD" ? colors.gold : "transparent", color: currency === "USD" ? "#fff" : colors.textMuted, fontSize: "0.75rem", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }}>USD</button>
                <button onClick={() => setCurrency("KZT")} style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: currency === "KZT" ? colors.gain : "transparent", color: currency === "KZT" ? "#fff" : colors.textMuted, fontSize: "0.75rem", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }}>KZT</button>
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
                      <button key={item.symbol} onClick={() => loadFromOverview(item.symbol)} className="glass-card tradeiq-overview-card" style={{ textAlign: "left", padding: "20px", cursor: "pointer", position: "relative", overflow: "hidden", border: item.error ? `1px solid ${colors.cardBorder}` : `1px solid ${glowColor}`, boxShadow: item.error ? "none" : `0 0 20px ${glowColor.replace('0.3','0.05')} inset`, minHeight: "145px", display: "flex", flexDirection: "column" }}>
                        <div style={{ position: "relative", zIndex: 2, width: "100%" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ background: iconBg, color: iconColor, fontSize: "0.7rem", fontWeight: "bold", padding: "4px 8px", borderRadius: "6px" }}>{item.symbol}</span>
                            <span style={{ color: colors.textMuted, fontSize: "0.95rem", fontWeight: "600" }}>{item.label}</span>
                          </div>
                          {item.error ? (
                            <div style={{ color: colors.textFaint, fontSize: "0.85rem", marginTop: "16px" }}>Деректер жоқ</div>
                          ) : (
                            <div style={{ marginTop: "24px" }}>
                              <div style={{ color: colors.textPrimary, fontSize: "1.6rem", fontWeight: "800", fontFamily: fontMono, letterSpacing: "-0.5px" }}>{fmtCurr(item.currentPrice, currency, usdkzt)}</div>
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

          {loading && <p style={{ margin: "24px 0", color: colors.goldBright, animation: "fadeInUp 1s infinite alternate" }}>Мәліметтер ізделуде...</p>}
          {error && <p style={{ margin: "24px 0", color: colors.lossBright }}>{error}</p>}

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

              <div style={{ display: "flex", alignItems: "baseline", gap: "14px", fontFamily: fontMono, marginBottom: "20px", position: "relative", zIndex: 2 }}>
                <span style={{ fontSize: "2.8rem", fontWeight: "800", letterSpacing: "-1px" }}>{fmtCurr(data.currentPrice, currency, usdkzt)}</span>
                <span style={{ fontSize: "1rem", fontWeight: "700", color: isUp ? colors.gain : colors.loss }}>
                  {isUp ? "▲" : "▼"}{fmtCurr(Math.abs(data.change), currency, usdkzt)} ({safeNum(data.changePercent, 2)}%)
                </span>
              </div>

              {/* Трейдер психологы */}
              <AiPsychologist data={data} />

              <SentimentMeter score={currentSentimentScore} />

              {Array.isArray(data.chartData) && data.chartData.length > 1 ? (
                <div style={{ marginBottom: "30px", height: "180px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: `1px solid ${colors.cardBorder}`, overflow: "hidden" }}>
                  <ProChart chartData={convertedChartData} />
                </div>
              ) : hasHistory && (
                <div style={{ marginBottom: "30px", height: "90px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: `1px solid ${colors.cardBorder}`, position: "relative", overflow: "hidden" }}>
                  <Sparkline history={data.history} isUp={isUp} />
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "16px", border: `1px solid ${colors.cardBorder}`, marginBottom: "30px", fontSize: "0.85rem", color: colors.textMuted, fontFamily: fontMono }}>
                <div>Open: <span style={{ color: colors.textPrimary, fontWeight: "600" }}>{fmtCurr(data.open, currency, usdkzt)}</span></div>
                <div>Prev Close: <span style={{ color: colors.textPrimary, fontWeight: "600" }}>{fmtCurr(data.previousClose, currency, usdkzt)}</span></div>
                <div>High: <span style={{ color: colors.textPrimary, fontWeight: "600" }}>{fmtCurr(data.high, currency, usdkzt)}</span></div>
                <div>Low: <span style={{ color: colors.textPrimary, fontWeight: "600" }}>{fmtCurr(data.low, currency, usdkzt)}</span></div>
              </div>

              {/* --- 1. ФУНДАМЕНТАЛДЫ АНАЛИЗ (Толықтырылған) --- */}
              {hasFundamentals && (
                <div style={{ marginBottom: "30px" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: "bold", color: colors.textFaint, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px", marginTop: 0 }}>Ақылды Фундаменталды Анализ</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px", textAlign: "center" }}>
                    <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.65rem", color: colors.textFaint, textTransform: "uppercase" }}>Нарық құны</div>
                      <div style={{ color: colors.textPrimary, fontWeight: "600", fontSize: "0.9rem", marginTop: "6px" }}>{fmtMarketCap(data.marketCap, currency, usdkzt)}</div>
                    </div>
                    <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.65rem", color: colors.textFaint, textTransform: "uppercase" }}>EPS</div>
                      <div style={{ color: colors.textPrimary, fontWeight: "600", fontSize: "0.9rem", marginTop: "6px" }}>{fmtCurr(data.fundamentals.eps, currency, usdkzt)}</div>
                    </div>
                    <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.65rem", color: colors.textFaint, textTransform: "uppercase" }}>Дивиденд</div>
                      <div style={{ color: colors.textPrimary, fontWeight: "600", fontSize: "0.9rem", marginTop: "6px" }}>{data.fundamentals.dividendYield ? safeNum(data.fundamentals.dividendYield, 2) + "%" : "—"}</div>
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

              {/* --- 2. ТЕХНИКАЛЫҚ АНАЛИЗ --- */}
              {data.technicals && typeof data.technicals.rsi === 'number' && (
                <div style={{ marginBottom: "30px" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: "bold", color: colors.textFaint, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>Техникалық Анализ</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "16px", border: `1px solid ${colors.cardBorder}`, fontFamily: fontMono }}>
                    <div>RSI (Күш): <span style={{ color: data.technicals.rsi > 70 ? colors.lossBright : data.technicals.rsi < 30 ? colors.gainBright : colors.textPrimary, fontWeight: "bold" }}>{safeNum(data.technicals.rsi, 2)}</span></div>
                    <div>MACD: <span style={{ color: data.technicals.macd > 0 ? colors.gainBright : colors.lossBright, fontWeight: "bold" }}>{safeNum(data.technicals.macd, 2)}</span></div>
                    <div>SMA 20: <span style={{ color: colors.textPrimary, fontWeight: "bold" }}>{fmtCurr(data.technicals.sma20, currency, usdkzt)}</span></div>
                    <div>SMA 50: <span style={{ color: colors.textPrimary, fontWeight: "bold" }}>{fmtCurr(data.technicals.sma50, currency, usdkzt)}</span></div>
                  </div>
                </div>
              )}

              {/* --- 3. СУИНГ ТРЕЙДИНГ СИГНАЛЫ (САУДА ЖОСПАРЫ) --- */}
              {data.tradePlan && data.tradePlan.entry && (
                <div style={{ marginBottom: "30px", background: "rgba(59,130,246,0.05)", border: `1px solid rgba(59,130,246,0.3)`, borderRadius: "16px", padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "1.5rem" }}>🎯</span>
                    <h4 style={{ margin: 0, fontSize: "0.85rem", color: colors.goldBright, textTransform: "uppercase", letterSpacing: "1px" }}>Суинг-трейдинг жоспары</h4>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontFamily: fontMono, paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ color: colors.textMuted }}>Кіру (Entry):</span>
                    <span style={{ fontWeight: "bold", color: colors.textPrimary, fontSize: "1.1rem" }}>{fmtCurr(data.tradePlan.entry, currency, usdkzt)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontFamily: fontMono, paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ color: colors.textMuted }}>Пайда алу (Take Profit):</span>
                    <span style={{ fontWeight: "bold", color: colors.gainBright, fontSize: "1.1rem" }}>{fmtCurr(data.tradePlan.takeProfit1, currency, usdkzt)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fontMono }}>
                    <span style={{ color: colors.textMuted }}>Шығынды шектеу (Stop Loss):</span>
                    <span style={{ fontWeight: "bold", color: colors.lossBright, fontSize: "1.1rem" }}>{fmtCurr(data.tradePlan.stopLoss, currency, usdkzt)}</span>
                  </div>
                </div>
              )}

              <HalalCard halal={data.halal} currentPrice={data.currentPrice} currency={currency} usdkzt={usdkzt} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
