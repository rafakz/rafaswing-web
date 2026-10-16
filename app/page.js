"use client";

import { useState, useEffect } from "react";
import NavMenu from "./NavMenu";
import Header from "./Header";
import ProChart from "./ProChart";
import { supabase } from "./supabaseClient";
import { getSignal, SIGNAL_COLOR_KEY, generateSmartAlerts, calculatePositionSize } from "../lib/tradeiq-engine";
import { explainFundamentals } from "../lib/fundamentals-explain";

/* ---------- Дизайн токендары (Tailwind-ке бейімделді, бірақ логика үшін сақталды) ---------- */
const colors = {
  bg: "transparent", // Фон Tailwind арқылы беріледі
  card: "rgba(20, 28, 45, 0.6)", // Glassmorphism үшін мөлдір фон
  border: "rgba(255, 255, 255, 0.08)",
  gold: "#3b82f6", // Көк акцент
  goldBright: "#60a5fa",
  textPrimary: "#ffffff",
  textMuted: "#9ca3af",
  textFaint: "#6b7280",
  gain: "#10b981", // Tailwind emerald-500
  gainBright: "#34d399",
  loss: "#ef4444", // Tailwind red-500
  lossBright: "#f87171",
  hold: "#eab308", // Tailwind yellow-500
};

const AI_SUGGESTIONS = [
  "AAPL акциясына талдау жаса",
  "Нарық жағдайы қалай?",
  "Swing trading бойынша кеңес бер",
];

/* ---------- Custom CSS for specific effects ---------- */
const globalCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
html, body { 
  background-color: #0b0f19; 
  color: #ffffff; 
  font-family: 'Inter', -apple-system, sans-serif; 
}
.glass-card {
  background: rgba(20, 28, 45, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.glow-blue {
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.2), inset 0 0 10px rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.4);
}
.glow-red {
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.15), inset 0 0 10px rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.3);
}
.glow-green {
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.15), inset 0 0 10px rgba(16, 185, 129, 0.05);
  border-color: rgba(16, 185, 129, 0.3);
}
.bg-glow {
  position: absolute;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%);
  z-index: -1;
  border-radius: 50%;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.tradeiq-card { animation: fadeInUp 0.4s ease-out; }
