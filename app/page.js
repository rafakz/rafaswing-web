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
    if (e && e.preventDefault) e.preventDefault();

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
        setAiError(json.error);
      } else {
        setAiSummary(json.summary || json.text || "");
      }
    } catch {
      setAiError("AI жүктеу кезінде қате орын алды");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        color: colors.textPrimary,
        minHeight: "100vh",
        fontFamily: fontBody,
        paddingBottom: "40px",
      }}
    >
      <NavMenu session={session} />

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <PremiumTradeIQLogo />

        {/* Search Bar */}
        <form
          onSubmit={(e) => searchStock(e)}
          style={{
            display: "flex",
            gap: "10px",
            width: "100%",
            maxWidth: "520px",
            marginBottom: "24px",
          }}
        >
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="Тикер енгізіңіз (мысалы: AAPL, TSLA)"
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: "12px",
              background: colors.card,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
              fontSize: "0.95rem",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              background: colors.gold,
              color: colors.bg,
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            {loading ? "Іздеу..." : "Талдау"}
          </button>
        </form>

        {error && (
          <div
            style={{
              color: colors.loss,
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Stock Details */}
        {data && (
          <div
            style={{
              width: "100%",
              maxWidth: "760px",
              background: colors.card,
              borderRadius: "16px",
              padding: "24px",
              border: `1px solid ${colors.border}`,
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.5rem", margin: 0 }}>
                  {data.name} ({data.symbol})
                </h2>
                <div
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: "bold",
                    marginTop: "4px",
                  }}
                >
                  ${safeNum(data.currentPrice, 2)}
                </div>
              </div>

              {session?.user && (
                <button
                  onClick={() => toggleWatchlist(data.symbol)}
                  disabled={watchlistBusy}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: watchlistSymbols.includes(data.symbol)
                      ? colors.loss
                      : colors.gain,
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {watchlistSymbols.includes(data.symbol)
                    ? "Тізімнен өшіру"
                    : "+ Тізімге қосу"}
                </button>
              )}
            </div>

            {/* AI Summary Section */}
            <div
              style={{
                marginTop: "20px",
                paddingTop: "20px",
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <button
                onClick={getAiSummary}
                disabled={aiLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  background: colors.goldBright,
                  color: colors.bg,
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                <IconSparkleChat size={18} color={colors.bg} />
                {aiLoading ? "AI талдауда..." : "AI Талдауын алу"}
              </button>

              {aiError && (
                <p style={{ color: colors.loss, marginTop: "10px" }}>
                  {aiError}
                </p>
              )}

              {aiSummary && (
                <div
                  style={{
                    marginTop: "14px",
                    padding: "14px",
                    background: colors.bg,
                    borderRadius: "10px",
                    border: `1px solid ${colors.border}`,
                    whiteSpace: "pre-line",
                    lineHeight: "1.5",
                  }}
                >
                  {aiSummary}
                </div>
              )}
            </div>

            {/* Pro Chart */}
            <div style={{ marginTop: "24px" }}>
              <ProChart symbol={data.symbol} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
