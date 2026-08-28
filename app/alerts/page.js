"use client";

import { useState, useEffect, useCallback } from "react";
import NavMenu from "../NavMenu";
import Header from "../Header";
import FloatingChat from "../FloatingChat";
import { supabase } from "../supabaseClient";

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

export default function AlertsPage() {
  const [overview, setOverview] = useState([]);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const [session, setSession] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const [alerts, setAlerts] = useState([]);
  const [liveData, setLiveData] = useState({});
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
    supabase.auth.getSession().then(({ data }) => {
      setSession(data ? data.session : null);
      setSessionChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      if (listener && listener.subscription) listener.subscription.unsubscribe();
    };
  }, []);

  const loadAlerts = useCallback(async () => {
    if (!session || !session.user) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: dbError } = await supabase
        .from("price_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (dbError) {
        setError(dbError.message);
        setLoading(false);
        return;
      }

      setAlerts(data || []);

      const uniqueSymbols = [...new Set((data || []).map((r) => r.symbol))];
      const priceMap = {};
      await Promise.all(
        uniqueSymbols.map(async (sym) => {
          try {
            const res = await fetch(`/api/stock?symbol=${encodeURIComponent(sym)}`);
            const json = await res.json();
            if (res.ok) {
              priceMap[sym] = { currentPrice: json.currentPrice };
            }
          } catch {
            // үнсіз
          }
        })
      );
      setLiveData(priceMap);
    } catch (err) {
      setError("Дабылдарды жүктеу кезінде қате");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (sessionChecked && session) {
      loadAlerts();
    } else if (sessionChecked && !session) {
      setLoading(false);
    }
  }, [sessionChecked, session, loadAlerts]);

  async function handleDelete(id) {
    try {
      await supabase.from("price_alerts").delete().eq("id", id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError("Өшіру кезінде қате шықты");
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
        .tradeiq-alert-row:hover { background: rgba(212,175,55,0.06); }
      `}</style>

      <NavMenu />

      <div className="tradeiq-content-shell">
        <Header overview={overview} />

        <div style={{ padding: "32px 24px", maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "6px" }}>
            Баға дабылдары
          </h1>
          <p style={{ color: colors.textFaint, fontSize: "0.82rem", marginBottom: "24px" }}>
            Акция бетінде 🔔 арқылы жаңа дабыл қоя аласың
          </p>

          {!sessionChecked ? (
            <p style={{ color: colors.textFaint, fontSize: "0.85rem" }}>Тексерілуде...</p>
          ) : !session ? (
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: "16px",
                padding: "24px",
                textAlign: "center",
              }}
            >
              <p style={{ color: colors.textMuted, fontSize: "0.9rem" }}>
                Дабылдарды көру үшін алдымен жүйеге кіру керек.
              </p>
            </div>
          ) : (
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
                  gridTemplateColumns: "1fr 100px 100px 100px 40px",
                  padding: "12px 18px",
                  fontSize: "0.68rem",
                  color: colors.textFaint,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <span>Тикер</span>
                <span>Мақсат</span>
                <span>Ағымдағы</span>
                <span>Күйі</span>
                <span></span>
              </div>

              {loading ? (
                <div style={{ padding: "24px 18px", color: colors.textFaint, fontSize: "0.85rem" }}>
                  Жүктелуде...
                </div>
              ) : error ? (
                <div style={{ padding: "24px 18px", color: colors.loss, fontSize: "0.85rem" }}>{error}</div>
              ) : alerts.length === 0 ? (
                <div style={{ padding: "24px 18px", color: colors.textFaint, fontSize: "0.85rem" }}>
                  Дабыл жоқ. Кез келген акция бетінде 🔔 арқылы қосыла бастайды.
                </div>
              ) : (
                alerts.map((a) => {
                  const live = liveData[a.symbol];
                  const currentPrice = live && typeof live.currentPrice === "number" ? live.currentPrice : null;
                  const reached =
                    currentPrice !== null &&
                    ((a.direction === "above" && currentPrice >= a.target_price) ||
                      (a.direction === "below" && currentPrice <= a.target_price));

                  return (
                    <div
                      key={a.id}
                      className="tradeiq-alert-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 100px 100px 100px 40px",
                        padding: "14px 18px",
                        fontSize: "0.82rem",
                        fontFamily: fontMono,
                        borderBottom: `1px solid ${colors.border}`,
                        alignItems: "center",
                      }}
                    >
                      <span style={{ color: colors.textPrimary, fontWeight: "600" }}>
                        {a.symbol}{" "}
                        <span style={{ color: colors.textFaint, fontWeight: "400" }}>
                          {a.direction === "above" ? "↑" : "↓"}
                        </span>
                      </span>
                      <span style={{ color: colors.textMuted }}>${safeNum(a.target_price, 2)}</span>
                      <span style={{ color: colors.textMuted }}>
                        {currentPrice !== null ? `$${safeNum(currentPrice, 2)}` : "—"}
                      </span>
                      <span
                        style={{
                          fontWeight: "600",
                          color: reached ? colors.gain : colors.textFaint,
                        }}
                      >
                        {reached ? "Жетті ✓" : "Күтуде"}
                      </span>
                      <button
                        onClick={() => handleDelete(a.id)}
                        aria-label="Дабылды өшіру"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: colors.textFaint,
                          fontSize: "1rem",
                          cursor: "pointer",
                          justifySelf: "end",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}
            </div>
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
