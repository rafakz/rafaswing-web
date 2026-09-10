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

function safeNum(v, digits) {
  return typeof v === "number" && !isNaN(v) ? v.toFixed(digits) : "—";
}

const OVERVIEW_SYMBOLS = [
  { symbol: "ONEQ", label: "NASDAQ" },
  { symbol: "QQQ", label: "QQQ" },
  { symbol: "SPY", label: "SPX" },
  { symbol: "QQQM", label: "NDX" },
];

export default function MarketsPage() {
  const [overview, setOverview] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [sectors, setSectors] = useState([]);
  const [sectorsLoading, setSectorsLoading] = useState(true);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    async function loadOverview() {
      setOverviewLoading(true);
      try {
        const results = await Promise.all(
          OVERVIEW_SYMBOLS.map(async (item) => {
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
      } finally {
        setOverviewLoading(false);
      }
    }
    loadOverview();
  }, []);

  useEffect(() => {
    async function loadSectors() {
      setSectorsLoading(true);
      try {
        const res = await fetch("/api/sectors");
        const json = await res.json();
        if (res.ok && Array.isArray(json.sectors)) {
          setSectors(json.sectors);
        }
      } catch {
        // үнсіз
      } finally {
        setSectorsLoading(false);
      }
    }
    loadSectors();
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
      `}</style>

      <NavMenu />

      <div className="tradeiq-content-shell">
        <Header overview={overview} />

        <div style={{ padding: "32px 24px", maxWidth: "760px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "6px" }}>
            Нарықтар
          </h1>
          <p style={{ color: colors.textFaint, fontSize: "0.82rem", marginBottom: "24px" }}>
            Индекстер мен секторлардың жалпы жағдайы
          </p>

          {/* ---- Индекстер ---- */}
          <div style={{ marginBottom: "12px", fontSize: "0.85rem", fontWeight: "bold" }}>
            Индекстер
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
              marginBottom: "28px",
            }}
          >
            {overviewLoading && overview.length === 0 ? (
              <div style={{ color: colors.textFaint, fontSize: "0.8rem" }}>Жүктелуде...</div>
            ) : (
              overview.map((item) => {
                const up = typeof item.change === "number" && item.change >= 0;
                return (
                  <a
                    key={item.symbol}
                    href={`/?symbol=${encodeURIComponent(item.symbol)}`}
                    style={{
                      textDecoration: "none",
                      background: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "14px",
                      padding: "14px",
                    }}
                  >
                    <div style={{ color: colors.gold, fontSize: "0.78rem", fontWeight: "600" }}>{item.label}</div>
                    {item.error ? (
                      <div style={{ color: colors.textFaint, fontSize: "0.78rem", marginTop: "10px" }}>
                        Деректер жоқ
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            color: colors.textPrimary,
                            fontSize: "1.05rem",
                            fontWeight: "bold",
                            fontFamily: fontMono,
                            marginTop: "6px",
                          }}
                        >
                          {safeNum(item.currentPrice, 2)}
                        </div>
                        <div
                          style={{
                            color: up ? colors.gain : colors.loss,
                            fontSize: "0.8rem",
                            fontFamily: fontMono,
                            marginTop: "2px",
                          }}
                        >
                          {up ? "▲" : "▼"} {safeNum(item.changePercent, 2)}%
                        </div>
                      </>
                    )}
                  </a>
                );
              })
            )}
          </div>

          {/* ---- Секторлар ---- */}
          <div style={{ marginBottom: "12px", fontSize: "0.85rem", fontWeight: "bold" }}>
            Секторлар — ақша қай жаққа құйылып жатыр
          </div>
          {sectorsLoading && sectors.length === 0 ? (
            <div style={{ color: colors.textFaint, fontSize: "0.8rem" }}>Жүктелуде...</div>
          ) : sectors.length === 0 ? (
            <div style={{ color: colors.textFaint, fontSize: "0.8rem" }}>Сектор деректері жоқ</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {sectors.map((s) => {
                const up = typeof s.changePercent === "number" && s.changePercent >= 0;
                const magnitude = Math.min(Math.abs(s.changePercent || 0) / 2, 1);
                return (
                  <div
                    key={s.symbol}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "0.78rem",
                      fontFamily: fontMono,
                    }}
                  >
                    <span style={{ width: "150px", color: colors.textMuted, flexShrink: 0 }}>{s.label}</span>
                    <div
                      style={{
                        flex: 1,
                        height: "16px",
                        background: colors.card,
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(4, magnitude * 100)}%`,
                          height: "100%",
                          background: up ? colors.gain : colors.loss,
                          opacity: 0.75,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        width: "56px",
                        textAlign: "right",
                        color: up ? colors.gain : colors.loss,
                        fontWeight: "600",
                        flexShrink: 0,
                      }}
                    >
                      {up ? "▲" : "▼"} {safeNum(Math.abs(s.changePercent), 2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <p style={{ color: colors.textFaint, fontSize: "0.65rem", marginTop: "8px" }}>
            Бүгінгі % өзгеріс бойынша сектор ETF-тері салыстырылады (қаржы секторы қосылмаған).
          </p>
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
