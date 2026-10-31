"use client";

import { useState, useEffect } from "react";
import NavMenu from "./NavMenu";
import Header from "./Header";
import ProChart from "./ProChart";
import FloatingChat from "./FloatingChat";
import { supabase } from "./supabaseClient";
import { color, font, radius, space, size, motion, changeColor } from "../lib/theme";
import { Card, Button } from "./ui";

const OVERVIEW_SYMBOLS = [
  { symbol: "QQQ", label: "NASDAQ 100 ETF" },
  { symbol: "SPY", label: "S&P 500 ETF" },
];
const OVERVIEW_INTERVAL_MS = 60 * 1000;

/* ---------- Қысқа көмекшілер ---------- */
function safeNum(v, digits) {
  return typeof v !== "number" || isNaN(v) ? "—" : v.toFixed(digits);
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

function fmtUpdated(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString("kk-KZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch (e) {
    return "";
  }
}

function evaluateFundamental(key, value) {
  if (typeof value !== "number" || isNaN(value)) return { text: "—", color: color.textMuted };
  if (key === "PE") {
    if (value < 15 && value > 0) return { text: "Тартымды", color: color.gainStrong };
    if (value <= 25 && value >= 15) return { text: "Қалыпты", color: color.neutral };
    return { text: "Қымбат", color: color.lossStrong };
  }
  if (key === "DE") {
    if (value < 1) return { text: "Қауіпсіз", color: color.gainStrong };
    if (value <= 2) return { text: "Орташа", color: color.neutral };
    return { text: "Қауіпті", color: color.lossStrong };
  }
  if (key === "CR") {
    if (value >= 1.5) return { text: "Өтімді", color: color.gainStrong };
    if (value >= 1) return { text: "Қалыпты", color: color.neutral };
    return { text: "Нашар", color: color.lossStrong };
  }
  if (key === "ROE") {
    if (value >= 15) return { text: "Өте тиімді", color: color.gainStrong };
    if (value >= 5) return { text: "Қалыпты", color: color.neutral };
    return { text: "Тиімсіз", color: color.lossStrong };
  }
  if (key === "PM") {
    if (value >= 10) return { text: "Табысты", color: color.gainStrong };
    if (value > 0) return { text: "Аз маржа", color: color.neutral };
    return { text: "Шығын", color: color.lossStrong };
  }
  if (key === "PB") {
    if (value <= 3 && value >= 1) return { text: "Әділ", color: color.gainStrong };
    if (value > 0 && value < 1) return { text: "Арзан", color: color.neutral };
    return { text: "Қымбат", color: color.lossStrong };
  }
  return { text: "—", color: color.textSecondary };
}

/* ---------- Бөлек блоктар ---------- */
const sectionTitle = {
  fontSize: font.xs,
  fontWeight: font.semibold,
  color: color.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.6px",
  marginBottom: space.md,
};

const statBox = {
  padding: space.md,
  background: color.surfaceAlt,
  border: `1px solid ${color.borderSoft}`,
  borderRadius: radius.lg,
};

function Sparkline({ history, isUp, height = 60 }) {
  if (!Array.isArray(history) || history.length < 2) return null;
  const closes = history.map((h) => (h && typeof h.close === "number" ? h.close : null)).filter((c) => c !== null && !isNaN(c));
  if (closes.length < 2) return null;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const width = 300;
  const padY = 2;
  const points = closes.map((c, i) => {
    const x = (i / (closes.length - 1)) * width;
    const y = padY + (1 - (c - min) / range) * (height - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const lineColor = isUp ? color.gain : color.loss;
  const areaPoints = `0,${height} ${points.join(" ")} ${width},${height}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
      <polygon points={areaPoints} fill={lineColor} opacity="0.12" />
      <polyline points={points.join(" ")} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SentimentMeter({ score }) {
  const label =
    score >= 60
      ? { text: "Өсуге бейім", c: color.gainStrong }
      : score <= 40
      ? { text: "Түсуге бейім", c: color.lossStrong }
      : { text: "Бейтарап", c: color.neutral };
  return (
    <Card padding={space.lg} style={{ marginBottom: space.lg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.md }}>
        <div style={{ ...sectionTitle, marginBottom: 0 }}>AI нарық көңіл-күйі</div>
        <div style={{ fontSize: font.sm, fontWeight: font.semibold, color: label.c }}>
          {label.text} ({score}%)
        </div>
      </div>
      <div style={{ width: "100%", height: 6, background: color.border, borderRadius: 3, position: "relative" }}>
        <div style={{ position: "absolute", left: `calc(${score}% - 4px)`, top: -4, width: 8, height: 14, background: color.textPrimary, borderRadius: 4 }} />
      </div>
    </Card>
  );
}

function AiPsychologist({ data }) {
  if (!data || !data.technicals) return null;
  const rsi = data.technicals.rsi || 50;
  const change = data.changePercent || 0;
  let message;
  let tone;
  if (change <= -2 || rsi < 35) {
    tone = color.loss;
    message = `${data.symbol} құлап жатыр. Дүрбелеңмен сатудың орнына түзетудің соңын күтіп, салқынқанды шешім қабылдаңыз.`;
  } else if (change >= 4 || rsi > 70) {
    tone = color.neutral;
    message = `${data.symbol} күрт өсіп жатыр. Ең жоғарғы бағада FOMO-мен сатып алудан сақ болыңыз.`;
  } else {
    tone = color.accent;
    message = "Нарық қалыпты күйде. Шешім қабылдамас бұрын төмендегі талдау мен фундаменталды сандарды оқыңыз.";
  }
  return (
    <Card padding={space.lg} style={{ marginBottom: space.lg, borderColor: tone }}>
      <div style={{ fontSize: font.sm, fontWeight: font.semibold, color: tone, marginBottom: 6 }}>Трейдер психологы</div>
      <div style={{ fontSize: font.sm, color: color.textSecondary, lineHeight: 1.5 }}>{message}</div>
    </Card>
  );
}

function HalalCard({ halal, currentPrice, currency, usdkzt }) {
  const [shares, setShares] = useState("");
  if (!halal || typeof halal !== "object" || !Array.isArray(halal.checks)) return null;

  const toneOf = (s) => (s === "pass" ? color.gain : s === "fail" ? color.loss : s === "doubtful" ? color.neutral : color.textMuted);
  const markOf = (s) => (s === "pass" ? "✓" : s === "fail" ? "✕" : s === "doubtful" ? "⚠" : "?");
  const tone = toneOf(halal.status);

  let purificationRate = 0;
  const nonCompliant = halal.checks.find((c) => c.key === "nonCompliantIncome");
  if (nonCompliant && nonCompliant.display) {
    const val = parseFloat(nonCompliant.display.replace("%", ""));
    if (!isNaN(val) && val > 0) purificationRate = val;
  }

  const numShares = parseFloat(shares);
  let totalValue = 0;
  let zakatAmount = 0;
  if (!isNaN(numShares) && numShares > 0 && currentPrice) {
    totalValue = numShares * currentPrice * (currency === "KZT" ? usdkzt : 1);
    zakatAmount = totalValue * 0.025;
  }

  return (
    <Card padding={space.lg} style={{ marginTop: space.lg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.md }}>
        <div style={{ ...sectionTitle, marginBottom: 0 }}>Халал инвестиция</div>
        <div style={{ fontSize: font.xs, fontWeight: font.semibold, color: tone, border: `1px solid ${tone}`, padding: "3px 10px", borderRadius: radius.pill }}>
          {halal.label}
        </div>
      </div>
      <div style={{ fontSize: font.sm, color: color.textMuted, marginBottom: space.md }}>{halal.summary}</div>

      <div style={{ display: "flex", flexDirection: "column", gap: space.sm, marginBottom: space.md }}>
        {halal.checks.map((c) => (
          <div key={c.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: space.sm, fontSize: font.sm, paddingBottom: space.sm, borderBottom: `1px solid ${color.borderSoft}` }}>
            <div style={{ color: color.textPrimary }}>
              {c.label}
              {c.note && <div style={{ fontSize: font.xs, color: color.textMuted, marginTop: 4 }}>{c.note}</div>}
            </div>
            <div style={{ fontWeight: font.bold, color: toneOf(c.status) }}>
              {c.display ? c.display + " " : ""}
              {markOf(c.status)}
            </div>
          </div>
        ))}
      </div>

      {halal.status === "pass" && (
        <div style={{ padding: space.md, border: `1px solid ${color.gain}`, borderRadius: radius.lg }}>
          <div style={{ ...sectionTitle, color: color.gainStrong }}>Зекет және тазарту</div>
          {purificationRate > 0 && (
            <div style={{ fontSize: font.sm, color: color.textSecondary, marginBottom: space.md }}>
              Дивидендтің <strong style={{ color: color.lossStrong }}>{purificationRate}%</strong> тазарту ұсынылады.
            </div>
          )}
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="Акция саны"
            style={{ width: "100%", height: size.buttonHeight, padding: `0 ${space.md}px`, borderRadius: radius.md, background: color.surfaceInput, border: `1px solid ${color.border}`, color: color.textPrimary, fontFamily: font.family, fontSize: font.sm, outline: "none", marginBottom: space.sm, boxSizing: "border-box" }}
          />
          {totalValue > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", background: color.surfaceAlt, padding: space.md, borderRadius: radius.md }}>
              <div>
                <div style={{ fontSize: font.xs, color: color.textMuted }}>Құны</div>
                <div style={{ fontSize: font.md, fontWeight: font.bold }}>{currency === "KZT" ? "₸" + totalValue.toLocaleString() : "$" + totalValue.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: font.xs, color: color.gainStrong }}>Зекет (2.5%)</div>
                <div style={{ fontSize: font.lg, fontWeight: font.bold, color: color.gainStrong }}>
                  {currency === "KZT" ? "₸" + zakatAmount.toLocaleString() : "$" + zakatAmount.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const [overview, setOverview] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewUpdatedAt, setOverviewUpdatedAt] = useState(null);

  const [session, setSession] = useState(null);
  const [watchlistSymbols, setWatchlistSymbols] = useState([]);

  const [currency, setCurrency] = useState("USD");
  const [usdkzt, setUsdkzt] = useState(500);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((d) => {
        if (d && d.rates && d.rates.KZT) setUsdkzt(d.rates.KZT);
      })
      .catch(() => {});
    supabase.auth.getSession().then(({ data }) => setSession(data ? data.session : null));
  }, []);

  useEffect(() => {
    async function loadWatchlist() {
      if (!session || !session.user) {
        setWatchlistSymbols([]);
        return;
      }
      const { data: rows } = await supabase.from("watchlist").select("symbol");
      if (rows) setWatchlistSymbols(rows.map((r) => r.symbol));
    }
    loadWatchlist();
  }, [session]);

  async function toggleWatchlist(symbol) {
    if (!session || !session.user || !symbol) return;
    if (watchlistSymbols.includes(symbol)) {
      await supabase.from("watchlist").delete().eq("user_id", session.user.id).eq("symbol", symbol);
      setWatchlistSymbols((prev) => prev.filter((s) => s !== symbol));
    } else {
      await supabase.from("watchlist").insert({ user_id: session.user.id, symbol });
      setWatchlistSymbols((prev) => [...prev, symbol]);
    }
  }

  /* ---------- QQQ, SPY — әр 60 секунд сайын ---------- */
  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      if (typeof document !== "undefined" && document.hidden) return;
      const results = await Promise.all(
        OVERVIEW_SYMBOLS.map(async (item) => {
          try {
            const res = await fetch(`/api/stock?symbol=${item.symbol}`);
            const json = await res.json();
            if (!res.ok) return { ...item, error: true };
            return { ...item, ...json };
          } catch (err) {
            return { ...item, error: true };
          }
        })
      );
      if (cancelled) return;
      setOverview(results);
      setOverviewLoading(false);
      setOverviewUpdatedAt(Date.now());
    }

    loadOverview();
    const timer = setInterval(loadOverview, OVERVIEW_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  function loadFromOverview(symbol) {
    setTicker(symbol);
    searchStock(null, symbol);
  }

  async function getAiSummary(stockData) {
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockData),
      });
      const json = await res.json();
      if (res.ok && json.summary) setSummary(json.summary);
      else setSummaryError(json.error || "Мәлімет табылмады.");
    } catch (err) {
      setSummaryError("Желі қатесі.");
    }
    setSummaryLoading(false);
  }

  async function searchStock(e, sym) {
    if (e && e.preventDefault) e.preventDefault();
    const symbol = (sym || ticker).trim().toUpperCase();
    if (!symbol) return;
    setLoading(true);
    setError("");
    setData(null);
    setSummary("");
    setSummaryError("");
    try {
      const res = await fetch(`/api/stock?symbol=${symbol}`);
      const json = await res.json();
      if (!res.ok) setError(json.error || "Қате");
      else setData(json);
    } catch (err) {
      setError("Байланыс қатесі");
    } finally {
      setLoading(false);
    }
  }

  async function sendChatMessage(e) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    const newMessages = [...chatMessages, { role: "user", text }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    setChatError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, stockContext: data }),
      });
      const json = await res.json();
      if (!res.ok || json.error) setChatError(json.error || "Қате шықты");
      else setChatMessages([...newMessages, { role: "assistant", text: json.reply }]);
    } catch (err) {
      setChatError("Желі қатесі");
    } finally {
      setChatLoading(false);
    }
  }

  const isUp = data && data.change >= 0;
  let sentimentScore = 50;
  if (data) {
    if (data.technicals && data.technicals.rsi) sentimentScore = Math.min(100, Math.max(0, Math.round(data.technicals.rsi)));
    else if (data.changePercent) sentimentScore = data.changePercent > 0 ? 65 : 35;
  }

  const fundItem = (label, value, key) => {
    const ev = evaluateFundamental(key, value);
    const shown = safeNum(value, 2);
    return (
      <div style={statBox}>
        <div style={{ fontSize: font.xs, color: color.textMuted, marginBottom: 6 }}>{label}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: space.sm }}>
          <span style={{ fontSize: font.lg, fontWeight: font.semibold }}>
            {shown !== "—" ? (key === "PM" || key === "ROE" ? shown + "%" : shown) : "—"}
          </span>
          {shown !== "—" && <span style={{ fontSize: font.xs, fontWeight: font.semibold, color: ev.color }}>{ev.text}</span>}
        </div>
      </div>
    );
  };

  return (
    <main style={{ minHeight: "100vh", background: color.bg, color: color.textPrimary, fontFamily: font.family, paddingBottom: 140 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        html, body { background: ${color.bg}; margin: 0; padding: 0; overflow-x: hidden; }
        * { box-sizing: border-box; }
        .tq-shell { margin-left: 0; }
        @media (min-width: 1024px) { .tq-shell { margin-left: ${size.sidebarWidth}px; } }
        .tq-ov-card { transition: border-color ${motion.fast}; }
        .tq-ov-card:hover { border-color: ${color.borderActive}; }
        .tq-search:focus-within { border-color: ${color.accent} !important; }
      `}</style>

      <NavMenu />

      <div className="tq-shell" style={{ maxWidth: 520, margin: "0 auto", padding: `0 ${space.lg}px` }}>
        <Header overview={overview} />

        <div style={{ paddingTop: space.xl }}>
          {/* ---------- БРЕНД ---------- */}
          <div style={{ textAlign: "center", marginBottom: space.xl }}>
            <div style={{ fontSize: 28, fontWeight: font.bold, letterSpacing: 0.5 }}>
              Trade<span style={{ color: color.accent }}>IQ</span>
            </div>
            <div style={{ fontSize: font.xs, letterSpacing: "1.5px", color: color.accentText, marginTop: 4 }}>AI-POWERED TRADING</div>
          </div>

          {/* ---------- ІЗДЕУ ---------- */}
          <form
            onSubmit={searchStock}
            className="tq-search"
            style={{ display: "flex", alignItems: "center", gap: space.sm, height: size.inputHeight, padding: `0 ${space.xs}px 0 ${space.lg}px`, background: color.surfaceInput, border: `1px solid ${color.border}`, borderRadius: radius.xl, marginBottom: space.xxl }}
          >
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="Тикер жазыңыз (мыс. AAPL)"
              style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: color.textPrimary, fontFamily: font.family, fontSize: font.md }}
            />
            <Button type="submit" style={{ height: 38 }}>
              Іздеу
            </Button>
          </form>

          {/* ---------- НАРЫҚ ШОЛУЫ ---------- */}
          <div style={{ marginBottom: space.xxl }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.sm }}>
              <div style={{ fontSize: font.lg, fontWeight: font.semibold }}>Нарық шолуы</div>
              <div style={{ display: "flex", background: color.surfaceInput, borderRadius: radius.md, padding: 3, border: `1px solid ${color.border}` }}>
                {["USD", "KZT"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    style={{ height: 28, padding: "0 12px", borderRadius: radius.sm, border: "none", background: currency === c ? color.accentStrong : "transparent", color: currency === c ? color.textOnAccent : color.textMuted, fontSize: font.xs, fontWeight: font.semibold, fontFamily: font.family, cursor: "pointer" }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: font.xs, color: color.textMuted, marginBottom: space.lg }}>
              {overviewUpdatedAt ? `Соңғы жаңарту: ${fmtUpdated(overviewUpdatedAt)}` : "Жаңарту күтілуде..."}
              {" · "}Деректер ~минут кешігуі мүмкін; нарық жабық болса соңғы жабылу бағасы көрсетіледі.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space.md }}>
              {overviewLoading ? (
                <div style={{ color: color.textMuted, fontSize: font.sm, padding: space.lg }}>Жүктелуде...</div>
              ) : (
                overview.map((item) => {
                  const up = item.change >= 0;
                  const tone = changeColor(item.change);
                  return (
                    <Card
                      as="button"
                      key={item.symbol}
                      onClick={() => loadFromOverview(item.symbol)}
                      className="tq-ov-card"
                      padding={space.lg}
                      style={{ textAlign: "left", cursor: "pointer", color: color.textPrimary, fontFamily: font.family, minHeight: 140, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}
                    >
                      <div style={{ position: "relative", zIndex: 2 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: space.sm }}>
                          <span style={{ background: color.accentSoft, color: color.accentText, fontSize: font.xs, fontWeight: font.bold, padding: "3px 8px", borderRadius: radius.sm }}>{item.symbol}</span>
                          <span style={{ color: color.textSecondary, fontSize: font.sm, fontWeight: font.medium }}>{item.label}</span>
                        </div>
                        {!item.error ? (
                          <div style={{ marginTop: space.lg }}>
                            <div style={{ fontSize: 22, fontWeight: font.bold }}>{fmtCurr(item.currentPrice, currency, usdkzt)}</div>
                            <div style={{ color: tone, fontSize: font.sm, marginTop: 4, fontWeight: font.semibold }}>
                              {up ? "▲" : "▼"} {safeNum(item.changePercent, 2)}%
                            </div>
                          </div>
                        ) : (
                          <div style={{ marginTop: space.lg, color: color.textMuted, fontSize: font.sm }}>Деректер жоқ</div>
                        )}
                      </div>
                      {!item.error && item.history && item.history.length > 1 && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 44, opacity: 0.8 }}>
                          <Sparkline history={item.history} isUp={up} height={44} />
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {loading && <p style={{ color: color.accentText, textAlign: "center", fontSize: font.sm }}>Мәліметтер ізделуде...</p>}
          {error && <p style={{ color: color.lossStrong, textAlign: "center", fontSize: font.sm }}>{error}</p>}

          {/* ---------- ТАҢДАЛҒАН АКЦИЯ ---------- */}
          {data && (
            <Card padding={space.xl} style={{ marginBottom: space.xxl }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space.lg }}>
                <div style={{ display: "flex", alignItems: "center", gap: space.md }}>
                  {data.logo ? (
                    <img src={data.logo} alt="" style={{ width: 44, height: 44, borderRadius: radius.lg }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: radius.lg, background: color.accentSoft, color: color.accentText, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: font.bold }}>
                      {data.symbol ? data.symbol.slice(0, 2) : ""}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: font.xl, fontWeight: font.bold }}>{data.symbol}</div>
                    <div style={{ color: color.textMuted, fontSize: font.sm, marginTop: 2 }}>{data.name}</div>
                  </div>
                </div>
                {session && session.user && (
                  <button
                    type="button"
                    onClick={() => toggleWatchlist(data.symbol)}
                    aria-label="Таңдаулыларға қосу"
                    style={{ background: "transparent", border: "none", fontSize: 26, cursor: "pointer", color: watchlistSymbols.includes(data.symbol) ? color.neutral : color.textMuted }}
                  >
                    {watchlistSymbols.includes(data.symbol) ? "★" : "☆"}
                  </button>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: space.sm, marginBottom: space.lg }}>
                <span style={{ fontSize: 30, fontWeight: font.bold }}>{fmtCurr(data.currentPrice, currency, usdkzt)}</span>
                <span style={{ fontSize: font.md, color: isUp ? color.gain : color.loss, fontWeight: font.semibold }}>
                  {isUp ? "▲" : "▼"} {fmtCurr(Math.abs(data.change), currency, usdkzt)} ({safeNum(data.changePercent, 2)}%)
                </span>
              </div>

              <AiPsychologist data={data} />
              <SentimentMeter score={sentimentScore} />

              {Array.isArray(data.chartData) && data.chartData.length > 1 ? (
                <div style={{ height: 200, marginBottom: space.lg, borderRadius: radius.lg, overflow: "hidden", border: `1px solid ${color.borderSoft}` }}>
                  <ProChart
                    chartData={data.chartData.map((d) => ({
                      ...d,
                      open: d.open * (currency === "KZT" ? usdkzt : 1),
                      high: d.high * (currency === "KZT" ? usdkzt : 1),
                      low: d.low * (currency === "KZT" ? usdkzt : 1),
                      close: d.close * (currency === "KZT" ? usdkzt : 1),
                      ema20: d.ema20 * (currency === "KZT" ? usdkzt : 1),
                      ema50: d.ema50 * (currency === "KZT" ? usdkzt : 1),
                    }))}
                  />
                </div>
              ) : (
                data.history &&
                data.history.length > 1 && (
                  <div style={{ height: 90, marginBottom: space.lg, borderRadius: radius.lg, overflow: "hidden", border: `1px solid ${color.borderSoft}` }}>
                    <Sparkline history={data.history} isUp={isUp} height={90} />
                  </div>
                )
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space.md, ...statBox, marginBottom: space.xl, fontSize: font.sm, color: color.textMuted }}>
                <div>Ашылу: <span style={{ color: color.textPrimary, fontWeight: font.semibold }}>{fmtCurr(data.open, currency, usdkzt)}</span></div>
                <div>Алдыңғы жабылу: <span style={{ color: color.textPrimary, fontWeight: font.semibold }}>{fmtCurr(data.previousClose, currency, usdkzt)}</span></div>
                <div>Макс: <span style={{ color: color.textPrimary, fontWeight: font.semibold }}>{fmtCurr(data.high, currency, usdkzt)}</span></div>
                <div>Мин: <span style={{ color: color.textPrimary, fontWeight: font.semibold }}>{fmtCurr(data.low, currency, usdkzt)}</span></div>
              </div>

              {data.fundamentals && (
                <div style={{ marginBottom: space.xl }}>
                  <div style={sectionTitle}>Фундаменталды талдау</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: space.sm, marginBottom: space.md }}>
                    <div style={{ ...statBox, textAlign: "center" }}>
                      <div style={{ fontSize: font.xs, color: color.textMuted }}>Нарық құны</div>
                      <div style={{ fontSize: font.sm, fontWeight: font.semibold, marginTop: 4 }}>{fmtMarketCap(data.marketCap, currency, usdkzt)}</div>
                    </div>
                    <div style={{ ...statBox, textAlign: "center" }}>
                      <div style={{ fontSize: font.xs, color: color.textMuted }}>EPS</div>
                      <div style={{ fontSize: font.sm, fontWeight: font.semibold, marginTop: 4 }}>{fmtCurr(data.fundamentals.eps, currency, usdkzt)}</div>
                    </div>
                    <div style={{ ...statBox, textAlign: "center" }}>
                      <div style={{ fontSize: font.xs, color: color.textMuted }}>Дивиденд</div>
                      <div style={{ fontSize: font.sm, fontWeight: font.semibold, marginTop: 4 }}>
                        {data.fundamentals.dividendYield ? safeNum(data.fundamentals.dividendYield, 2) + "%" : "—"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space.sm }}>
                    {fundItem("P/E", data.fundamentals.peRatio, "PE")}
                    {fundItem("Қарыз / капитал", data.fundamentals.debtToEquity, "DE")}
                    {fundItem("Өтімділік", data.fundamentals.currentRatio, "CR")}
                    {fundItem("ROE", data.fundamentals.roe, "ROE")}
                    {fundItem("Таза маржа", data.fundamentals.profitMargin, "PM")}
                    {fundItem("P/B", data.fundamentals.pbRatio, "PB")}
                  </div>
                </div>
              )}

              {data.technicals && data.technicals.rsi && (
                <div style={{ marginBottom: space.xl }}>
                  <div style={sectionTitle}>Техникалық талдау</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space.md, ...statBox, fontSize: font.sm }}>
                    <div>RSI: <span style={{ color: data.technicals.rsi > 70 ? color.lossStrong : data.technicals.rsi < 30 ? color.gainStrong : color.textPrimary, fontWeight: font.bold }}>{safeNum(data.technicals.rsi, 2)}</span></div>
                    <div>MACD: <span style={{ color: data.technicals.macd > 0 ? color.gainStrong : color.lossStrong, fontWeight: font.bold }}>{safeNum(data.technicals.macd, 2)}</span></div>
                    <div>SMA 20: <span style={{ fontWeight: font.bold }}>{fmtCurr(data.technicals.sma20, currency, usdkzt)}</span></div>
                    <div>SMA 50: <span style={{ fontWeight: font.bold }}>{fmtCurr(data.technicals.sma50, currency, usdkzt)}</span></div>
                  </div>
                </div>
              )}

              {/* ---------- AI ТОЛЫҚ ТАЛДАУ ---------- */}
              <Card padding={space.lg} style={{ marginBottom: space.xl, borderColor: color.borderActive, background: color.accentSoft }}>
                <div style={{ fontSize: font.md, fontWeight: font.semibold, color: color.accentText, marginBottom: space.sm }}>AI толық талдау</div>
                {summaryLoading ? (
                  <div style={{ color: color.textMuted, fontSize: font.sm }}>AI мәліметтерді оқып, сараптама жасауда...</div>
                ) : summary ? (
                  <div style={{ color: color.textSecondary, fontSize: font.sm, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{summary}</div>
                ) : (
                  <div>
                    <p style={{ color: color.textMuted, fontSize: font.sm, margin: `0 0 ${space.md}px` }}>
                      Акцияның техникалық және фундаменталды жағдайына AI арқылы толық талдау жасау.
                    </p>
                    {summaryError && <p style={{ color: color.lossStrong, fontSize: font.sm, margin: `0 0 ${space.md}px` }}>{summaryError}</p>}
                    <Button fullWidth onClick={() => getAiSummary(data)}>
                      Талдауды бастау
                    </Button>
                  </div>
                )}
              </Card>

              {data.tradePlan && data.tradePlan.entry && (
                <Card padding={space.lg} style={{ marginBottom: space.xl }}>
                  <div style={sectionTitle}>Суинг-трейдинг жоспары</div>
                  {[
                    ["Кіру", fmtCurr(data.tradePlan.entry, currency, usdkzt), color.textPrimary],
                    ["Пайда алу (TP1)", fmtCurr(data.tradePlan.takeProfit1, currency, usdkzt), color.gainStrong],
                    ["Шығынды шектеу (SL)", fmtCurr(data.tradePlan.stopLoss, currency, usdkzt), color.lossStrong],
                  ].map(([label, value, tone]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: `${space.sm}px 0`, borderBottom: `1px solid ${color.borderSoft}`, fontSize: font.sm }}>
                      <span style={{ color: color.textMuted }}>{label}</span>
                      <span style={{ color: tone, fontWeight: font.bold }}>{value}</span>
                    </div>
                  ))}
                </Card>
              )}

              <HalalCard halal={data.halal} currentPrice={data.currentPrice} currency={currency} usdkzt={usdkzt} />
            </Card>
          )}
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
