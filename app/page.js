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

const fontDisplay = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const fontBody = fontDisplay;
const fontMono = fontDisplay;

const globalCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
html, body { background-color: ${colors.bg}; color: ${colors.textPrimary}; font-family: ${fontBody}; margin: 0; padding: 0; overflow-x: hidden; }
* { box-sizing: border-box; }
.glass-card { background: ${colors.card}; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid ${colors.cardBorder}; border-radius: 20px; }
.tradeiq-search-capsule:focus-within { border-color: rgba(59,130,246,0.6) !important; box-shadow: 0 0 20px rgba(59,130,246,0.15); }
.glow-bg { position: absolute; width: 400px; height: 400px; background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(0,0,0,0) 70%); border-radius: 50%; z-index: -1; pointer-events: none; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade { animation: fadeInUp 0.5s ease-out; }
.tradeiq-content-shell { margin-left: 0; }
@media (min-width: 1024px) { .tradeiq-content-shell { margin-left: 240px; } }
`;

function TradeIQMark({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="12" y1="18" x2="12" y2="38" stroke={colors.loss} strokeWidth="2.8" strokeLinecap="round" />
      <rect x="9" y="24" width="6" height="10" rx="2" fill={colors.loss} />
      <line x1="24" y1="10" x2="24" y2="40" stroke={colors.gain} strokeWidth="2.8" strokeLinecap="round" />
      <rect x="21" y="18" width="6" height="16" rx="2" fill={colors.gain} />
      <line x1="36" y1="6" x2="36" y2="32" stroke={colors.gain} strokeWidth="2.8" strokeLinecap="round" />
      <rect x="33" y="12" width="6" height="14" rx="2" fill={colors.gain} />
    </svg>
  );
}

function Sparkline({ history, isUp }) {
  if (!Array.isArray(history) || history.length < 2) return null;
  const closes = history.map((h) => h?.close).filter(c => c !== null && !isNaN(c));
  if (closes.length < 2) return null;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const width = 300; const height = 60; const padY = 2;
  const points = closes.map((c, i) => `${(i / (closes.length - 1) * width).toFixed(1)},${(padY + (1 - (c - min) / range) * (height - padY * 2)).toFixed(1)}`);
  const lineColor = isUp ? "#10b981" : "#ef4444"; 
  return (
    <div style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        <polygon points={`0,${height} ${points.join(" ")} ${width},${height}`} fill={lineColor} opacity="0.1" />
        <polyline points={points.join(" ")} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
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
       <div style={{ fontSize: "2rem" }}>{icon}</div>
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
  const tone = halal.status === "pass" ? colors.gain : halal.status === "fail" ? colors.loss : colors.hold;

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
    <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: `1px solid ${colors.cardBorder}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: colors.gold, textTransform: "uppercase" }}>🕌 Халал Инвестиция</div>
        <div style={{ fontSize: "0.75rem", fontWeight: "700", color: tone, border: `1px solid ${tone}`, padding: "4px 12px", borderRadius: "999px" }}>{halal.label}</div>
      </div>
      <div style={{ fontSize: "0.8rem", color: colors.textMuted, marginBottom: "20px" }}>{halal.summary}</div>
      
      {halal.status === "pass" && (
        <div style={{ background: "rgba(16,185,129,0.05)", border: `1px solid rgba(16,185,129,0.2)`, borderRadius: "16px", padding: "20px", marginTop: "16px" }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: colors.gainBright }}>Зекет және Тазарту</h4>
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

function safeNum(v, digits) { return (typeof v !== "number" || isNaN(v)) ? "—" : v.toFixed(digits); }
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
  
  // AI Summary States
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Chat States
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const [overview, setOverview] = useState([]);
  const [session, setSession] = useState(null);
  const [currency, setCurrency] = useState("USD");
  const [usdkzt, setUsdkzt] = useState(500);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD").then(r => r.json()).then(d => { if (d?.rates?.KZT) setUsdkzt(d.rates.KZT); }).catch(()=>{});
    supabase.auth.getSession().then(({ data }) => setSession(data?.session));
  }, []);

  const OVERVIEW_SYMBOLS = [{ symbol: "QQQ", label: "NASDAQ" }, { symbol: "SPY", label: "S&P 500" }];
  useEffect(() => {
    Promise.all(OVERVIEW_SYMBOLS.map(async (item) => {
      try {
        const res = await fetch(`/api/stock?symbol=${item.symbol}`);
        return { ...item, ...(await res.json()) };
      } catch { return { ...item, error: true }; }
    })).then(setOverview);
  }, []);

  async function getAiSummary(stockData) {
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockData)
      });
      const json = await res.json();
      if (res.ok && json.summary) setSummary(json.summary);
    } catch(err) { console.error(err); }
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
      else {
        setData(json);
        getAiSummary(json); // Деректер келген бойда AI түсіндірмені автоматты түрде алады
      }
    } catch { setError("Байланыс қатесі"); } finally { setLoading(false); }
  }

  async function sendChatMessage(e) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    const newMessages = [...chatMessages, { role: "user", text }];
    setChatMessages(newMessages); setChatInput(""); setChatLoading(true); setChatError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, stockContext: data }),
      });
      const json = await res.json();
      if (!res.ok || json.error) setChatError(json.error || "Қате шықты");
      else setChatMessages([...newMessages, { role: "assistant", text: json.reply }]);
    } catch { setChatError("Желі қатесі"); } finally { setChatLoading(false); }
  }

  const isUp = data?.change >= 0;
  const hasFund = !!data?.fundamentals;

  return (
    <main style={{ minHeight: "100vh", position: "relative", paddingBottom: "140px" }}>
      <style>{globalCss}</style>
      <div className="glow-bg" style={{ top: "-50px", left: "-50px" }}></div>
      <NavMenu />

      <div className="tradeiq-content-shell" style={{ maxWidth: "500px", margin: "0 auto", padding: "0 16px", zIndex: 10 }}>
        <Header overview={overview} />
        <div style={{ paddingTop: "24px" }}>
          
          <div className="animate-fade" style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "30px" }}>
            <TradeIQMark size={40} />
            <h2 style={{ fontSize: "2.4rem", margin: 0, fontWeight: "800" }}>Trade<span style={{ color: colors.gold }}>IQ</span></h2>
          </div>

          <form onSubmit={searchStock} style={{ display: "flex", background: "rgba(30,41,59,0.4)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.08)", padding: "6px", marginBottom: "30px" }}>
            <input value={ticker} onChange={e => setTicker(e.target.value)} placeholder="Тикер жазыңыз (мыс. AAPL)" style={{ flex: 1, padding: "0 16px", background: "transparent", border: "none", color: "#fff", outline: "none" }} />
            <button type="submit" style={{ padding: "0 24px", height: "46px", borderRadius: "18px", background: colors.gold, border: "none", color: "#fff", fontWeight: "600", cursor: "pointer" }}>Іздеу</button>
          </form>

          {loading && <p style={{ color: colors.goldBright, textAlign: "center" }}>Ізделуде...</p>}
          {error && <p style={{ color: colors.lossBright, textAlign: "center" }}>{error}</p>}

          {data && (
            <div className="glass-card animate-fade" style={{ padding: "24px", marginBottom: "40px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.4rem" }}>{data.symbol}</h2>
                  <p style={{ margin: "4px 0 0", color: colors.textMuted, fontSize: "0.85rem" }}>{data.name}</p>
                </div>
              </div>

              <div style={{ fontSize: "2.8rem", fontWeight: "800", fontFamily: fontMono, marginBottom: "20px" }}>
                {fmtCurr(data.currentPrice, currency, usdkzt)}
                <span style={{ fontSize: "1rem", color: isUp ? colors.gain : colors.loss, marginLeft: "12px" }}>
                  {isUp ? "▲" : "▼"}{fmtCurr(Math.abs(data.change), currency, usdkzt)} ({safeNum(data.changePercent, 2)}%)
                </span>
              </div>

              {/* Психолог (Енді үнемі жұмыс істейді) */}
              <AiPsychologist data={data} />

              {Array.isArray(data.chartData) && data.chartData.length > 1 && (
                <div style={{ height: "180px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", marginBottom: "24px", overflow: "hidden" }}>
                  <ProChart chartData={data.chartData.map(d => ({ ...d, close: d.close * (currency==="KZT"?usdkzt:1) }))} />
                </div>
              )}

              {/* Фундаментал және Техникалық сандар */}
              {hasFund && (
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "0.85rem", color: colors.textFaint, textTransform: "uppercase" }}>Фундаменталды және Техникалық сандар</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px", fontFamily: fontMono, fontSize: "0.85rem" }}>
                    <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>P/E: <span style={{ color: "#fff", fontWeight: "bold" }}>{safeNum(data.fundamentals.peRatio, 2)}</span></div>
                    <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>ROE: <span style={{ color: "#fff", fontWeight: "bold" }}>{safeNum(data.fundamentals.roe, 2)}%</span></div>
                    <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>RSI: <span style={{ color: data.technicals?.rsi > 70 ? colors.lossBright : data.technicals?.rsi < 30 ? colors.gainBright : "#fff", fontWeight: "bold" }}>{safeNum(data.technicals?.rsi, 2)}</span></div>
                    <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>MACD: <span style={{ color: data.technicals?.macd > 0 ? colors.gainBright : colors.lossBright, fontWeight: "bold" }}>{safeNum(data.technicals?.macd, 2)}</span></div>
                  </div>
                </div>
              )}

              {/* AI ТҮСІНДІРМЕ (ЖАҢА) */}
              <div style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
                <h4 style={{ margin: "0 0 12px 0", color: colors.goldBright, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>✨</span> AI Толық Талдау
                </h4>
                {summaryLoading ? (
                  <div style={{ color: colors.textMuted, fontSize: "0.85rem", animation: "pulse 1.5s infinite" }}>AI мәліметтерді оқып, сараптама жасауда...</div>
                ) : summary ? (
                  <div style={{ color: "#e2e8f0", fontSize: "0.85rem", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{summary}</div>
                ) : null}
              </div>

              {/* Суинг жоспары */}
              {data.tradePlan?.entry && (
                <div style={{ background: "rgba(59,130,246,0.05)", border: `1px solid rgba(59,130,246,0.3)`, borderRadius: "16px", padding: "20px" }}>
                  <h4 style={{ margin: "0 0 16px 0", color: colors.goldBright, textTransform: "uppercase" }}>🎯 Суинг-трейдинг жоспары</h4>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontFamily: fontMono }}><span style={{ color: colors.textMuted }}>Кіру:</span><span style={{ fontWeight: "bold" }}>{fmtCurr(data.tradePlan.entry, currency, usdkzt)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontFamily: fontMono }}><span style={{ color: colors.textMuted }}>Пайда алу (TP):</span><span style={{ fontWeight: "bold", color: colors.gainBright }}>{fmtCurr(data.tradePlan.takeProfit1, currency, usdkzt)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fontMono }}><span style={{ color: colors.textMuted }}>Шығынды шектеу (SL):</span><span style={{ fontWeight: "bold", color: colors.lossBright }}>{fmtCurr(data.tradePlan.stopLoss, currency, usdkzt)}</span></div>
                </div>
              )}

              <HalalCard halal={data.halal} currentPrice={data.currentPrice} currency={currency} usdkzt={usdkzt} />
            </div>
          )}
        </div>
      </div>

      {/* Floating Chat (Төменде қалқып тұратын AI көмекшісі) қайтарылды */}
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
