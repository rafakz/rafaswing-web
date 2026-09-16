"use client";

import { useState, useEffect } from "react";
import NavMenu from "./NavMenu";
import ProChart from "./ProChart";
import { supabase } from "./supabaseClient";
import {
  getSignal,
  SIGNAL_COLOR_KEY,
  generateSmartAlerts,
  calculatePositionSize,
} from "../lib/tradeiq-engine";

/* ---------- ДИЗАЙН ---------- */

const colors = {
  bg: "#070B16",
  card: "#0D1428",
  border: "#1D3157",
  gold: "#D4AF37",
  goldBright: "#F0D477",
  textPrimary: "#F5F1E6",
  textMuted: "#8A93A6",
  textFaint: "#5B6478",
  gain: "#4FA98B",
  gainBright: "#6FCBA8",
  loss: "#C2542D",
  lossBright: "#E2764C",
  hold: "#D4A24C",
};

const AI_SUGGESTIONS = [
  "AAPL акциясына талдау жаса",
  "Нарық жағдайы қалай?",
  "Swing trading бойынша кеңес бер",
];

const fontDisplay = "'Georgia', 'Times New Roman', serif";
const fontBody =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontMono = "'SF Mono', 'Consolas', 'Menlo', monospace";

/* ---------- ПРЕМИУМ TRADEIQ ЛОГОТИП ---------- */

function PremiumTradeIQLogo() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "760px",
        marginBottom: "26px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "520px",
          padding: "20px 22px 18px",
          borderRadius: "20px",
          overflow: "hidden",
          background:
            "linear-gradient(145deg, #0B1020 0%, #101A32 55%, #080C18 100%)",
          border: "1px solid rgba(212,175,55,.35)",
          boxShadow:
            "0 18px 50px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.04)",
        }}
      >
        {/* алтын жарқырау */}
        <div
          style={{
            position: "absolute",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            background: "rgba(212,175,55,.07)",
            filter: "blur(35px)",
            top: "-120px",
            right: "-50px",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "18px",
          }}
        >
          {/* График + свечалар */}
          <svg
            width="125"
            height="105"
            viewBox="0 0 125 105"
            fill="none"
            style={{ flexShrink: 0 }}
          >
            <defs>
              <linearGradient
                id="goldGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor="#FFF1A8" />
                <stop offset="45%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#8D6915" />
              </linearGradient>

              <linearGradient
                id="greenGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#6FCBA8" />
                <stop offset="100%" stopColor="#267A5D" />
              </linearGradient>

              <linearGradient
                id="redGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#E2764C" />
                <stop offset="100%" stopColor="#8E3021" />
              </linearGradient>

              <filter id="goldGlow">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* фон сызықтары */}
            <path
              d="M5 91H118"
              stroke="#1D3157"
              strokeWidth="1"
            />
            <path
              d="M5 70H118"
              stroke="#142443"
              strokeWidth="1"
            />
            <path
              d="M5 49H118"
              stroke="#142443"
              strokeWidth="1"
            />
            <path
              d="M5 28H118"
              stroke="#142443"
              strokeWidth="1"
            />

            {/* свеча 1 */}
            <line
              x1="18"
              y1="48"
              x2="18"
              y2="78"
              stroke="#4FA98B"
              strokeWidth="2"
            />
            <rect
              x="13"
              y="57"
              width="10"
              height="14"
              rx="2"
              fill="url(#greenGradient)"
            />

            {/* свеча 2 */}
            <line
              x1="39"
              y1="35"
              x2="39"
              y2="70"
              stroke="#E2764C"
              strokeWidth="2"
            />
            <rect
              x="34"
              y="44"
              width="10"
              height="16"
              rx="2"
              fill="url(#redGradient)"
            />

            {/* свеча 3 */}
            <line
              x1="61"
              y1="24"
              x2="61"
              y2="62"
              stroke="#4FA98B"
              strokeWidth="2"
            />
            <rect
              x="56"
              y="31"
              width="10"
              height="20"
              rx="2"
              fill="url(#greenGradient)"
            />

            {/* свеча 4 */}
            <line
              x1="82"
              y1="15"
              x2="82"
              y2="51"
              stroke="#4FA98B"
              strokeWidth="2"
            />
            <rect
              x="77"
              y="22"
              width="10"
              height="19"
              rx="2"
              fill="url(#greenGradient)"
            />

            {/* свеча 5 */}
            <line
              x1="101"
              y1="7"
              x2="101"
              y2="42"
              stroke="#6FCBA8"
              strokeWidth="2"
            />
            <rect
              x="96"
              y="13"
              width="10"
              height="18"
              rx="2"
              fill="url(#greenGradient)"
            />

            {/* алтын бағыт */}
            <path
              d="M8 86 C34 76 48 57 65 48 C80 40 92 28 113 12"
              stroke="url(#goldGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#goldGlow)"
            />

            <path
              d="M103 12 L114 11 L110 22"
              stroke="url(#goldGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#goldGlow)"
            />
          </svg>

          {/* мәтін */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: fontDisplay,
                fontSize: "2.4rem",
                lineHeight: 1,
                fontWeight: 800,
                letterSpacing: "-1px",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  background:
                    "linear-gradient(180deg,#FFFFFF 0%,#B9C1CE 45%,#777F8C 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Trade
              </span>
              <span
                style={{
                  background:
                    "linear-gradient(180deg,#FFF0A0 0%,#D4AF37 50%,#8D6915 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                IQ
              </span>
            </div>

            <div
              style={{
                marginTop: "8px",
                color: colors.goldBright,
                fontSize: "0.62rem",
                letterSpacing: "2px",
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              AI-POWERED TRADING
            </div>

            <div
              style={{
                marginTop: "12px",
                color: colors.textMuted,
                fontSize: "0.58rem",
                letterSpacing: "1.4px",
                whiteSpace: "nowrap",
              }}
            >
              ANALYZE • TRADE • GROW
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            marginTop: "14px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(212,175,55,.16)",
            textAlign: "center",
            color: colors.textFaint,
            fontSize: "0.68rem",
          }}
        >
          Ақылды инвестиция. Нақты талдау.
        </div>
      </div>
    </div>
  );
}

/* ---------- AI ICON ---------- */

function IconSparkleChat({ size = 18, color }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.5l1.3 4.2 4.2 1.3-4.2 1.3-1.3 4.2-1.3-4.2-4.2-1.3 4.2-1.3L12 3.5z" />
      <path d="M18.5 15l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9z" />
    </svg>
  );
}

