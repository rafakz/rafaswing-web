"use client";

import { useState, useEffect } from "react";
import NavMenu from "../NavMenu";
import { supabase } from "../supabaseClient";

const colors = {
  bg: "#0B0F19",
  card: "rgba(20, 28, 45, 0.6)",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  gold: "#3b82f6",
  goldBright: "#60a5fa",
  textPrimary: "#ffffff",
  textMuted: "#9ca3af",
  textFaint: "#6b7280",
  gain: "#10b981",
  gainBright: "#34d399",
  loss: "#ef4444",
  lossBright: "#f87171",
  hold: "#eab308",
};

const fontMono = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

export default function PortfolioPage() {
  const [watchlist, setWatchlist] = useState([]);
  const [stocksData, setStocksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [currency, setCurrency] = useState("USD");
  const [usdkzt, setUsdkzt] = useState(500);

  // KZT бағамын жүктеу
  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((res) => res.json())
      .then((d) => {
        if (d && d.rates && d.rates.KZT) setUsdkzt(d.rates.KZT);
      })
      .catch(() => {});
  }, []);

  // Пользователь сессиясын тексеру
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data ? data.session : null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      if (listener && listener.subscription) listener.subscription.unsubscribe();
    };
  }, []);

  // Таңдаулыларды сақтау орнынан оқу
  useEffect(() => {
    async function loadPortfolio() {
      if (!session || !session.user) {
        setWatchlist([]);
        setStocksData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data: rows } = await supabase
          .from("watchlist")
          .select("symbol")
          .eq("user_id", session.user.id);

        if (rows && rows.length > 0) {
          const symbols = rows.map((r) => r.symbol);
          setWatchlist(symbols);

          const results = await Promise.all(
            symbols.map(async (sym) => {
              try {
                const res = await fetch(`/api/stock?symbol=${sym}`);
                const json = await res.json();
                if (res.ok) return json;
                return { symbol: sym, error: true };
              } catch (e) {
                return { symbol: sym, error: true };
              }
            })
          );
          setStocksData(results);
        } else {
          setWatchlist([]);
          setStocksData([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadPortfolio();
  }, [session]);

  // Портфельден өшіру (✕)
  async function removeFromWatchlist(symbol) {
    if (!session || !session.user) return;
    try {
      await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", session.user.id)
        .eq("symbol", symbol);

      setWatchlist((prev) => prev.filter((s) => s !== symbol));
      setStocksData((prev) => prev.filter((item) => item.symbol !== symbol));
    } catch (err) {
      console.error(err);
    }
  }

  const fmtCurr = (val) => {
    if (typeof val !== "number" || isNaN(val)) return "—";
    if (currency === "KZT") {
      return "₸" + (val * usdkzt).toLocaleString("kk-KZ", { maximumFractionDigits: 0 });
    }
    return "$" + val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.textPrimary, paddingBottom: "120px" }}>
      <NavMenu />

      <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px 16px" }}>
        {/* Тақырыбы және Валюта ауыстырғыш */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "800", margin: 0 }}>Таңдаулылар</h1>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: colors.textMuted }}>
              Бақылап жүрген акцияларыңыз
            </p>
          </div>

          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "4px", border: `1px solid ${colors.cardBorder}` }}>
            <button
              onClick={() => setCurrency("USD")}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "none",
                background: currency === "USD" ? colors.gold : "transparent",
                color: "#fff",
                fontSize: "0.75rem",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              USD
            </button>
            <button
              onClick={() => setCurrency("KZT")}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "none",
                background: currency === "KZT" ? colors.gain : "transparent",
                color: "#fff",
                fontSize: "0.75rem",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              KZT
            </button>
          </div>
        </div>

        {/* Жүйеге кірмеген болса ескерту */}
        {!session && (
          <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: "20px", padding: "30px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🔒</div>
            <div style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "8px" }}>Тіркелу қажет</div>
            <p style={{ fontSize: "0.85rem", color: colors.textMuted, margin: "0 0 20px 0" }}>
              Таңдаулы акциялар тізімін сақтау және бақылау үшін жүйеге кіріңіз.
            </p>
            <a
              href="/login"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                borderRadius: "14px",
                background: colors.gold,
                color: "#fff",
                fontWeight: "bold",
                textDecoration: "none",
                fontSize: "0.9rem",
              }}
            >
              Жүйеге кіру
            </a>
          </div>
        )}

        {/* Акциялар кестесі */}
        {session && (
          <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: "20px", padding: "16px", backdropFilter: "blur(16px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: `1px solid rgba(255,255,255,0.08)`, fontSize: "0.7rem", fontWeight: "bold", color: colors.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <span>Тикер / Баға</span>
              <span>Өзгеріс</span>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", color: colors.textFaint, padding: "30px 0", fontSize: "0.9rem" }}>
                Жүктелуде...
              </div>
            ) : stocksData.length === 0 ? (
              <div style={{ textAlign: "center", color: colors.textFaint, padding: "30px 0", fontSize: "0.9rem" }}>
                Таңдаулы акциялар әлі қосылмаған
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {stocksData.map((stock) => {
                  if (stock.error) {
                    return (
                      <div key={stock.symbol} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 12px", borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                        <span style={{ fontWeight: "700" }}>{stock.symbol}</span>
                        <span style={{ color: colors.textFaint, fontSize: "0.8rem" }}>Дерек жоқ</span>
                      </div>
                    );
                  }

                  const isUp = typeof stock.changePercent === "number" && stock.changePercent >= 0;

                  return (
                    <div
                      key={stock.symbol}
                      style={{
                        display: "flex",
                        justify: "space-between",
                        alignItems: "center",
                        padding: "14px 12px",
                        borderBottom: `1px solid rgba(255,255,255,0.05)`,
                      }}
                    >
                      <a
                        href={`/?symbol=${stock.symbol}`}
                        style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit", flex: 1 }}
                      >
                        {stock.logo ? (
                          <img src={stock.logo} alt="" style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(255,255,255,0.05)" }} />
                        ) : (
                          <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(59,130,246,0.2)", color: colors.goldBright, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.8rem" }}>
                            {stock.symbol?.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: "800", fontSize: "1rem" }}>{stock.symbol}</div>
                          <div style={{ fontSize: "0.85rem", color: colors.textMuted, fontFamily: fontMono, marginTop: "2px" }}>
                            {fmtCurr(stock.currentPrice)}
                          </div>
                        </div>
                      </a>

                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ textAlign: "right", fontFamily: fontMono, fontWeight: "700", color: isUp ? colors.gainBright : colors.lossBright, fontSize: "0.95rem" }}>
                          {isUp ? "▲" : "▼"} {Math.abs(stock.changePercent || 0).toFixed(2)}%
                        </div>

                        <button
                          onClick={() => removeFromWatchlist(stock.symbol)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: colors.textFaint,
                            fontSize: "1.1rem",
                            cursor: "pointer",
                            padding: "4px",
                            lineHeight: 1,
                          }}
                          title="Өшіру"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