.tradeiq-content-shell { margin-left: 0; }
@media (min-width: 1024px) {
  .tradeiq-content-shell { margin-left: 240px; }
}
`;

/* ---------- AI панель иконкасы ---------- */
function IconSparkleChat({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5l1.3 4.2 4.2 1.3-4.2 1.3-1.3 4.2-1.3-4.2-4.2-1.3 4.2-1.3L12 3.5z" />
      <path d="M18.5 15l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9z" />
    </svg>
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
    <div className="mt-5 pt-4 border-t border-white/10">
      <div className="flex justify-between items-center flex-wrap gap-2 mb-3">
        <div className="text-xs font-bold text-blue-500 uppercase tracking-wider drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">
          Халал скрин
        </div>
        <div
          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border text-center"
          style={{ color: tone, borderColor: tone, backgroundColor: `${tone}15` }}
        >
          {halal.label}
        </div>
      </div>

      {halal.summary && (
        <div className="text-xs text-gray-400 leading-snug mb-3">
          {halal.summary}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {halal.checks.map((c) => (
          <div key={c.key} className="flex justify-between items-start gap-2 text-xs">
            <div className="min-w-0 text-gray-200">
              {c.label}
              {c.note && <div className="text-[10px] text-gray-500 mt-0.5">{c.note}</div>}
            </div>
            <div className="shrink-0 font-mono font-bold text-right" style={{ color: toneOf(c.status) }}>
              {c.display ? c.display + " " : ""}
              {markOf(c.status)}
            </div>
          </div>
        ))}
      </div>

      {halal.disclaimer && (
        <div className="mt-3 text-[10px] text-gray-500 leading-relaxed">
          ⚠ {halal.disclaimer}
        </div>
      )}
    </div>
  );
}

/* ---------- Sparkline ---------- */
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
    <div className="absolute bottom-2 right-2 w-24 h-12 opacity-80 pointer-events-none">
       <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full">
        <polygon points={areaPoints} fill={lineColor} opacity="0.1" />
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={lineColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_0_3px_rgba(currentcolor,0.5)]"
        />
      </svg>
    </div>
  );
}

/* ---------- Utils ---------- */
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

  const [sectors, setSectors] = useState([]);
  const [sectorsLoading, setSectorsLoading] = useState(true);

  const [homeNews, setHomeNews] = useState([]);
  const [homeNewsLoading, setHomeNewsLoading] = useState(true);

  const [session, setSession] = useState(null);
  const [watchlistSymbols, setWatchlistSymbols] = useState([]);
  const [watchlistBusy, setWatchlistBusy] = useState(false);

  const [alertPrice, setAlertPrice] = useState("");
  const [alertDirection, setAlertDirection] = useState("above");
  const [alertSubmitting, setAlertSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const [riskCapital, setRiskCapital] = useState("");
  const [riskPercent, setRiskPercent] = useState("2");

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
      } catch (err) {} finally {
        if (!cancelled) setHomeNewsLoading(false);
      }
    }
    loadHomeNews();
    return () => { cancelled = true; };
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
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadSectors() {
      setSectorsLoading(true);
      try {
        const res = await fetch("/api/sectors");
        const json = await res.json();
        if (!cancelled && res.ok && Array.isArray(json.sectors)) {
          setSectors(json.sectors);
        }
      } catch (err) {} finally {
        if (!cancelled) setSectorsLoading(false);
      }
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
    if (symbolParam) {
      loadFromOverview(symbolParam.toUpperCase());
    }
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
    } catch (err) {} finally {
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

  async function sendChatMessage(e, textOverride) {
    e.preventDefault();
    const text = (textOverride || chatInput).trim();
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
                swingScoreBreakdown: data.swingScoreBreakdown,
                fundamentals: data.fundamentals,
                tradePlan: data.tradePlan,
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
  const smartAlerts = data
    ? generateSmartAlerts({
        technicals: data.technicals,
        volumeInfo: data.volume,
        currentPrice: data.currentPrice,
        signal,
      })
    : [];
  const hasHistory = data && Array.isArray(data.history) && data.history.length > 1;
  const hasTechnicals = data && data.technicals && typeof data.technicals === "object";
  const hasNews = Array.isArray(news) && news.length > 0;

  return (
    <main className="min-h-screen pb-24 relative overflow-hidden bg-[#0b0f19] text-white">
      <style>{globalCss}</style>
      
      {/* Background Glows */}
      <div className="bg-glow top-[-50px] left-[-50px]"></div>
      <div className="bg-glow top-[30%] right-[-100px]" style={{background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(0,0,0,0) 70%)'}}></div>

      <NavMenu />

      <div className="tradeiq-content-shell max-w-md mx-auto px-4 relative z-10">
        <Header overview={overview} />

        <div className="flex flex-col items-center pt-8">

          {/* ---------- БРЕНД ---------- */}
          <div className="flex flex-col items-center justify-center mb-8 relative w-full">
            <div className="flex items-center gap-3">
              <div className="flex items-end gap-1 h-8">
                <div className="w-2 h-5 bg-red-400 rounded-full shadow-[0_0_8px_#f87171]"></div>
                <div className="w-2 h-8 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]"></div>
                <div className="w-2 h-6 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]"></div>
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight">Trade<span className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">IQ</span></h2>
            </div>
            <p className="text-blue-500 text-[10px] font-bold tracking-[0.2em] mt-2 shadow-blue-500/50">AI-POWERED TRADING</p>
            <p className="text-gray-400 text-xs mt-3 text-center">Свинг-трейдинг және инвестиция платформасы</p>
            <div className="absolute left-8 top-2 w-4 h-4 text-blue-400 opacity-70">✦</div>
            <div className="absolute right-6 top-0 text-3xl text-blue-400 opacity-80 blur-[1px]">✦</div>
          </div>

          {/* ---------- ІЗДЕУ ФОРМАСЫ ---------- */}
          <form onSubmit={searchStock} className="flex gap-2 w-full mb-8">
            <div className="flex-1 glass-card rounded-2xl flex items-center px-4 py-1 relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="Ticker жаз (мыс. AAPL)"
                className="bg-transparent w-full p-3 text-sm focus:outline-none text-white placeholder-gray-500"
              />
            </div>
            <button type="submit" className="bg-blue-500 hover:bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)] text-white px-6 rounded-2xl font-semibold transition text-sm">
              Іздеу
            </button>
          </form>

          {/* ---------- НАРЫҚ ШОЛУЫ ---------- */}
          <div className="w-full mb-8">
            <h3 className="text-lg font-bold mb-4 text-white">Нарық шолуы</h3>
            <div className="grid grid-cols-2 gap-4">
              {overviewLoading && overview.length === 0
                ? OVERVIEW_SYMBOLS.map((item) => (
                    <div key={item.symbol} className="glass-card rounded-2xl p-4 min-h-[100px] animate-pulse">
                      <div className="h-4 bg-white/10 rounded w-1/2 mb-4"></div>
                      <div className="h-6 bg-white/10 rounded w-3/4"></div>
                    </div>
                  ))
                : overview.map((item) => {
                    const up = typeof item.change === "number" && item.change >= 0;
                    const glowClass = up ? "glow-green" : "glow-red";
                    const colorText = up ? "text-emerald-400" : "text-red-400";
                    const iconBg = up ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400";

                    return (
                      <button
                        key={item.symbol}
                        onClick={() => loadFromOverview(item.symbol)}
                        className={`tradeiq-overview-card glass-card rounded-2xl p-4 relative overflow-hidden text-left w-full transition-transform hover:-translate-y-1 ${!item.error ? glowClass : ''}`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`${iconBg} text-[10px] font-bold px-1.5 py-0.5 rounded`}>
                            {item.symbol.slice(0, 2)}
                          </span>
                          <span className="text-gray-300 text-sm font-medium">{item.label}</span>
                        </div>
                        {item.error ? (
                          <div className="text-gray-500 text-xs mt-2">Деректер жоқ</div>
                        ) : (
                          <>
                            <div className="text-2xl font-bold text-white">{safeNum(item.currentPrice, 2)}</div>
                            <div className={`${colorText} text-sm mt-1 flex items-center gap-1 font-mono`}>
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
          <div className="w-full mb-8">
            <div className="glass-card rounded-2xl p-5 border border-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
              
              <div className="flex items-center gap-2 mb-2 relative z-10">
                <div className="text-blue-400 text-xl">✦</div>
                <h3 className="font-bold text-white">TradeIQ AI</h3>
              </div>
              <p className="text-gray-300 text-xs mb-4 relative z-10">Қалай көмектесе аламын? ✨</p>

              {chatMessages.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto mb-3 scrollbar-hide relative z-10">
                  {chatMessages.map((m, i) => (
                    <div
                      key={i}
                      className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                        m.role === "user" 
                          ? "bg-blue-600 text-white self-end rounded-br-sm" 
                          : "bg-white/10 text-gray-200 self-start rounded-bl-sm border border-white/5"
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                  {chatLoading && <div className="text-gray-500 text-xs self-start italic">Жазып жатыр...</div>}
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-3 mb-1 relative z-10 scrollbar-hide">
                  {AI_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendChatMessage({ preventDefault: () => {} }, suggestion)}
                      className="whitespace-nowrap px-4 py-2 rounded-xl border border-white/10 hover:border-blue-500/50 bg-white/5 text-xs text-gray-300 transition"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {chatError && <p className="text-red-400 text-xs mb-2 relative z-10">{chatError}</p>}

              <form onSubmit={sendChatMessage} className="flex gap-2 relative z-10">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Сұрағыңызды жазыңыз..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl font-medium text-sm transition shadow-[0_0_10px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:shadow-none"
                >
                  Жіберу
                </button>
              </form>
            </div>
          </div>

          {/* ---------- СЕКТОРЛАР ---------- */}
          <div className="w-full mb-8">
            <h3 className="text-sm font-bold text-gray-200 mb-4">Секторлар — ақша қай жаққа құйылып жатыр</h3>
            <div className="glass-card rounded-2xl p-5">
              {sectorsLoading && sectors.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-4">Жүктелуде...</div>
              ) : sectors.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-4">Сектор деректері жоқ</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {sectors.map((s) => {
                    const up = typeof s.changePercent === "number" && s.changePercent >= 0;
                    const magnitude = Math.min(Math.abs(s.changePercent || 0) / 2, 1);
                    return (
                      <div key={s.symbol} className="flex items-center gap-3 text-xs">
                        <span className="w-28 text-gray-400 truncate">{s.label}</span>
                        <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full shadow-[0_0_5px_currentColor] opacity-80 ${up ? 'bg-emerald-500 text-emerald-500' : 'bg-red-500 text-red-500'}`}
                            style={{ width: `${Math.max(2, magnitude * 100)}%` }}
                          />
                        </div>
                        <span className={`w-14 text-right font-mono font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                          {up ? "▲" : "▼"}{safeNum(Math.abs(s.changePercent), 2)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {loading && <p className="my-6 text-gray-400 animate-pulse">Мәліметтер ізделуде...</p>}
          {error && <p className="my-6 text-red-400">{error}</p>}

          {/* ---------- БАСТЫ НӘТИЖЕ КАРТОЧКАСЫ ---------- */}
          {data && (
            <div className="tradeiq-card w-full glass-card rounded-[2rem] p-6 relative overflow-hidden mb-8">
              {/* Background accent for card */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full"></div>
              
              {/* Header */}
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  {data.logo ? (
                    <img src={data.logo} alt="" className="w-10 h-10 rounded-xl bg-white/5" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                      {data.symbol?.slice(0,2)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold tracking-wider">{data.symbol}</h2>
                    <p className="text-xs text-gray-400">{data.name}</p>
                  </div>
                </div>
                {session?.user && (
                  <button 
                    onClick={() => toggleWatchlist(data.symbol)}
                    className="text-2xl hover:scale-110 transition-transform"
                    style={{ color: watchlistSymbols.includes(data.symbol) ? '#f59e0b' : '#4b5563' }}
                  >
                    {watchlistSymbols.includes(data.symbol) ? "★" : "☆"}
                  </button>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 font-mono mb-6 relative z-10">
                <span className="text-4xl font-bold">${safeNum(data.currentPrice, 2)}</span>
                <span className={`text-sm ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isUp ? "▲" : "▼"}{safeNum(Math.abs(data.change), 2)} ({safeNum(data.changePercent, 2)}%)
                </span>
              </div>

              {/* Chart */}
              {Array.isArray(data.chartData) && data.chartData.length > 1 ? (
                <div className="mb-6 h-40 bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                  <ProChart chartData={data.chartData} pivot={data.pivot} tradePlan={data.tradePlan} colors={colors} />
                </div>
              ) : hasHistory && (
                <div className="mb-6 h-20 relative bg-white/5 rounded-xl border border-white/5">
                  <Sparkline history={data.history} isUp={isUp} />
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-gray-400 font-mono bg-white/5 p-4 rounded-2xl mb-6 border border-white/5">
                <div>Open: <span className="text-gray-200">${safeNum(data.open, 2)}</span></div>
                <div>Prev Close: <span className="text-gray-200">${safeNum(data.previousClose, 2)}</span></div>
                <div>High: <span className="text-gray-200">${safeNum(data.high, 2)}</span></div>
                <div>Low: <span className="text-gray-200">${safeNum(data.low, 2)}</span></div>
                {data.marketCap && <div>Mkt Cap: <span className="text-gray-200">${(data.marketCap/1000).toFixed(1)}B</span></div>}
              </div>

              {/* Trade Plan Panel */}
              {data.tradePlan && (
                <div className="mb-6 p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 relative">
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_#3b82f6]"></span>
                    Сауда жоспары
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                    <div>Entry: <span className="text-white font-bold">${safeNum(data.tradePlan.entry, 2)}</span></div>
                    <div>Stop Loss: <span className="text-red-400 font-bold">${safeNum(data.tradePlan.stopLoss, 2)}</span></div>
                    <div>TP 1: <span className="text-emerald-400 font-bold">${safeNum(data.tradePlan.takeProfit1, 2)}</span></div>
                    <div>TP 2: <span className="text-emerald-400 font-bold">${safeNum(data.tradePlan.takeProfit2, 2)}</span></div>
                  </div>
                </div>
              )}

              {/* Technicals */}
              {hasTechnicals && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Техникалық анализ</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-300">
                    <div>RSI (14): <span className={data.technicals.rsi > 70 ? 'text-red-400' : data.technicals.rsi < 30 ? 'text-emerald-400' : 'text-white'}>{safeNum(data.technicals.rsi, 2)}</span></div>
                    <div>MACD: <span className={data.technicals.macd > 0 ? 'text-emerald-400' : 'text-red-400'}>{safeNum(data.technicals.macd, 2)}</span></div>
                    <div>SMA20: ${safeNum(data.technicals.sma20, 2)}</div>
                    <div>SMA50: ${safeNum(data.technicals.sma50, 2)}</div>
                  </div>
                  
                  {signal && (
                    <div className="mt-4 p-3 rounded-xl border border-white/10 bg-white/5">
                      <div className={`text-sm font-bold font-mono mb-2 ${signal.level === 'bullish' ? 'text-emerald-400' : signal.level === 'bearish' ? 'text-red-400' : 'text-yellow-400'}`}>
                        Сигнал: {signal.label}
                      </div>
                      <ul className="text-[10px] text-gray-400 list-disc pl-4 space-y-1">
                        {signal.reasons.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* AI Button inside card */}
              <button
                onClick={getAiSummary}
                disabled={aiLoading}
                className="w-full py-3 rounded-xl border border-blue-500/50 text-blue-400 font-bold text-sm hover:bg-blue-500/10 transition mt-2 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
              >
                {aiLoading ? "Талдау жасалуда..." : "✨ AI қорытынды алу"}
              </button>
              
              {aiSummary && (
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-200 leading-relaxed">
                  {aiSummary}
                </div>
              )}

              <HalalCard halal={data.halal} />
            </div>
          )}

          {/* ---------- НАРЫҚ ЖАҢАЛЫҚТАРЫ ---------- */}
          <div className="w-full mb-8">
            <div className="glass-card rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white">Нарық жаңалықтары</h3>
                <a href="/news" className="text-xs text-blue-400 hover:text-blue-300">Барлығы →</a>
              </div>
              <div className="flex flex-col gap-3">
                {homeNewsLoading ? (
                  <div className="text-xs text-gray-500">Жүктелуде...</div>
                ) : (
                  homeNews.map((item, i) => (
                    <a key={i} href={item.url} target="_blank" rel="noreferrer" className="flex gap-3 items-start group">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 shrink-0 group-hover:border-blue-500/50 transition"></div>
                      <div>
                        <div className="text-xs text-gray-200 leading-snug group-hover:text-blue-400 transition line-clamp-2">
                          {item.headline}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 font-mono">
                          {item.source} · {formatNewsDate(item.datetime)}
                        </div>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>
          </div>

          <p className="mt-4 mb-8 text-center text-gray-600 text-xs">© TradeIQ — дала рухымен сауда</p>
        </div>
      </div>
    </main>
  );
}
