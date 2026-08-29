"use client";

import { useState, useEffect, useCallback } from "react";
import NavMenu from "../NavMenu";
import Header from "../Header";
import FloatingChat from "../FloatingChat";
import { supabase } from "../supabaseClient";
import { getSignal, SIGNAL_COLOR_KEY } from "../../lib/tradeiq-engine";

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

/* ---------- Сигнал есептеу енді ортақ Core Engine-де ---------- */

const fontBody = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontMono = "'SF Mono', 'Roboto Mono', monospace";

function safeNum(v, digits) {
  return typeof v === "number" && !isNaN(v) ? v.toFixed(digits) : "—";
}

export default function PortfolioPage() {
  const [overview, setOverview] = useState([]);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const [session, setSession] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const [holdings, setHoldings] = useState([]);
  const [liveData, setLiveData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formSymbol, setFormSymbol] = useState("");
  const [formShares, setFormShares] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // ---- Header индекстері ----
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

  // ---- Сессия ----
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

  // ---- Портфель тізімін жүктеу ----
  const loadHoldings = useCallback(async () => {
    if (!session || !session.user) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: dbError } = await supabase
        .from("portfolio_holdings")
        .select("*")
        .order("created_at", { ascending: false });

      if (dbError) {
        setError(dbError.message);
        setLoading(false);
        return;
      }

      setHoldings(data || []);

      // ---- Әр акцияның тірі бағасын алу ----
      const uniqueSymbols = [...new Set((data || []).map((h) => h.symbol))];
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
                technicals: json.technicals,
                swingScore: json.swingScore,
              };
            }
          } catch {
            // үнсіз
          }
        })
      );
      setLiveData(priceMap);
    } catch (err) {
      setError("Портфельді жүктеу кезінде қате");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (sessionChecked && session) {
      loadHoldings();
    } else if (sessionChecked && !session) {
      setLoading(false);
    }
  }, [sessionChecked, session, loadHoldings]);

  // ---- Акция қосу ----
  async function handleAddHolding(e) {
    e.preventDefault();
    setFormError("");

    const symbol = formSymbol.trim().toUpperCase();
    const shares = parseFloat(formShares);
    const avgPrice = parseFloat(formPrice);

    if (!symbol) {
      setFormError("Тикер керек");
      return;
    }
    if (!shares || shares <= 0) {
      setFormError("Дана саны 0-ден үлкен болуы керек");
      return;
    }
    if (!avgPrice || avgPrice <= 0) {
      setFormError("Орташа баға 0-ден үлкен болуы керек");
      return;
    }
    if (!session || !session.user) {
      setFormError("Алдымен кіру керек");
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from("portfolio_holdings").insert({
        user_id: session.user.id,
        symbol,
        shares,
        avg_price: avgPrice,
      });

      if (insertError) {
        setFormError(insertError.message);
      } else {
        setFormSymbol("");
        setFormShares("");
        setFormPrice("");
        await loadHoldings();
      }
    } catch (err) {
      setFormError("Қосу кезінде қате шықты");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Акцияны өшіру ----
  async function handleDelete(id) {
    try {
      await supabase.from("portfolio_holdings").delete().eq("id", id);
      await loadHoldings();
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

  // ---- Жиынтық есептеу ----
  let totalValue = 0;
  let totalCost = 0;
  holdings.forEach((h) => {
    const live = liveData[h.symbol];
    const price = live && typeof live.currentPrice === "number" ? live.currentPrice : h.avg_price;
    totalValue += price * h.shares;
    totalCost += h.avg_price * h.shares;
  });
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const gainUp = totalGain >= 0;

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
        .tradeiq-holding-row:hover { background: rgba(212,175,55,0.06); }
      `}</style>

      <NavMenu />

      <div className="tradeiq-content-shell">
        <Header overview={overview} />

        <div style={{ padding: "32px 24px", maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "6px" }}>
            Менің портфелім
          </h1>
          <p style={{ color: colors.textFaint, fontSize: "0.82rem", marginBottom: "24px" }}>
            Акцияларыңды қосып, жиынтық құнды бақыла
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
                Портфельді көру үшін алдымен жүйеге кіру керек.
              </p>
            </div>
          ) : (
            <>
              {/* ---- Жиынтық ---- */}
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "16px",
                  padding: "22px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ color: colors.textFaint, fontSize: "0.78rem", marginBottom: "6px" }}>
                  Жалпы құны
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: "bold", fontFamily: fontMono }}>
                  ${safeNum(totalValue, 2)}
                </div>
                {totalCost > 0 ? (
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: gainUp ? colors.gain : colors.loss,
                      fontFamily: fontMono,
                      marginTop: "4px",
                    }}
                  >
                    {gainUp ? "▲" : "▼"} ${safeNum(Math.abs(totalGain), 2)} (
                    {safeNum(Math.abs(totalGainPercent), 2)}%)
                  </div>
                ) : null}
              </div>

              {/* ---- Қосу формасы ---- */}
              <form
                onSubmit={handleAddHolding}
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                  background: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "16px",
                  padding: "18px",
                }}
              >
                <input
                  value={formSymbol}
                  onChange={(e) => setFormSymbol(e.target.value)}
                  placeholder="Тикер (мыс. AAPL)"
                  style={{
                    flex: "1 1 140px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: `1px solid ${colors.border}`,
                    background: colors.bg,
                    color: colors.textPrimary,
                    fontSize: "0.85rem",
                    fontFamily: fontBody,
                    boxSizing: "border-box",
                  }}
                />
                <input
                  value={formShares}
                  onChange={(e) => setFormShares(e.target.value)}
                  placeholder="Дана саны"
                  type="number"
                  step="any"
                  style={{
                    flex: "1 1 120px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: `1px solid ${colors.border}`,
                    background: colors.bg,
                    color: colors.textPrimary,
                    fontSize: "0.85rem",
                    fontFamily: fontBody,
                    boxSizing: "border-box",
                  }}
                />
                <input
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="Орташа баға ($)"
                  type="number"
                  step="any"
                  style={{
                    flex: "1 1 140px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: `1px solid ${colors.border}`,
                    background: colors.bg,
                    color: colors.textPrimary,
                    fontSize: "0.85rem",
                    fontFamily: fontBody,
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "10px",
                    border: "none",
                    background: colors.gold,
                    color: colors.bg,
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                    fontFamily: fontBody,
                    cursor: submitting ? "default" : "pointer",
                    flexShrink: 0,
                  }}
                >
                  {submitting ? "Қосылуда..." : "Қосу"}
                </button>
                {formError ? (
                  <p style={{ color: colors.loss, fontSize: "0.78rem", width: "100%", margin: 0 }}>
                    {formError}
                  </p>
                ) : null}
              </form>

              {/* ---- Тізім ---- */}
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "16px",
                  overflowX: "auto",
                }}
              >
                <div style={{ minWidth: "620px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 80px 90px 100px 130px 110px 40px",
                    padding: "12px 18px",
                    fontSize: "0.68rem",
                    color: colors.textFaint,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  <span>Тикер</span>
                  <span>Дана</span>
                  <span>Орт. баға</span>
                  <span>Ағымд. баға</span>
                  <span>Сигнал</span>
                  <span style={{ textAlign: "right" }}>Пайда/зиян</span>
                  <span></span>
                </div>

                {loading ? (
                  <div style={{ padding: "24px 18px", color: colors.textFaint, fontSize: "0.85rem" }}>
                    Жүктелуде...
                  </div>
                ) : error ? (
                  <div style={{ padding: "24px 18px", color: colors.loss, fontSize: "0.85rem" }}>
                    {error}
                  </div>
                ) : holdings.length === 0 ? (
                  <div style={{ padding: "24px 18px", color: colors.textFaint, fontSize: "0.85rem" }}>
                    Портфель бос. Жоғарыдан алғашқы акцияңды қос.
                  </div>
                ) : (
                  holdings.map((h) => {
                    const live = liveData[h.symbol];
                    const currentPrice =
                      live && typeof live.currentPrice === "number" ? live.currentPrice : null;
                    const positionGain =
                      currentPrice !== null ? (currentPrice - h.avg_price) * h.shares : null;
                    const positionUp = positionGain !== null && positionGain >= 0;
                    const signal = live ? getSignal(live.technicals, currentPrice) : null;

                    return (
                      <div
                        key={h.id}
                        className="tradeiq-holding-row"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 80px 90px 100px 130px 110px 40px",
                          padding: "14px 18px",
                          fontSize: "0.82rem",
                          fontFamily: fontMono,
                          borderBottom: `1px solid ${colors.border}`,
                          alignItems: "center",
                        }}
                      >
                        <span style={{ color: colors.textPrimary, fontWeight: "600" }}>{h.symbol}</span>
                        <span style={{ color: colors.textMuted }}>{h.shares}</span>
                        <span style={{ color: colors.textMuted }}>${safeNum(h.avg_price, 2)}</span>
                        <span style={{ color: colors.textMuted }}>
                          {currentPrice !== null ? `$${safeNum(currentPrice, 2)}` : "—"}
                        </span>
                        <span
                          style={{
                            color: signal ? colors[SIGNAL_COLOR_KEY[signal.level]] : colors.textFaint,
                            fontWeight: signal ? "700" : "400",
                            fontSize: "0.7rem",
                          }}
                        >
                          {signal ? signal.label : "—"}
                        </span>
                        <span
                          style={{
                            textAlign: "right",
                            color: positionGain === null ? colors.textFaint : positionUp ? colors.gain : colors.loss,
                            fontWeight: "600",
                          }}
                        >
                          {positionGain !== null
                            ? `${positionUp ? "▲" : "▼"} $${safeNum(Math.abs(positionGain), 2)}`
                            : "—"}
                        </span>
                        <button
                          onClick={() => handleDelete(h.id)}
                          aria-label="Өшіру"
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
              </div>
            </>
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
