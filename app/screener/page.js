"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NavMenu from "../NavMenu";

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

const fontBody = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const fontMono = "'Inter', -apple-system, BlinkMacSystemFont, monospace";

export default function ScreenerPage() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Фильтрлер: all, bullish, halal
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadScreener() {
      setLoading(true);
      setError("");
      try {
        // Сіздің сервердегі скринер API-ға сұраныс
        const res = await fetch("/api/screener");
        const json = await res.json();
        
        if (res.ok && Array.isArray(json.data)) {
          setStocks(json.data);
        } else if (res.ok && Array.isArray(json)) {
          // Егер API тікелей массив қайтарса
          setStocks(json);
        } else {
          // API әлі дайын болмаса немесе қате берсе, UI көрсету үшін уақытша mock-деректер (fallback)
          setStocks([
            { symbol: "AAPL", name: "Apple Inc.", currentPrice: 173.50, changePercent: 1.2, technicals: { rsi: 55 }, halal: { status: "pass" }, swingScore: 78, signal: "Bullish" },
            { symbol: "TSLA", name: "Tesla Inc.", currentPrice: 195.20, changePercent: -2.4, technicals: { rsi: 35 }, halal: { status: "pass" }, swingScore: 45, signal: "Bearish" },
            { symbol: "NVDA", name: "NVIDIA Corp.", currentPrice: 850.10, changePercent: 4.5, technicals: { rsi: 72 }, halal: { status: "pass" }, swingScore: 92, signal: "Strong Bull" },
            { symbol: "JPM", name: "JPMorgan Chase", currentPrice: 190.00, changePercent: 0.8, technicals: { rsi: 60 }, halal: { status: "fail" }, swingScore: 65, signal: "Neutral" },
          ]);
        }
      } catch (err) {
        setError("Деректерді жүктеу мүмкін болмады");
      } finally {
        setLoading(false);
      }
    }
    loadScreener();
  }, []);

  const safeNum = (v, digits = 2) => (typeof v === "number" && !isNaN(v) ? v.toFixed(digits) : "—");

  // Акцияларды сүзгілеу логикасы
  const filteredStocks = stocks.filter((stock) => {
    // Іздеу жолағы бойынша сүзгілеу
    if (searchQuery && !stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) && !(stock.name && stock.name.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    // Батырмалар бойынша сүзгілеу
    if (filter === "bullish" && (!stock.signal || !stock.signal.toLowerCase().includes("bull"))) return false;
    if (filter === "halal" && (!stock.halal || stock.halal.status !== "pass")) return false;
    return true;
  });

  return (
    <main style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.textPrimary, fontFamily: fontBody, paddingBottom: "120px", position: "relative" }}>
      {/* Артқы фондағы жарқыл */}
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)", borderRadius: "50%", zIndex: 0, pointerEvents: "none" }}></div>
      
      <NavMenu />

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px", position: "relative", zIndex: 1 }}>
        
        {/* Тақырыбы */}
        <div style={{ marginBottom: "30px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", boxShadow: "0 0 20px rgba(59,130,246,0.3)" }}>
            ⚡
          </div>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>AI Скринер</h1>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: colors.textMuted }}>
              Нарықтағы ең үздік мүмкіндіктерді табыңыз
            </p>
          </div>
        </div>

        {/* Іздеу және Батырмалар блогы */}
        <div style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "1rem", opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              placeholder="Тикер немесе атауы бойынша іздеу..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "14px 16px 14px 44px", borderRadius: "16px", border: `1px solid rgba(255,255,255,0.1)`, background: "rgba(0,0,0,0.3)", color: colors.textPrimary, fontSize: "0.95rem", outline: "none", transition: "border-color 0.2s" }}
              onFocus={(e) => e.target.style.borderColor = colors.gold}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", WebkitOverflowScrolling: "touch" }}>
            <button
              onClick={() => setFilter("all")}
              style={{ flexShrink: 0, padding: "8px 16px", borderRadius: "12px", border: `1px solid ${colors.cardBorder}`, background: filter === "all" ? colors.gold : "rgba(255,255,255,0.05)", color: "#fff", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
            >
              Барлығы
            </button>
            <button
              onClick={() => setFilter("halal")}
              style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "12px", border: `1px solid ${colors.cardBorder}`, background: filter === "halal" ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)", color: filter === "halal" ? colors.gainBright : "#fff", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
            >
              🕌 Халал ғана
            </button>
            <button
              onClick={() => setFilter("bullish")}
              style={{ flexShrink: 0, padding: "8px 16px", borderRadius: "12px", border: `1px solid ${colors.cardBorder}`, background: filter === "bullish" ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)", color: filter === "bullish" ? colors.goldBright : "#fff", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
            >
              📈 AI Өсім (Bullish)
            </button>
          </div>
        </div>

        {/* Нәтижелер тізімі */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: colors.goldBright, fontWeight: "600", animation: "pulse 1.5s infinite" }}>
            Акциялар сарапталуда...
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: colors.lossBright }}>{error}</div>
        ) : filteredStocks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: colors.textFaint }}>Сұранысқа сай акция табылмады.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredStocks.map((stock, i) => {
              const isUp = stock.changePercent >= 0;
              const isHalal = stock.halal && stock.halal.status === "pass";
              const score = stock.swingScore || 0;
              
              let scoreColor = colors.textMuted;
              if (score >= 75) scoreColor = colors.gainBright;
              else if (score >= 50) scoreColor = colors.hold;
              else if (score > 0) scoreColor = colors.lossBright;

              return (
                <Link 
                  href={`/?symbol=${stock.symbol}`} 
                  key={i}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: "16px", padding: "16px", transition: "transform 0.2s, background 0.2s" }}
                       onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                       onMouseOut={(e) => e.currentTarget.style.background = colors.card}>
                    
                    {/* Сол жақ: Тикер және Атауы */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.9rem", color: colors.textPrimary }}>
                        {stock.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>{stock.symbol}</h3>
                          {isHalal && <span style={{ fontSize: "0.7rem", background: "rgba(16,185,129,0.15)", color: colors.gainBright, padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>Халал</span>}
                        </div>
                        <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: colors.textMuted, maxWidth: "120px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {stock.name || "Stock"}
                        </p>
                      </div>
                    </div>

                    {/* Оң жақ: Баға және Score */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: fontMono, fontSize: "1.1rem", fontWeight: "700", color: colors.textPrimary }}>
                        ${safeNum(stock.currentPrice)}
                      </div>
                      <div style={{ fontFamily: fontMono, fontSize: "0.85rem", fontWeight: "600", color: isUp ? colors.gain : colors.loss, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                        {isUp ? "▲" : "▼"} {Math.abs(stock.changePercent).toFixed(2)}%
                      </div>
                      <div style={{ marginTop: "4px", fontSize: "0.7rem", fontWeight: "700", color: scoreColor, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        AI Score: {score}
                      </div>
                    </div>

                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
