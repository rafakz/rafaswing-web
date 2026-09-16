"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import NavMenu from "./NavMenu";
import Header from "./Header";
import ProChart from "./ProChart";
import { supabase } from "./supabaseClient";
import {
  getSignal,
  SIGNAL_COLOR_KEY,
  generateSmartAlerts,
  calculatePositionSize,
} from "../lib/tradeiq-engine";

/* ---------- Токендер ---------- */
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

const DONUT_COLORS = [
  colors.gold,
  colors.gain,
  "#6C8EEF",
  "#B07CE8",
  colors.loss,
  colors.goldBright,
  "#4FA9C7",
  "#E89B4C",
];

const SCREENER_FILTERS = [
  { key: "all", label: "Барлық нарық", query: "" },
  { key: "pe", label: "P/E < 20", query: "maxPE=20" },
  { key: "roe", label: "ROE > 15%", query: "minROE=15" },
];

const AI_SUGGESTIONS = [
  "AAPL акциясына талдау жаса",
  "Нарық жағдайы қалай?",
  "Swing trading бойынша кеңес бер",
];

const OVERVIEW_SYMBOLS = [
  { symbol: "ONEQ", label: "NASDAQ" },
  { symbol: "QQQ", label: "QQQ" },
  { symbol: "SPY", label: "SPX" },
  { symbol: "QQQM", label: "NDX" },
];

const fontDisplay = "'Georgia', 'Times New Roman', serif";
const fontBody = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontMono = "'SF Mono', 'Consolas', 'Menlo', monospace";

/* ---------- Компоненттер ---------- */
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

function IconSparkleChat({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5l1.3 4.2 4.2 1.3-4.2 1.3-1.3 4.2-1.3-4.2-4.2-1.3 4.2-1.3L12 3.5z" />
      <path d="M18.5 15l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9z" />
    </svg>
  );
}

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

