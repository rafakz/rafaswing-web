"use client";

import { useState, useEffect } from "react";
import NavMenu from "../NavMenu";
import Header from "../Header";
import FloatingChat from "../FloatingChat";

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
  loss: "#C2542D",
};

const fontBody = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontMono = "'SF Mono', 'Roboto Mono', monospace";

const SCREENER_FILTERS = [
  { key: "all", label: "Барлық нарық", query: "" },
  { key: "pe", label: "P/E < 20", query: "maxPE=20" },
  { key: "roe", label: "ROE > 15%", query: "minROE=15" },
];

export default function ScreenerPage() {
  const [overview, setOverview] = useState([]);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const [screenerResults, setScreenerResults] = useState([]);
  const [screenerLoading, setScreenerLoading] = useState(true);
  const [screenerFilter, setScreenerFilter] = useState("all");

  useEffect(() => {
    async function loadOverview() {
      try {
        const symbols = [
          { symbol: "ONEQ", label: "NASDAQ" },
          { symbol: "QQQ", label: "QQQ" },
          { symbol: "SPY", label: "SPX" },
          { symbol: "QQQM", label: "NDX" },
        ];
        const results = await Promise.all(
          symbols.map(async (item) => {
            try {
              const res = await fetch(`/api/stock?symbol=${encodeURIComponent(item.symbol)}`);
              const json = await res.json();
              if (!res.ok) return { ...item, error: true };
              return { ...item, ...json };
            } catch {
              return { ...item, error: true };
            }
          })
        );
        setOverview(results);
      } catch {
        // үнсіз
      }
    }
    loadOverview();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadScreener() {
      setScreenerLoading(true);
      const active = SCREENER_FILTERS.find((f) => f.key === screenerFilter);
      const qs = active && active.query ? "?" + active.query : "";
      try {
        const res = await fetch("/api/screener" + qs);
        const json = await res.json();
        if (!cancelled && res.ok && Array.isArray(json.results)) {
          setScreenerResults(json.results);
        }
      } catch {
        // үнсіз
      } finally {
        if (!cancelled) setScreenerLoading(false);
      }
    }

    loadScreener();
    return () => {
      cancelled = true;
    };
  }, [screenerFilter]);

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
        body: JSON.stringify({ messages: newMessages }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setChatError(json.error || "Белгісіз қате");
      } else {
        setChatMessages([...newMessages, { role: "assistant", text: json.reply }]);
      }
    } catch (err) {
      setChatError("Желі қатесі");
    } finally {
      setChatLoading(false);
    }
  }

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
        .tradeiq-content-shell { margin-left: 0; }
        @media (min-width: 1024px) {
          .tradeiq-content-shell { margin-left: 240px; }
        }
        .tradeiq-filter-btn { transition: filter 0.15s ease; }
        .tradeiq-filter-btn:hover { filter: brightness(1.1); }
        .tradeiq-row:hover { background: rgba(212,175,55,0.06); }
      `}</style>

      <NavMenu />

      <div className="tradeiq-content-shell">
        <Header overview={overview} />

        <div style={{ padding: "32px 24px", maxWidth: "900px", margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "1.4rem",
              fontWeight: "bold",
              marginBottom: "6px",
              color: colors.textPrimary,
            }}
          >
            Скринер
          </h1>
          <p style={{ color: colors.textFaint, fontSize: "0.82rem", marginBottom: "24px" }}>
            Қаржылық көрсеткіштер бойынша акцияларды сүзгілеу
          </p>

          {/* ---- Фильтрлер ---- */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "22px", flexWrap: "wrap" }}>
            {SCREENER_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setScreenerFilter(f.key)}
                className="tradeiq-filter-btn"
                style={{
                  fontSize: "0.8rem",
                  color: screenerFilter === f.key ? colors.bg : colors.textMuted,
                  background: screenerFilter === f.key ? colors.gold : "transparent",
                  border: `1px solid ${screenerFilter === f.key ? colors.gold : colors.border}`,
                  borderRadius: "10px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontWeight: screenerFilter === f.key ? "700" : "400",
                  fontFamily: fontBody,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* ---- Кесте ---- */}
          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 90px 90px 110px",
                padding: "12px 18px",
                fontSize: "0.7rem",
                color: colors.textFaint,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <span>Тикер</span>
              <span>P/E</span>
              <span>ROE</span>
              <span style={{ textAlign: "right" }}>Өзгеріс</span>
            </div>

            {screenerLoading && screenerResults.length === 0 ? (
              <div style={{ padding: "24px 18px", color: colors.textFaint, fontSize: "0.85rem" }}>
                Жүктелуде...
              </div>
            ) : screenerResults.length === 0 ? (
              <div style={{ padding: "24px 18px", color: colors.textFaint, fontSize: "0.85rem" }}>
                Сәйкес акция табылмады
              </div>
            ) : (
              screenerResults.map((r) => {
                const up = typeof r.changePercent === "number" && r.changePercent >= 0;
                return (
                  <div
                    key={r.symbol}
                    className="tradeiq-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 90px 90px 110px",
                      padding: "14px 18px",
                      fontSize: "0.85rem",
                      fontFamily: fontMono,
                      borderBottom: `1px solid ${colors.border}`,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ color: colors.textPrimary, fontWeight: "600" }}>{r.symbol}</span>
                    <span style={{ color: colors.textMuted }}>
                      {typeof r.pe === "number" ? r.pe.toFixed(1) : "—"}
                    </span>
                    <span style={{ color: colors.textMuted }}>
                      {typeof r.roe === "number" ? (r.roe * 100).toFixed(1) + "%" : "—"}
                    </span>
                    <span
                      style={{
                        textAlign: "right",
                        color: up ? colors.gain : colors.loss,
                        fontWeight: "600",
                      }}
                    >
                      {typeof r.changePercent === "number"
                        ? `${up ? "▲" : "▼"} ${r.changePercent.toFixed(2)}%`
                        : "—"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
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
