"use client";

import { useState, useEffect } from "react";
import NavMenu from "../NavMenu";
import Header from "../Header";
import FloatingChat from "../FloatingChat";
import { SIGNAL_COLOR_KEY } from "../../lib/tradeiq-engine";

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

const fontBody = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontMono = "'SF Mono', 'Roboto Mono', monospace";

function safeNum(v, digits) {
  return typeof v === "number" && !isNaN(v) ? v.toFixed(digits) : "—";
}

export default function AiScreenerPage() {
  const [overview, setOverview] = useState([]);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const [candidates, setCandidates] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    async function loadCandidates() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/ai-screener?limit=10");
        const json = await res.json();
        if (!res.ok || json.error) {
          setError(json.error || "Белгісіз қате");
        } else {
          setCandidates(json.candidates || []);
          setMeta({ scannedCount: json.scannedCount, skippedCount: json.skippedCount });
        }
      } catch (err) {
        setError("Желі қатесі");
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, []);

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
        .tradeiq-candidate-row:hover { background: rgba(212,175,55,0.06); }
      `}</style>

      <NavMenu />

      <div className="tradeiq-content-shell">
        <Header overview={overview} />

        <div style={{ padding: "32px 24px", maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "6px" }}>
            AI Screener
          </h1>
          <p style={{ color: colors.textFaint, fontSize: "0.82rem", marginBottom: "8px" }}>
            Swing Score бойынша сұрыпталған күнделікті үздік candidate-тар
          </p>
          <p style={{ color: colors.textFaint, fontSize: "0.72rem", marginBottom: "24px" }}>
            Қаржы секторынан тыс ~22 танымал тикер сканерленеді, нәтиже күніне бір рет жаңарады.
          </p>

          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: "16px",
              overflowX: "auto",
            }}
          >
            <div style={{ minWidth: "560px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 90px 130px 90px 90px 90px",
                  padding: "12px 18px",
                  fontSize: "0.68rem",
                  color: colors.textFaint,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <span>Тикер</span>
                <span>Score</span>
                <span>Сигнал</span>
                <span>Entry</span>
                <span>Stop</span>
                <span>TP1</span>
              </div>

              {loading ? (
                <div style={{ padding: "24px 18px", color: colors.textFaint, fontSize: "0.85rem" }}>
                  Сканерленуде... (алғашқы жүктелу біраз уақыт алуы мүмкін)
                </div>
              ) : error ? (
                <div style={{ padding: "24px 18px", color: colors.loss, fontSize: "0.85rem" }}>{error}</div>
              ) : candidates.length === 0 ? (
                <div style={{ padding: "24px 18px", color: colors.textFaint, fontSize: "0.85rem" }}>
                  Candidate табылмады
                </div>
              ) : (
                candidates.map((c) => {
                  const up = typeof c.changePercent === "number" && c.changePercent >= 0;
                  return (
                    <a
                      key={c.symbol}
                      href={`/?symbol=${encodeURIComponent(c.symbol)}`}
                      className="tradeiq-candidate-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 90px 130px 90px 90px 90px",
                        padding: "14px 18px",
                        fontSize: "0.82rem",
                        fontFamily: fontMono,
                        borderBottom: `1px solid ${colors.border}`,
                        alignItems: "center",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <span style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: colors.textPrimary, fontWeight: "700" }}>{c.symbol}</span>
                        <span style={{ color: up ? colors.gain : colors.loss, fontSize: "0.7rem" }}>
                          {up ? "▲" : "▼"} {safeNum(c.changePercent, 2)}%
                        </span>
                      </span>
                      <span style={{ color: colors.goldBright, fontWeight: "700" }}>
                        {typeof c.swingScore === "number" ? `${c.swingScore}/100` : "—"}
                      </span>
                      <span
                        style={{
                          color: c.signal ? colors[SIGNAL_COLOR_KEY[c.signal.level]] : colors.textFaint,
                          fontSize: "0.68rem",
                          fontWeight: "600",
                        }}
                      >
                        {c.signal ? c.signal.label : "—"}
                      </span>
                      <span style={{ color: colors.textMuted }}>
                        {c.tradePlan ? `$${safeNum(c.tradePlan.entry, 2)}` : "—"}
                      </span>
                      <span style={{ color: colors.loss }}>
                        {c.tradePlan ? `$${safeNum(c.tradePlan.stopLoss, 2)}` : "—"}
                      </span>
                      <span style={{ color: colors.gain }}>
                        {c.tradePlan ? `$${safeNum(c.tradePlan.takeProfit1, 2)}` : "—"}
                      </span>
                    </a>
                  );
                })
              )}
            </div>
          </div>

          {meta ? (
            <p style={{ color: colors.textFaint, fontSize: "0.68rem", marginTop: "12px" }}>
              Сканерленді: {meta.scannedCount}, өткізілді: {meta.skippedCount}
            </p>
          ) : null}
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
