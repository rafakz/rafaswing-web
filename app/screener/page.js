"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  hold: "#D4A24C",
};

const fontBody = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontMono = "'SF Mono', 'Roboto Mono', monospace";

// Сүзгілер бірге жұмыс істейді (мыс. Халал скрин + ROE > 15%).
// Ештеңе таңдалмаса — "Барлық нарық".
const SCREENER_FILTERS = [
  { key: "pe", label: "P/E < 20", query: "maxPE=20" },
  { key: "roe", label: "ROE > 15%", query: "minROE=15" },
  { key: "halal", label: "Халал скрин", query: "halal=pass" },
];

const HALAL_PILL = {
  pass: { text: "Сәйкес", color: colors.gain, mark: "✓" },
  doubtful: { text: "Күмәнді", color: colors.hold, mark: "!" },
  fail: { text: "Сәйкес емес", color: colors.loss, mark: "✕" },
  unknown: { text: "Деректер жоқ", color: colors.textFaint, mark: "?" },
};

/* ---------- Халал скрин белгісі (тикердің астында) ---------- */
function HalalPill({ halal }) {
  if (!halal || !halal.status) return null;
  const p = HALAL_PILL[halal.status] || HALAL_PILL.unknown;
  return (
    <span
      style={{
        display: "inline-block",
        maxWidth: "100%",
        boxSizing: "border-box",
        marginTop: "5px",
        fontSize: "0.6rem",
        lineHeight: "1.3",
        fontFamily: fontBody,
        fontWeight: "700",
        color: p.color,
        border: `1px solid ${p.color}`,
        borderRadius: "10px",
        padding: "1px 7px",
      }}
    >
      {p.mark} {p.text}
    </span>
  );
}

export default function ScreenerPage() {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const [screenerResults, setScreenerResults] = useState([]);
  const [screenerLoading, setScreenerLoading] = useState(true);
  const [screenerError, setScreenerError] = useState("");
  const [screenerWarning, setScreenerWarning] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);

  const filterKey = activeFilters.join(",");

  useEffect(() => {
    let cancelled = false;

    async function loadScreener() {
      setScreenerLoading(true);
      setScreenerError("");
      const qs = SCREENER_FILTERS.filter((f) => activeFilters.includes(f.key))
        .map((f) => f.query)
        .join("&");
      try {
        const res = await fetch("/api/screener" + (qs ? "?" + qs : ""));
        const json = await res.json();
        if (cancelled) return;
        if (res.ok && Array.isArray(json.results)) {
          setScreenerResults(json.results);
          setScreenerWarning(json.warning || "");
        } else {
          setScreenerError((json && json.error) || "Деректерді алу мүмкін болмады");
        }
      } catch {
        if (!cancelled) setScreenerError("Байланыс қатесі");
      } finally {
        if (!cancelled) setScreenerLoading(false);
      }
    }

    loadScreener();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  function toggleFilter(key) {
    setActiveFilters((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
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

  const allActive = activeFilters.length === 0;

  function chipStyle(on) {
    return {
      fontSize: "0.8rem",
      color: on ? colors.bg : colors.textMuted,
      background: on ? colors.gold : "transparent",
      border: `1px solid ${on ? colors.gold : colors.border}`,
      borderRadius: "10px",
      padding: "8px 16px",
      cursor: "pointer",
      fontWeight: on ? "700" : "400",
      fontFamily: fontBody,
    };
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
        .tradeiq-scr-wrap { padding: 28px 16px; max-width: 900px; margin: 0 auto; }
        .tradeiq-scr-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 48px 58px 78px;
          gap: 6px;
          padding-left: 14px;
          padding-right: 14px;
        }
        @media (min-width: 640px) {
          .tradeiq-scr-wrap { padding: 32px 24px; }
          .tradeiq-scr-grid {
            grid-template-columns: minmax(0, 1fr) 90px 90px 110px;
            gap: 0;
            padding-left: 18px;
            padding-right: 18px;
          }
        }
      `}</style>

      <NavMenu />

      <div className="tradeiq-content-shell">
        <Header />

        <div className="tradeiq-scr-wrap">
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
            <button
              onClick={() => setActiveFilters([])}
              className="tradeiq-filter-btn"
              aria-pressed={allActive}
              style={chipStyle(allActive)}
            >
              Барлық нарық
            </button>
            {SCREENER_FILTERS.map((f) => {
              const on = activeFilters.includes(f.key);
              return (
                <button
                  key={f.key}
                  onClick={() => toggleFilter(f.key)}
                  className="tradeiq-filter-btn"
                  aria-pressed={on}
                  style={chipStyle(on)}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <p style={{ margin: "-8px 0 16px", fontSize: "0.7rem", color: colors.textFaint, lineHeight: "1.6" }}>
            Халал: <span style={{ color: colors.gain }}>✓</span> алдын ала сәйкес ·{" "}
            <span style={{ color: colors.hold }}>!</span> күмәнді ·{" "}
            <span style={{ color: colors.loss }}>✕</span> сәйкес емес ·{" "}
            <span>?</span> деректер жоқ
          </p>

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
              className="tradeiq-scr-grid"
              style={{
                paddingTop: "12px",
                paddingBottom: "12px",
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

            {screenerError ? (
              <div style={{ padding: "24px 18px", color: colors.loss, fontSize: "0.85rem" }}>{screenerError}</div>
            ) : screenerLoading && screenerResults.length === 0 ? (
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
                  <Link
                    key={r.symbol}
                    href={"/?symbol=" + encodeURIComponent(r.symbol)}
                    className="tradeiq-row tradeiq-scr-grid"
                    style={{
                      paddingTop: "12px",
                      paddingBottom: "12px",
                      fontSize: "0.82rem",
                      fontFamily: fontMono,
                      borderBottom: `1px solid ${colors.border}`,
                      alignItems: "center",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", color: colors.textPrimary, fontWeight: "600" }}>
                        {r.symbol}
                      </span>
                      <HalalPill halal={r.halal} />
                    </span>
                    <span style={{ color: colors.textMuted }}>
                      {typeof r.pe === "number" ? r.pe.toFixed(1) : "—"}
                    </span>
                    <span style={{ color: colors.textMuted }}>
                      {typeof r.roe === "number" ? r.roe.toFixed(1) + "%" : "—"}
                    </span>
                    <span
                      style={{
                        textAlign: "right",
                        color: up ? colors.gain : colors.loss,
                        fontWeight: "600",
                      }}
                    >
                      {typeof r.changePercent === "number"
                        ? `${up ? "▲" : "▼"} ${Math.abs(r.changePercent).toFixed(2)}%`
                        : "—"}
                    </span>
                  </Link>
                );
              })
            )}
          </div>

          {screenerWarning ? (
            <p style={{ marginTop: "12px", fontSize: "0.72rem", color: colors.hold, lineHeight: "1.5" }}>
              ⚠ {screenerWarning}
            </p>
          ) : null}

          <p style={{ marginTop: "14px", fontSize: "0.68rem", color: colors.textFaint, lineHeight: "1.5" }}>
            Халал скрин — AAOIFI үлгісіндегі алдын ала автоматты тексеру: қызмет түрі, қарыз ≤ 30%, ақша ≤ 30%
            (нарық құнынан). Харам табыс үлесі (≤ 5%) тексерілмейді, бұл фатуа емес және инвестиция кеңесі емес.
            Толық түсіндірме үшін тикерді басыңыз.
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
