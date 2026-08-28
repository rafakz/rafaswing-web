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

export default function WatchlistPage() {
  const [overview, setOverview] = useState([]);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const [session, setSession] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const [items, setItems] = useState([]);
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

  const loadWatchlist = useCallback(async () => {
    if (!session || !session.user) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: dbError } = await supabase
        .from("watchlist")
        .select("*")
        .order("created_at", { ascending: false });

      if (dbError) {
        setError(dbError.message);
        setLoading(false);
        return;
      }

      setItems(data || []);

      const uniqueSymbols = [...new Set((data || []).map((r) => r.symbol))];
      const priceMap = {};
      await Promise.all(
        uniqueSymbols.map(async (sym) => {
          try {
            const res = await fetch(`/api/stock?symbol=${encodeURIComponent(sym)}`);
            const json = await res.json();
            if (res.ok) {
              priceMap[sym] = {
                currentPrice: json.currentPrice,
                changePercent: json.changePercent,
                name: json.name,
                logo: json.logo,
              };
            }
          } catch {
            // үнсіз
          }
        })
      );
      setLiveData(priceMap);
    } catch (err) {
      setError("Тізімді жүктеу кезінде қате");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (sessionChecked && session) {
      loadWatchlist();
    } else if (sessionChecked && !session) {
      setLoading(false);
    }
  }, [sessionChecked, session, loadWatchlist]);

  async function handleRemove(id, symbol) {
    try {
      await supabase.from("watchlist").delete().eq("id", id);
      setItems((prev) => prev.filter((r) => r.id !== id));
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
        .tradeiq-watch-row:hover { background: rgba(212,175,55,0.06); }
      `}</style>

      <NavMenu />

      <div className="tradeiq-content-shell">
        <Header overview={overview} />

        <div style={{ padding: "32px 24px", maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "6px" }}>
            Таңдаулылар
          </h1>
          <p style={{ color: colors.textFaint, fontSize: "0.82rem", marginBottom: "24px" }}>
            Бақылап жүрген акцияларың
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
                Таңдаулыларды көру үшін алдымен жүйеге кіру керек.
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
                  gridTemplateColumns: "1fr 120px 110px 40px",
                  padding: "12px 18px",
                  fontSize: "0.68rem",
                  color: colors.textFaint,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <span>Тикер</span>
                <span>Баға</span>
                <span style={{ textAlign: "right" }}>Өзгеріс</span>
                <span></span>
              </div>

              {loading ? (
                <div style={{ padding: "24px 18px", color: colors.textFaint, fontSize: "0.85rem" }}>
                  Жүктелуде...
                </div>
              ) : error ? (
                <div style={{ padding: "24px 18px", color: colors.loss, fontSize: "0.85rem" }}>{error}</div>
              ) : items.length === 0 ? (
                <div style={{ padding: "24px 18px", color: colors.textFaint, fontSize: "0.85rem" }}>
                  Тізім бос. Кез келген акция бетінде ☆ басып, осында қосыла бастайды.
                </div>
              ) : (
                items.map((item) => {
                  const live = liveData[item.symbol];
                  const up = live && typeof live.changePercent === "number" && live.changePercent >= 0;
                  return (
                    <a
                      key={item.id}
                      href={`/?symbol=${encodeURIComponent(item.symbol)}`}
                      className="tradeiq-watch-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 120px 110px 40px",
                        padding: "14px 18px",
                        fontSize: "0.85rem",
                        fontFamily: fontMono,
                        borderBottom: `1px solid ${colors.border}`,
                        alignItems: "center",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {live && live.logo ? (
                          <img src={live.logo} alt="" width={22} height={22} style={{ borderRadius: "5px" }} />
                        ) : null}
                        <span style={{ color: colors.textPrimary, fontWeight: "600" }}>{item.symbol}</span>
                      </span>
                      <span style={{ color: colors.textMuted }}>
                        {live && typeof live.currentPrice === "number" ? `$${safeNum(live.currentPrice, 2)}` : "—"}
                      </span>
                      <span
                        style={{
                          textAlign: "right",
                          color: live ? (up ? colors.gain : colors.loss) : colors.textFaint,
                          fontWeight: "600",
                        }}
                      >
                        {live && typeof live.changePercent === "number"
                          ? `${up ? "▲" : "▼"} ${safeNum(live.changePercent, 2)}%`
                          : "—"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemove(item.id, item.symbol);
                        }}
                        aria-label="Тізімнен алып тастау"
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
                    </a>
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