/* ---------- SPARKLINE ---------- */

function Sparkline({ history, isUp }) {
  if (!Array.isArray(history) || history.length < 2) return null;

  const closes = history
    .map((h) =>
      h && typeof h.close === "number" ? h.close : null
    )
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
    const y =
      padY +
      (1 - (c - min) / range) *
        (height - padY * 2);

    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const lineColor = isUp ? colors.gain : colors.loss;
  const areaPoints =
    `0,${height} ${points.join(" ")} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      style={{ display: "block", marginTop: "14px" }}
    >
      <polygon
        points={areaPoints}
        fill={lineColor}
        opacity="0.08"
      />
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

/* ---------- HELPERS ---------- */

function formatNewsDate(unixSeconds) {
  if (!unixSeconds || typeof unixSeconds !== "number") return "";

  try {
    return new Date(unixSeconds * 1000).toLocaleDateString(
      "kk-KZ",
      {
        day: "2-digit",
        month: "2-digit",
      }
    );
  } catch {
    return "";
  }
}

function safeNum(v, digits) {
  if (typeof v !== "number" || isNaN(v)) return "—";
  return v.toFixed(digits);
}

/* ---------- HOME ---------- */

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

  const [overview, setOverview] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [homeNews, setHomeNews] = useState([]);
  const [homeNewsLoading, setHomeNewsLoading] = useState(true);

  const [session, setSession] = useState(null);
  const [watchlistSymbols, setWatchlistSymbols] =
    useState([]);
  const [watchlistBusy, setWatchlistBusy] =
    useState(false);

  const [alertPrice, setAlertPrice] = useState("");
  const [alertDirection, setAlertDirection] =
    useState("above");
  const [alertSubmitting, setAlertSubmitting] =
    useState(false);
  const [alertMessage, setAlertMessage] =
    useState("");

  const [riskCapital, setRiskCapital] = useState("");
  const [riskPercent, setRiskPercent] =
    useState("2");

  /* ---------- AUTH ---------- */

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data ? data.session : null);
    });

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          setSession(newSession);
        }
      );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  /* ---------- WATCHLIST ---------- */

  useEffect(() => {
    let cancelled = false;

    async function loadWatchlist() {
      if (!session?.user) {
        setWatchlistSymbols([]);
        return;
      }

      const { data: rows } = await supabase
        .from("watchlist")
        .select("symbol");

      if (!cancelled && rows) {
        setWatchlistSymbols(
          rows.map((r) => r.symbol)
        );
      }
    }

    loadWatchlist();

    return () => {
      cancelled = true;
    };
  }, [session]);

  async function toggleWatchlist(symbol) {
    if (!session?.user || !symbol) return;

    setWatchlistBusy(true);

    const inList =
      watchlistSymbols.includes(symbol);

    try {
      if (inList) {
        await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", session.user.id)
          .eq("symbol", symbol);

        setWatchlistSymbols((prev) =>
          prev.filter((s) => s !== symbol)
        );
      } else {
        await supabase
          .from("watchlist")
          .insert({
            user_id: session.user.id,
            symbol,
          });

        setWatchlistSymbols((prev) => [
          ...prev,
          symbol,
        ]);
      }
    } finally {
      setWatchlistBusy(false);
    }
  }

  /* ---------- ALERT ---------- */

  async function createAlert(e) {
    e.preventDefault();
    setAlertMessage("");

    if (!session?.user) {
      setAlertMessage("Алдымен кіру керек");
      return;
    }

    if (!data?.symbol) return;

    const price = parseFloat(alertPrice);

    if (!price || price <= 0) {
      setAlertMessage("Дұрыс баға енгіз");
      return;
    }

    setAlertSubmitting(true);

    try {
      const { error: insertError } =
        await supabase.from("price_alerts").insert({
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
    } catch {
      setAlertMessage("Қате шықты");
    } finally {
      setAlertSubmitting(false);
    }
  }

  /* ---------- HOME NEWS ---------- */

  useEffect(() => {
    let cancelled = false;

    async function loadHomeNews() {
      setHomeNewsLoading(true);

      try {
        const res = await fetch(
          "/api/news?symbol=SPY"
        );
        const json = await res.json();

        if (
          !cancelled &&
          res.ok &&
          Array.isArray(json.news)
        ) {
          setHomeNews(json.news.slice(0, 3));
        }
      } catch {
        // үнсіз
      } finally {
        if (!cancelled) {
          setHomeNewsLoading(false);
        }
      }
    }

    loadHomeNews();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- MARKET OVERVIEW ---------- */

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
            const res = await fetch(
              `/api/stock?symbol=${encodeURIComponent(
                item.symbol
              )}`
            );

            const json = await res.json();

            if (!res.ok) {
              return {
                ...item,
                error: true,
              };
            }

            return {
              ...item,
              ...json,
            };
          } catch {
            return {
              ...item,
              error: true,
            };
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

  /* ---------- SEARCH ---------- */

  async function searchStock(
    e,
    symbolOverride
  ) {
    e.preventDefault();

    const raw =
      symbolOverride || ticker;

    if (!raw || !raw.trim()) return;

    const symbol =
      raw.trim().toUpperCase();

    setLoading(true);
    setError("");
    setData(null);
    setNews([]);
    setAiSummary("");
    setAiError("");
    setChatMessages([]);
    setChatInput("");

    try {
      const res = await fetch(
        `/api/stock?symbol=${symbol}`
      );

      const json = await res.json();

      if (!res.ok) {
        setError(
          json?.error || "Қате шықты"
        );
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
      const newsRes = await fetch(
        `/api/news?symbol=${symbol}`
      );

      const newsJson =
        await newsRes.json();

      if (
        newsRes.ok &&
        Array.isArray(newsJson.news)
      ) {
        setNews(newsJson.news);
      }
    } catch {
      // үнсіз
    } finally {
      setNewsLoading(false);
    }
  }

  function loadFromOverview(symbol) {
    setTicker(symbol);
    searchStock(
      { preventDefault: () => {} },
      symbol
    );
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params =
      new URLSearchParams(
        window.location.search
      );

    const symbolParam =
      params.get("symbol");

    if (symbolParam) {
      loadFromOverview(
        symbolParam.toUpperCase()
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- AI SUMMARY ---------- */

  async function getAiSummary() {
    if (!data) return;

    setAiLoading(true);
    setAiError("");
    setAiSummary("");

    try {
      const signal = getSignal(
        data.technicals,
        data.currentPrice
      );

      const res = await fetch(
        "/api/summary",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            symbol: data.symbol,
            name: data.name,
            currentPrice:
              data.currentPrice,
            changePercent:
              data.changePercent,
            technicals:
              data.technicals,
            fundamentals:
              data.fundamentals,
            swingScore:
              data.swingScore,
            tradePlan:
              data.tradePlan,
            signalLabel:
              signal?.label || "",
          }),
        }
      );

      const json = await res.json();

      if (json?.error) {
        setAiError(
          json.error +
            (json.detail
              ? " — " + json.detail
              : "")
        );
      } else if (json?.summary) {
        setAiSummary(json.summary);
      } else {
        setAiError("Белгісіз жауап");
      }
    } catch {
      setAiError("Байланыс қатесі");
    } finally {
      setAiLoading(false);
    }
  }

  /* ---------- AI CHAT ---------- */

  async function sendChatMessage(
    e,
    textOverride
  ) {
    e.preventDefault();

    const text = (
      textOverride || chatInput
    ).trim();

    if (!text || chatLoading) return;

    const newMessages = [
      ...chatMessages,
      {
        role: "user",
        text,
      },
    ];

    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(
        "/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            messages: newMessages,
            stockContext: data
              ? {
                  symbol: data.symbol,
                  name: data.name,
                  currentPrice:
                    data.currentPrice,
                  technicals:
                    data.technicals,
                  swingScore:
                    data.swingScore,
                  swingScoreBreakdown:
                    data.swingScoreBreakdown,
                  fundamentals:
                    data.fundamentals,
                  tradePlan:
                    data.tradePlan,
                }
              : null,
          }),
        }
      );

      const json = await res.json();

      if (json?.error) {
        setChatMessages([
          ...newMessages,
          {
            role: "assistant",
            text:
              "Қате: " +
              json.error +
              (json.detail
                ? " — " + json.detail
                : ""),
          },
        ]);
      } else if (json?.reply) {
        setChatMessages([
          ...newMessages,
          {
            role: "assistant",
            text: json.reply,
          },
        ]);
      }
    } catch {
      setChatMessages([
        ...newMessages,
        {
          role: "assistant",
          text: "Байланыс қатесі болды.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  /* ---------- DERIVED ---------- */

  const isUp =
    !!data &&
    typeof data.change === "number" &&
    data.change >= 0;

  const signal = data
    ? getSignal(
        data.technicals,
        data.currentPrice
      )
    : null;

  const smartAlerts = data
    ? generateSmartAlerts({
        technicals: data.technicals,
        volumeInfo: data.volume,
        currentPrice:
          data.currentPrice,
        signal,
      })
    : [];

  const hasHistory =
    data &&
    Array.isArray(data.history) &&
    data.history.length > 1;

  const hasTechnicals =
    data &&
    data.technicals &&
    typeof data.technicals === "object";

  const hasNews =
    Array.isArray(news) &&
    news.length > 0;

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
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .tradeiq-card {
          animation: fadeInUp .4s ease-out;
        }

        .tradeiq-news-item {
          transition:
            border-color .15s ease,
            transform .15s ease;
        }

        .tradeiq-news-item:hover {
          border-color: ${colors.gold} !important;
          transform: translateX(2px);
        }

        .tradeiq-search-btn {
          transition:
            filter .15s ease,
            transform .1s ease;
        }

        .tradeiq-search-btn:hover {
          filter: brightness(1.12);
        }

        .tradeiq-search-btn:active {
          transform: scale(.97);
        }

        .tradeiq-overview-card {
          transition:
            transform .15s ease,
            border-color .15s ease;
        }

        .tradeiq-overview-card:hover {
          transform: translateY(-2px);
          border-color: ${colors.gold} !important;
        }

        .tradeiq-input:focus {
          outline: none;
          border-color: ${colors.gold} !important;
        }

        .tradeiq-content-shell {
          margin-left: 0;
        }

        @media (min-width: 1024px) {
          .tradeiq-content-shell {
            margin-left: 240px;
          }
        }
      `}</style>

      <NavMenu />

      <div className="tradeiq-content-shell">
        <div
          style={{
            padding:
              "34px 16px 50px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* ---------- ПРЕМИУМ ЛОГО ---------- */}

          <PremiumTradeIQLogo />

          {/* ---------- ІЗДЕУ ---------- */}

          <form
            onSubmit={searchStock}
            style={{
              display: "flex",
              gap: "8px",
              width: "100%",
              maxWidth: "600px",
            }}
          >
            <input
              className="tradeiq-input"
              value={ticker}
              onChange={(e) =>
                setTicker(e.target.value)
              }
              placeholder="Ticker жаз (мыс. AAPL)"
              style={{
                flex: 1,
                minWidth: 0,
                padding:
                  "13px 15px",
                borderRadius: "11px",
                border:
                  `1px solid ${colors.border}`,
                background:
                  colors.card,
                color:
                  colors.textPrimary,
                fontSize: "0.95rem",
                fontFamily: fontBody,
              }}
            />

            <button
              type="submit"
              className="tradeiq-search-btn"
              style={{
                padding:
                  "13px 22px",
                borderRadius: "11px",
                border: "none",
                background:
                  colors.gold,
                color: colors.bg,
                fontWeight: "800",
                fontSize: "0.95rem",
                fontFamily: fontBody,
                cursor: "pointer",
              }}
            >
              Іздеу
            </button>
          </form>

          {/* ---------- НАРЫҚ ШОЛУЫ ---------- */}

          <div
            style={{
              width: "100%",
              maxWidth: "760px",
              marginTop: "30px",
            }}
          >
            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: "800",
                marginBottom: "12px",
              }}
            >
              Нарық шолуы
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(140px,1fr))",
                gap: "12px",
              }}
            >
              {overviewLoading &&
              overview.length === 0
                ? OVERVIEW_SYMBOLS.map(
                    (item) => (
                      <div
                        key={item.symbol}
                        className="tradeiq-card"
                        style={{
                          background:
                            colors.card,
                          border:
                            `1px solid ${colors.border}`,
                          borderRadius:
                            "14px",
                          padding: "14px",
                          minHeight: "84px",
                        }}
                      >
                        <div
                          style={{
                            color:
                              colors.gold,
                            fontSize:
                              "0.78rem",
                            fontWeight:
                              "700",
                          }}
                        >
                          {item.label}
                        </div>

                        <div
                          style={{
                            color:
                              colors.textFaint,
                            fontSize:
                              "0.75rem",
                            marginTop:
                              "10px",
                          }}
                        >
                          Жүктелуде...
                        </div>
                      </div>
                    )
                  )
                : overview.map(
                    (item) => {
                      const up =
                        typeof item.change ===
                          "number" &&
                        item.change >= 0;

                      return (
                        <button
                          key={
                            item.symbol
                          }
                          onClick={() =>
                            loadFromOverview(
                              item.symbol
                            )
                          }
                          className="tradeiq-card tradeiq-overview-card"
                          style={{
                            textAlign:
                              "left",
                            background:
                              colors.card,
                            border:
                              `1px solid ${colors.border}`,
                            borderRadius:
                              "14px",
                            padding: "14px",
                            cursor:
                              "pointer",
                            fontFamily:
                              fontBody,
                            boxShadow:
                              "0 8px 25px rgba(0,0,0,.28)",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "8px",
                            }}
                          >
                            {item.logo ? (
                              <img
                                src={
                                  item.logo
                                }
                                alt=""
                                width={20}
                                height={20}
                                style={{
                                  borderRadius:
                                    "6px",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius:
                                    "6px",
                                  background:
                                    colors.border,
                                  color:
                                    colors.gold,
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  fontSize:
                                    "0.6rem",
                                  fontWeight:
                                    "bold",
                                }}
                              >
                                {item.label.slice(
                                  0,
                                  2
                                )}
                              </div>
                            )}

                            <div
                              style={{
                                color:
                                  colors.gold,
                                fontSize:
                                  "0.78rem",
                                fontWeight:
                                  "700",
                              }}
                            >
                              {item.label}
                            </div>
                          </div>

                          {item.error ? (
                            <div
                              style={{
                                color:
                                  colors.textFaint,
                                fontSize:
                                  "0.75rem",
                                marginTop:
                                  "10px",
                              }}
                            >
                              Деректер жоқ
                            </div>
                          ) : (
                            <>
                              <div
                                style={{
                                  color:
                                    colors.textPrimary,
                                  fontSize:
                                    "1.05rem",
                                  fontWeight:
                                    "800",
                                  fontFamily:
                                    fontMono,
                                  marginTop:
                                    "8px",
                                }}
                              >
                                {safeNum(
                                  item.currentPrice,
                                  2
                                )}
                              </div>

                              <div
                                style={{
                                  color: up
                                    ? colors.gain
                                    : colors.loss,
                                  fontSize:
                                    "0.78rem",
                                  fontFamily:
                                    fontMono,
                                  marginTop:
                                    "2px",
                                }}
                              >
                                {up
                                  ? "▲"
                                  : "▼"}{" "}
                                {safeNum(
                                  item.changePercent,
                                  2
                                )}
                                %
                              </div>

                              {Array.isArray(
                                item.history
                              ) &&
                              item.history
                                .length >
                                1 ? (
                                <Sparkline
                                  history={
                                    item.history
                                  }
                                  isUp={up}
                                />
                              ) : null}
                            </>
                          )}
                        </button>
                      );
                    }
                  )}
            </div>
          </div>

          {/* ---------- AI ---------- */}

          <div
            style={{
              width: "100%",
              maxWidth: "760px",
              marginTop: "24px",
            }}
          >
            <div
              className="tradeiq-card"
              style={{
                background:
                  colors.card,
                border:
                  `1px solid ${colors.border}`,
                borderRadius: "16px",
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom:
                    "12px",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius:
                      "10px",
                    background:
                      "rgba(212,175,55,.12)",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  <IconSparkleChat
                    size={19}
                    color={
                      colors.gold
                    }
                  />
                </div>

                <div>
                  <div
                    style={{
                      fontSize:
                        "0.92rem",
                      fontWeight:
                        "800",
                    }}
                  >
                    TradeIQ AI
                  </div>

                  <div
                    style={{
                      fontSize:
                        "0.68rem",
                      color:
                        colors.textFaint,
                    }}
                  >
                    Акция, нарық немесе
                    стратегия туралы сұра
                  </div>
                </div>
              </div>

              {chatMessages.length >
              0 ? (
                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap: "8px",
                    maxHeight:
                      "260px",
                    overflowY:
                      "auto",
                    marginBottom:
                      "12px",
                  }}
                >
                  {chatMessages.map(
                    (m, i) => (
                      <div
                        key={i}
                        style={{
                          alignSelf:
                            m.role ===
                            "user"
                              ? "flex-end"
                              : "flex-start",
                          maxWidth:
                            "85%",
                          background:
                            m.role ===
                            "user"
                              ? colors.gold
                              : colors.bg,
                          color:
                            m.role ===
                            "user"
                              ? colors.bg
                              : colors.textPrimary,
                          border:
                            m.role ===
                            "user"
                              ? "none"
                              : `1px solid ${colors.border}`,
                          borderRadius:
                            "10px",
                          padding:
                            "8px 12px",
                          fontSize:
                            "0.82rem",
                          lineHeight:
                            "1.4",
                          whiteSpace:
                            "pre-wrap",
                        }}
                      >
                        {m.text}
                      </div>
                    )
                  )}

                  {chatLoading ? (
                    <div
                      style={{
                        color:
                          colors.textFaint,
                        fontSize:
                          "0.78rem",
                      }}
                    >
                      Жазып жатыр...
                    </div>
                  ) : null}
                </div>
              ) : (
                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap: "8px",
                    marginBottom:
                      "12px",
                  }}
                >
                  {AI_SUGGESTIONS.map(
                    (suggestion) => (
                      <button
                        key={
                          suggestion
                        }
                        onClick={() =>
                          sendChatMessage(
                            {
                              preventDefault:
                                () => {},
                            },
                            suggestion
                          )
                        }
                        className="tradeiq-search-btn"
                        style={{
                          textAlign:
                            "left",
                          padding:
                            "9px 14px",
                          borderRadius:
                            "10px",
                          border:
                            `1px solid ${colors.border}`,
                          background:
                            colors.bg,
                          color:
                            colors.textPrimary,
                          fontSize:
                            "0.8rem",
                          fontFamily:
                            fontBody,
                          cursor:
                            "pointer",
                        }}
                      >
                        {suggestion}
                      </button>
                    )
                  )}
                </div>
              )}

              <form
                onSubmit={
                  sendChatMessage
                }
                style={{
                  display:
                    "flex",
                  gap: "8px",
                }}
              >
                <input
                  className="tradeiq-input"
                  value={chatInput}
                  onChange={(e) =>
                    setChatInput(
                      e.target.value
                    )
                  }
                  placeholder="Сұрағыңызды жазыңыз..."
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding:
                      "10px 12px",
                    borderRadius:
                      "10px",
                    border:
                      `1px solid ${colors.border}`,
                    background:
                      colors.bg,
                    color:
                      colors.textPrimary,
                    fontSize:
                      "0.85rem",
                    fontFamily:
                      fontBody,
                  }}
                />

                <button
                  type="submit"
                  disabled={
                    chatLoading
                  }
                  className="tradeiq-search-btn"
                  style={{
                    padding:
                      "10px 16px",
                    borderRadius:
                      "10px",
                    border: "none",
                    background:
                      colors.gold,
                    color:
                      colors.bg,
                    fontWeight:
                      "800",
                    fontSize:
                      "0.85rem",
                    cursor:
                      "pointer",
                    flexShrink: 0,
                  }}
                >
                  Жіберу
                </button>
              </form>
            </div>
          </div>

          {loading && (
            <p
              style={{
                marginTop:
                  "24px",
                color:
                  colors.textMuted,
              }}
            >
              Жүктелуде...
            </p>
          )}

          {error ? (
            <p
              style={{
                marginTop:
                  "24px",
                color:
                  colors.lossBright,
              }}
            >
              {error}
            </p>
          ) : null}

          {/* ---------- STOCK ANALYSIS ---------- */}

          {data ? (
            <div
              className="tradeiq-card"
              style={{
                marginTop:
                  "26px",
                width: "100%",
                maxWidth:
                  "760px",
                background:
                  colors.card,
                borderRadius:
                  "18px",
                padding: "20px",
                border:
                  `1px solid ${colors.border}`,
              }}
            >
              {/* header */}

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "10px",
                  }}
                >
                  {data.logo ? (
                    <img
                      src={
                        data.logo
                      }
                      alt=""
                      width={40}
                      height={40}
                      style={{
                        borderRadius:
                          "9px",
                      }}
                    />
                  ) : null}

                  <div>
                    <div
                      style={{
                        fontWeight:
                          "800",
                        fontSize:
                          "1.15rem",
                        fontFamily:
                          fontMono,
                      }}
                    >
                      {data.symbol ||
                        "—"}
                    </div>

                    <div
                      style={{
                        color:
                          colors.textMuted,
                        fontSize:
                          "0.82rem",
                      }}
                    >
                      {data.name ||
                        ""}
                    </div>
                  </div>
                </div>

                {session?.user &&
                data.symbol ? (
                  <button
                    onClick={() =>
                      toggleWatchlist(
                        data.symbol
                      )
                    }
                    disabled={
                      watchlistBusy
                    }
                    style={{
                      background:
                        "transparent",
                      border:
                        "none",
                      fontSize:
                        "1.6rem",
                      cursor:
                        "pointer",
                      color:
                        watchlistSymbols.includes(
                          data.symbol
                        )
                          ? colors.gold
                          : colors.textFaint,
                    }}
                  >
                    {watchlistSymbols.includes(
                      data.symbol
                    )
                      ? "★"
                      : "☆"}
                  </button>
                ) : null}
              </div>

              {/* alert */}

              {session?.user &&
              data.symbol ? (
                <form
                  onSubmit={
                    createAlert
                  }
                  style={{
                    marginTop:
                      "14px",
                    display:
                      "flex",
                    gap: "8px",
                    flexWrap:
                      "wrap",
                    alignItems:
                      "center",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "0.76rem",
                      color:
                        colors.textFaint,
                    }}
                  >
                    🔔 Дабыл:
                  </span>

                  <select
                    value={
                      alertDirection
                    }
                    onChange={(e) =>
                      setAlertDirection(
                        e.target
                          .value
                      )
                    }
                    style={{
                      padding:
                        "6px 8px",
                      borderRadius:
                        "8px",
                      border:
                        `1px solid ${colors.border}`,
                      background:
                        colors.bg,
                      color:
                        colors.textPrimary,
                    }}
                  >
                    <option value="above">
                      жоғары болса
                    </option>
                    <option value="below">
                      төмен болса
                    </option>
                  </select>

                  <input
                    value={
                      alertPrice
                    }
                    onChange={(e) =>
                      setAlertPrice(
                        e.target
                          .value
                      )
                    }
                    placeholder="Баға ($)"
                    type="number"
                    step="any"
                    style={{
                      width:
                        "100px",
                      padding:
                        "6px 8px",
                      borderRadius:
                        "8px",
                      border:
                        `1px solid ${colors.border}`,
                      background:
                        colors.bg,
                      color:
                        colors.textPrimary,
                    }}
                  />

                  <button
                    type="submit"
                    disabled={
                      alertSubmitting
                    }
                    style={{
                      padding:
                        "6px 14px",
                      borderRadius:
                        "8px",
                      border:
                        "none",
                      background:
                        colors.gold,
                      color:
                        colors.bg,
                      fontWeight:
                        "800",
                      cursor:
                        "pointer",
                    }}
                  >
                    Қою
                  </button>

                  {alertMessage ? (
                    <span
                      style={{
                        fontSize:
                          "0.72rem",
                        color:
                          colors.textFaint,
                      }}
                    >
                      {
                        alertMessage
                      }
                    </span>
                  ) : null}
                </form>
              ) : null}

              {/* price */}

              <div
                style={{
                  marginTop:
                    "18px",
                  display:
                    "flex",
                  alignItems:
                    "baseline",
                  gap: "10px",
                  flexWrap:
                    "wrap",
                  fontFamily:
                    fontMono,
                }}
              >
                <span
                  style={{
                    fontSize:
                      "2rem",
                    fontWeight:
                      "800",
                  }}
                >
                  $
                  {safeNum(
                    data.currentPrice,
                    2
                  )}
                </span>

                <span
                  style={{
                    fontSize:
                      "0.95rem",
                    color: isUp
                      ? colors.gain
                      : colors.loss,
                  }}
                >
                  {isUp
                    ? "▲"
                    : "▼"}{" "}
                  {safeNum(
                    data.change,
                    2
                  )}{" "}
                  (
                  {safeNum(
                    data.changePercent,
                    2
                  )}
                  %)
                </span>
              </div>

              {/* chart */}

              {Array.isArray(
                data.chartData
              ) &&
              data.chartData.length >
                1 ? (
                <div
                  style={{
                    marginTop:
                      "12px",
                  }}
                >
                  <ProChart
                    chartData={
                      data.chartData
                    }
                    pivot={
                      data.pivot
                    }
                    tradePlan={
                      data.tradePlan
                    }
                    colors={
                      colors
                    }
                  />
                </div>
              ) : hasHistory ? (
                <>
                  <Sparkline
                    history={
                      data.history
                    }
                    isUp={isUp}
                  />

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      fontSize:
                        "0.68rem",
                      color:
                        colors.textFaint,
                      fontFamily:
                        fontMono,
                    }}
                  >
                    <span>
                      {
                        data
                          .history
                          .length
                      }{" "}
                      күн
                    </span>
                    <span>
                      соңғы баға
                      үрдісі
                    </span>
                  </div>
                </>
              ) : null}

              {/* basic */}

              <div
                style={{
                  marginTop:
                    "18px",
                  display:
                    "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: "10px",
                  fontSize:
                    "0.82rem",
                  color:
                    colors.textMuted,
                  fontFamily:
                    fontMono,
                }}
              >
                <div>
                  Ашылу: $
                  {safeNum(
                    data.open,
                    2
                  )}
                </div>
                <div>
                  Жабылу: $
                  {safeNum(
                    data.previousClose,
                    2
                  )}
                </div>
                <div>
                  Максимум: $
                  {safeNum(
                    data.high,
                    2
                  )}
                </div>
                <div>
                  Минимум: $
                  {safeNum(
                    data.low,
                    2
                  )}
                </div>

                {typeof data.marketCap ===
                "number" ? (
                  <div>
                    Market Cap: $
                    {data.marketCap.toFixed(
                      0
                    )}
                    M
                  </div>
                ) : null}

                {data.industry ? (
                  <div
                    style={{
                      fontFamily:
                        fontBody,
                    }}
                  >
                    Сала:{" "}
                    {
                      data.industry
                    }
                  </div>
                ) : null}
              </div>

              {/* fundamentals */}

              {data.fundamentals &&
              typeof data.fundamentals ===
                "object" ? (
                <div
                  style={{
                    marginTop:
                      "22px",
                    paddingTop:
                      "16px",
                    borderTop:
                      `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "0.8rem",
                      fontWeight:
                        "800",
                      marginBottom:
                        "12px",
                      color:
                        colors.gold,
                      textTransform:
                        "uppercase",
                    }}
                  >
                    Фундаменталды
                    көрсеткіштер
                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap: "10px",
                      fontSize:
                        "0.82rem",
                      color:
                        colors.textMuted,
                      fontFamily:
                        fontMono,
                    }}
                  >
                    <div>
                      P/E:{" "}
                      {safeNum(
                        data
                          .fundamentals
                          .pe,
                        2
                      )}
                    </div>

                    <div>
                      EPS: $
                      {safeNum(
                        data
                          .fundamentals
                          .eps,
                        2
                      )}
                    </div>

                    <div>
                      ROE:{" "}
                      {safeNum(
                        data
                          .fundamentals
                          .roe,
                        1
                      )}
                      %
                    </div>

                    <div>
                      Таза маржа:{" "}
                      {safeNum(
                        data
                          .fundamentals
                          .netMargin,
                        1
                      )}
                      %
                    </div>

                    <div>
                      Кіріс өсімі:{" "}
                      {safeNum(
                        data
                          .fundamentals
                          .revenueGrowth,
                        1
                      )}
                      %
                    </div>

                    <div>
                      EPS өсімі:{" "}
                      {safeNum(
                        data
                          .fundamentals
                          .epsGrowth,
                        1
                      )}
                      %
                    </div>

                    <div>
                      Дивиденд:{" "}
                      {safeNum(
                        data
                          .fundamentals
                          .dividendYield,
                        2
                      )}
                      %
                    </div>

                    <div>
                      Beta:{" "}
                      {safeNum(
                        data
                          .fundamentals
                          .beta,
                        2
                      )}
                    </div>

                    <div>
                      52 апта макс: $
                      {safeNum(
                        data
                          .fundamentals
                          .week52High,
                        2
                      )}
                    </div>

                    <div>
                      52 апта мин: $
                      {safeNum(
                        data
                          .fundamentals
                          .week52Low,
                        2
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* earnings */}

              {data.earnings &&
              (data.earnings.nextDate ||
                data.earnings.lastDate) ? (
                <div
                  style={{
                    marginTop:
                      "16px",
                    fontSize:
                      "0.82rem",
                    color:
                      colors.textMuted,
                    fontFamily:
                      fontMono,
                  }}
                >
                  {data.earnings
                    .nextDate ? (
                    <div
                      style={{
                        color:
                          colors.hold,
                        fontWeight:
                          "800",
                      }}
                    >
                      ⚠ Алдағы есеп:{" "}
                      {
                        data.earnings
                          .nextDate
                      }
                    </div>
                  ) : null}

                  {data.earnings
                    .lastDate &&
                  typeof data
                    .earnings
                    .lastEpsActual ===
                    "number" &&
                  typeof data
                    .earnings
                    .lastEpsEstimate ===
                    "number" ? (
                    <div
                      style={{
                        marginTop:
                          "5px",
                      }}
                    >
                      Соңғы есеп (
                      {
                        data.earnings
                          .lastDate
                      }
                      ): факт $
                      {data.earnings.lastEpsActual.toFixed(
                        2
                      )}{" "}
                      / болжам $
                      {data.earnings.lastEpsEstimate.toFixed(
                        2
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* technical */}

              {hasTechnicals ? (
                <div
                  style={{
                    marginTop:
                      "22px",
                    paddingTop:
                      "16px",
                    borderTop:
                      `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "0.8rem",
                      fontWeight:
                        "800",
                      marginBottom:
                        "12px",
                      color:
                        colors.gold,
                      textTransform:
                        "uppercase",
                    }}
                  >
                    Техникалық
                    анализ
                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap: "10px",
                      fontSize:
                        "0.82rem",
                      color:
                        colors.textMuted,
                      fontFamily:
                        fontMono,
                    }}
                  >
                    <div>
                      RSI (14):{" "}
                      <strong
                        style={{
                          color:
                            typeof data
                              .technicals
                              .rsi ===
                              "number" &&
                            data
                              .technicals
                              .rsi >
                              70
                              ? colors.loss
                              : typeof data
                                  .technicals
                                  .rsi ===
                                "number" &&
                                data
                                  .technicals
                                  .rsi <
                                  30
                              ? colors.gain
                              : colors.textPrimary,
                        }}
                      >
                        {safeNum(
                          data.technicals
                            .rsi,
                          2
                        )}
                      </strong>
                    </div>

                    <div>
                      MACD:{" "}
                      <strong
                        style={{
                          color:
                            typeof data
                              .technicals
                              .macd ===
                              "number" &&
                            data
                              .technicals
                              .macd >
                              0
                              ? colors.gain
                              : colors.loss,
                        }}
                      >
                        {safeNum(
                          data.technicals
                            .macd,
                          2
                        )}
                      </strong>
                    </div>

                    <div>
                      SMA20: $
                      {safeNum(
                        data.technicals
                          .sma20,
                        2
                      )}
                    </div>

                    <div>
                      SMA50: $
                      {safeNum(
                        data.technicals
                          .sma50,
                        2
                      )}
                    </div>

                    {typeof data
                      .technicals
                      .ema20 ===
                      "number" ||
                    typeof data
                      .technicals
                      .ema50 ===
                      "number" ||
                    typeof data
                      .technicals
                      .ema200 ===
                      "number" ? (
                      <>
                        <div>
                          EMA20: $
                          {safeNum(
                            data
                              .technicals
                              .ema20,
                            2
                          )}
                        </div>

                        <div>
                          EMA50: $
                          {safeNum(
                            data
                              .technicals
                              .ema50,
                            2
                          )}
                        </div>

                        <div>
                          EMA200: $
                          {safeNum(
                            data
                              .technicals
                              .ema200,
                            2
                          )}
                        </div>
                      </>
                    ) : null}

                    {data.volume &&
                    typeof data.volume ===
                      "object" ? (
                      <div
                        style={{
                          gridColumn:
                            "1 / -1",
                        }}
                      >
                        Volume:{" "}
                        <strong>
                          {typeof data
                            .volume
                            .latest ===
                          "number"
                            ? (
                                data
                                  .volume
                                  .latest /
                                1e6
                              ).toFixed(
                                2
                              ) +
                              "M"
                            : "—"}
                        </strong>

                        {typeof data
                          .volume
                          .ratio ===
                        "number"
                          ? ` (орташадан ${data.volume.ratio}×)`
                          : ""}
                      </div>
                    ) : null}
                  </div>

                  {signal ? (
                    <div
                      style={{
                        marginTop:
                          "14px",
                        padding:
                          "13px 14px",
                        borderRadius:
                          "11px",
                        background:
                          colors.bg,
                        border:
                          `1px solid ${
                            colors[
                              SIGNAL_COLOR_KEY[
                                signal.level
                              ]
                            ]
                          }`,
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            "0.9rem",
                          fontWeight:
                            "800",
                          color:
                            colors[
                              SIGNAL_COLOR_KEY[
                                signal.level
                              ]
                            ],
                          marginBottom:
                            "6px",
                          fontFamily:
                            fontMono,
                        }}
                      >
                        Сигнал:{" "}
                        {
                          signal.label
                        }
                      </div>

                      <ul
                        style={{
                          margin: 0,
                          paddingLeft:
                            "18px",
                          fontSize:
                            "0.77rem",
                          color:
                            colors.textMuted,
                        }}
                      >
                        {signal.reasons.map(
                          (r, i) => (
                            <li key={i}>
                              {r}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* smart alerts */}

              {smartAlerts.length >
              0 ? (
                <div
                  style={{
                    marginTop:
                      "16px",
                    padding:
                      "14px",
                    borderRadius:
                      "12px",
                    background:
                      colors.bg,
                    border:
                      `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "0.78rem",
                      fontWeight:
                        "800",
                      color:
                        colors.gold,
                      marginBottom:
                        "9px",
                    }}
                  >
                    🚨 Smart Alerts
                  </div>

                  {smartAlerts.map(
                    (a, i) => {
                      const dotColor =
                        a.level ===
                        "bullish"
                          ? colors.gain
                          : a.level ===
                            "bearish"
                          ? colors.loss
                          : colors.textMuted;

                      return (
                        <div
                          key={i}
                          style={{
                            display:
                              "flex",
                            gap: "8px",
                            fontSize:
                              "0.78rem",
                            marginTop:
                              "6px",
                          }}
                        >
                          <span
                            style={{
                              color:
                                dotColor,
                            }}
                          >
                            ●
                          </span>
                          <span
                            style={{
                              color:
                                colors.textMuted,
                            }}
                          >
                            {a.text}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : null}

              {/* sentiment */}

              {data.sentiment &&
              typeof data.sentiment ===
                "object" &&
              typeof data.sentiment
                .bullishPercent ===
                "number" ? (
                <div
                  style={{
                    marginTop:
                      "16px",
                    fontSize:
                      "0.82rem",
                    fontFamily:
                      fontMono,
                  }}
                >
                  Sentiment:{" "}
                  <span
                    style={{
                      color:
                        colors.gain,
                      fontWeight:
                        "800",
                    }}
                  >
                    ▲{" "}
                    {
                      data.sentiment
                        .bullishPercent
                    }
                    %
                  </span>{" "}
                  <span
                    style={{
                      color:
                        colors.loss,
                      fontWeight:
                        "800",
                    }}
                  >
                    ▼{" "}
                    {
                      data.sentiment
                        .bearishPercent
                    }
                    %
                  </span>
                </div>
              ) : null}

              {/* swing score */}

              {typeof data.swingScore ===
              "number" ? (
                <div
                  style={{
                    marginTop:
                      "18px",
                    padding:
                      "15px",
                    borderRadius:
                      "11px",
                    background:
                      colors.bg,
                    border:
                      `1px solid ${colors.border}`,
                    textAlign:
                      "center",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "0.7rem",
                      color:
                        colors.textFaint,
                      letterSpacing:
                        "1px",
                    }}
                  >
                    SWING SCORE
                  </div>

                  <div
                    style={{
                      marginTop:
                        "4px",
                      fontSize:
                        "2.3rem",
                      fontWeight:
                        "900",
                      fontFamily:
                        fontMono,
                      color:
                        data.swingScore >=
                        65
                          ? colors.gain
                          : data.swingScore <=
                            35
                          ? colors.loss
                          : colors.hold,
                    }}
                  >
                    {
                      data.swingScore
                    }
                    <span
                      style={{
                        fontSize:
                          "0.9rem",
                        color:
                          colors.textFaint,
                      }}
                    >
                      {" "}
                      /100
                    </span>
                  </div>
                </div>
              ) : null}

              {/* trade plan */}

              {data.tradePlan &&
              typeof data.tradePlan ===
                "object" ? (
                <div
                  style={{
                    marginTop:
                      "18px",
                    paddingTop:
                      "16px",
                    borderTop:
                      `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "0.8rem",
                      fontWeight:
                        "800",
                      color:
                        colors.gold,
                      marginBottom:
                        "12px",
                    }}
                  >
                    Сауда жоспары
                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap: "10px",
                      fontSize:
                        "0.82rem",
                      fontFamily:
                        fontMono,
                    }}
                  >
                    <div>
                      Entry: $
                      {safeNum(
                        data.tradePlan
                          .entry,
                        2
                      )}
                    </div>

                    <div
                      style={{
                        color:
                          colors.loss,
                      }}
                    >
                      Stop Loss: $
                      {safeNum(
                        data.tradePlan
                          .stopLoss,
                        2
                      )}
                    </div>

                    <div
                      style={{
                        color:
                          colors.gain,
                      }}
                    >
                      TP1: $
                      {safeNum(
                        data.tradePlan
                          .takeProfit1,
                        2
                      )}
                    </div>

                    <div
                      style={{
                        color:
                          colors.gainBright,
                      }}
                    >
                      TP2: $
                      {safeNum(
                        data.tradePlan
                          .takeProfit2,
                        2
                      )}
                    </div>
                  </div>

                  {typeof data
                    .tradePlan
                    .riskReward ===
                  "number" ? (
                    <div
                      style={{
                        marginTop:
                          "8px",
                        fontSize:
                          "0.76rem",
                        color:
                          colors.textFaint,
                        fontFamily:
                          fontMono,
                      }}
                    >
                      Risk/Reward:
                      {" "}
                      1:
                      {
                        data
                          .tradePlan
                          .riskReward
                      }
                    </div>
                  ) : null}

                  {/* position size */}

                  <div
                    style={{
                      marginTop:
                        "16px",
                      paddingTop:
                        "14px",
                      borderTop:
                        `1px solid ${colors.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          "0.75rem",
                        fontWeight:
                          "800",
                        color:
                          colors.gold,
                        marginBottom:
                          "10px",
                      }}
                    >
                      💰 Позиция көлемі
                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        gap: "8px",
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <input
                        value={
                          riskCapital
                        }
                        onChange={(e) =>
                          setRiskCapital(
                            e.target
                              .value
                          )
                        }
                        placeholder="Капитал ($)"
                        type="number"
                        step="any"
                        style={{
                          flex:
                            "1 1 120px",
                          padding:
                            "8px 10px",
                          borderRadius:
                            "8px",
                          border:
                            `1px solid ${colors.border}`,
                          background:
                            colors.bg,
                          color:
                            colors.textPrimary,
                        }}
                      />

                      <input
                        value={
                          riskPercent
                        }
                        onChange={(e) =>
                          setRiskPercent(
                            e.target
                              .value
                          )
                        }
                        placeholder="Тәуекел %"
                        type="number"
                        step="any"
                        style={{
                          flex:
                            "1 1 100px",
                          padding:
                            "8px 10px",
                          borderRadius:
                            "8px",
                          border:
                            `1px solid ${colors.border}`,
                          background:
                            colors.bg,
                          color:
                            colors.textPrimary,
                        }}
                      />
                    </div>

                    {(() => {
                      const cap =
                        parseFloat(
                          riskCapital
                        );
                      const risk =
                        parseFloat(
                          riskPercent
                        );

                      const sizing =
                        cap > 0 &&
                        risk > 0
                          ? calculatePositionSize(
                              {
                                capital:
                                  cap,
                                riskPercent:
                                  risk,
                                entry:
                                  data
                                    .tradePlan
                                    .entry,
                                stopLoss:
                                  data
                                    .tradePlan
                                    .stopLoss,
                              }
                            )
                          : null;

                      if (!riskCapital) {
                        return (
                          <p
                            style={{
                              color:
                                colors.textFaint,
                              fontSize:
                                "0.75rem",
                              marginTop:
                                "10px",
                            }}
                          >
                            Капиталыңды
                            енгізсең,
                            позиция
                            көлемін
                            есептеймін.
                          </p>
                        );
                      }

                      if (!sizing) {
                        return (
                          <p
                            style={{
                              color:
                                colors.loss,
                              fontSize:
                                "0.75rem",
                              marginTop:
                                "10px",
                            }}
                          >
                            Есептеу
                            мүмкін
                            болмады.
                          </p>
                        );
                      }

                      return (
                        <div
                          style={{
                            display:
                              "grid",
                           