function PortfolioDonut({ slices, size = 110, strokeWidth = 16 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let cumulativePercent = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.bg} strokeWidth={strokeWidth} />
      {total > 0
        ? slices.map((s, i) => {
            const percent = s.value / total;
            const dashArray = `${percent * circumference} ${circumference}`;
            const dashOffset = -cumulativePercent * circumference;
            cumulativePercent += percent;
            return (
              <circle
                key={s.symbol + i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })
        : null}
    </svg>
  );
}

function formatNewsDate(unixSeconds) {
  if (!unixSeconds || typeof unixSeconds !== "number") return "";
  try {
    return new Date(unixSeconds * 1000).toLocaleDateString("kk-KZ", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch (e) {
    return "";
  }
}

function safeNum(v, digits = 2) {
  if (typeof v !== "number" || isNaN(v)) return "—";
  return v.toFixed(digits);
}

/* ---------- Негізгі Бет ---------- */
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
  const [watchlistQuotes, setWatchlistQuotes] = useState([]);
  const [watchlistQuotesLoading, setWatchlistQuotesLoading] = useState(false);

  const [holdings, setHoldings] = useState([]);
  const [holdingsLiveData, setHoldingsLiveData] = useState({});
  const [holdingsLoading, setHoldingsLoading] = useState(false);

  const [screenerResults, setScreenerResults] = useState([]);
  const [screenerLoading, setScreenerLoading] = useState(true);
  const [screenerFilter, setScreenerFilter] = useState("all");

  const [alertPrice, setAlertPrice] = useState("");
  const [alertDirection, setAlertDirection] = useState("above");
  const [alertSubmitting, setAlertSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const [riskCapital, setRiskCapital] = useState("");
  const [riskPercent, setRiskPercent] = useState("2");

  /* Supabase Auth Listener */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data?.session ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  /* Watchlist сақтау/оқу */
  useEffect(() => {
    let cancelled = false;
    async function loadWatchlist() {
      if (!session?.user) {
        setWatchlistSymbols([]);
        return;
      }
      const { data: rows } = await supabase.from("watchlist").select("symbol");
      if (!cancelled && rows) {
        setWatchlistSymbols(rows.map((r) => r.symbol));
      }
    }
    loadWatchlist();
    return () => { cancelled = true; };
  }, [session]);

  /* Watchlist багаларын алу (Оңтайландырылған Promise.allSettled) */
  useEffect(() => {
    let cancelled = false;
    async function loadWatchlistQuotes() {
      if (!watchlistSymbols.length) {
        setWatchlistQuotes([]);
        return;
      }
      setWatchlistQuotesLoading(true);
      
      const results = await Promise.allSettled(
        watchlistSymbols.map(async (sym) => {
          const res = await fetch(`/api/stock?symbol=${encodeURIComponent(sym)}`);
          if (!res.ok) throw new Error();
          return { symbol: sym, ...(await res.json()) };
        })
      );

      if (!cancelled) {
        const formatted = results.map((res, idx) =>
          res.status === "fulfilled"
            ? res.value
            : { symbol: watchlistSymbols[idx], error: true }
        );
        setWatchlistQuotes(formatted);
        setWatchlistQuotesLoading(false);
      }
    }
    loadWatchlistQuotes();
    return () => { cancelled = true; };
  }, [watchlistSymbols]);

  /* Сток іздеу функциясы (useCallback) */
  const searchStock = useCallback(async (e, symbolOverride) => {
    if (e && e.preventDefault) e.preventDefault();
    const raw = symbolOverride || ticker;
    if (!raw?.trim()) return;

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
        setError(json?.error || "Қате шықты");
      } else {
        setData(json);
      }
    } catch {
      setError("Байланыс қатесі");
    } finally {
      setLoading(false);
    }

    setNewsLoading(true);
    try {
      const newsRes = await fetch(`/api/news?symbol=${symbol}`);
      const newsJson = await newsRes.json();
      if (newsRes.ok && Array.isArray(newsJson?.news)) {
        setNews(newsJson.news);
      }
    } catch {
      // үнсіз қалдыру
    } finally {
      setNewsLoading(false);
    }
  }, [ticker]);

  const loadFromOverview = useCallback((symbol) => {
    setTicker(symbol);
    searchStock(null, symbol);
  }, [searchStock]);

  /* URL параметрлерін оқу */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const symbolParam = params.get("symbol");
    if (symbolParam) {
      loadFromOverview(symbolParam.toUpperCase());
    }
  }, [loadFromOverview]);

  /* Есептеулерді useMemo-ға жинау */
  const isUp = useMemo(() => !!(data && typeof data.change === "number" && data.change >= 0), [data]);
  const signal = useMemo(() => (data ? getSignal(data.technicals, data.currentPrice) : null), [data]);

  const smartAlerts = useMemo(() => {
    if (!data) return [];
    return generateSmartAlerts({
      technicals: data.technicals,
      volumeInfo: data.volume,
      currentPrice: data.currentPrice,
      signal,
    });
  }, [data, signal]);

  const { portfolioTotalValue, portfolioTotalCost, portfolioTotalGain, portfolioTotalGainPercent, donutSlices } = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    
    holdings.forEach((h) => {
      const live = holdingsLiveData[h.symbol];
      const price = live && typeof live.currentPrice === "number" ? live.currentPrice : h.avg_price;
      totalValue += price * h.shares;
      totalCost += h.avg_price * h.shares;
    });

    const gain = totalValue - totalCost;
    const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;

    const slices = holdings.map((h, i) => {
      const live = holdingsLiveData[h.symbol];
      const price = live && typeof live.currentPrice === "number" ? live.currentPrice : h.avg_price;
      return {
        symbol: h.symbol,
        value: price * h.shares,
        color: DONUT_COLORS[i % DONUT_COLORS.length],
      };
    });

    return {
      portfolioTotalValue: totalValue,
      portfolioTotalCost: totalCost,
      portfolioTotalGain: gain,
      portfolioTotalGainPercent: gainPercent,
      donutSlices: slices,
    };
  }, [holdings, holdingsLiveData]);

  return (
    <main style={{ minHeight: "100vh", background: colors.bg, color: colors.textPrimary, fontFamily: fontBody }}>
      <NavMenu />
      <div className="tradeiq-content-shell">
        <Header overview={overview} />
        {/* JSX Қалған UI Бөлігі Сонда Қалады */}
      </div>
    </main>
  );
}
