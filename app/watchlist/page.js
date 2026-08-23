"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NavMenu from "../NavMenu";
import { getWatchlist, removeFromWatchlist } from "../watchlistStorage";

const colors = {
  bg: "#0B0F1A",
  card: "#141B2E",
  border: "#263248",
  gold: "#C9A227",
  goldBright: "#E8C468",
  textPrimary: "#F5F1E6",
  textMuted: "#8A93A6",
  textFaint: "#5B6478",
  gain: "#4FA98B",
  loss: "#C2542D",
};

const fontDisplay = "'Georgia', 'Times New Roman', serif";
const fontBody = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontMono = "'SF Mono', 'Consolas', 'Menlo', monospace";

function safeNum(v, digits) {
  if (typeof v !== "number" || isNaN(v)) return "—";
  return v.toFixed(digits);
}

export default function WatchlistPage() {
  const [symbols, setSymbols] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    var list = getWatchlist();
    setSymbols(list);
    loadQuotes(list);
  }, []);

  async function loadQuotes(list) {
    setLoading(true);
    var results = {};
    for (var i = 0; i < list.length; i++) {
      var sym = list[i];
      try {
        var res = await fetch("/api/stock?symbol=" + sym);
        var json = await res.json();
        if (res.ok && json && !json.error) {
          results[sym] = json;
        } else {
          results[sym] = { error: true };
        }
      } catch (e) {
        results[sym] = { error: true };
      }
    }
    setQuotes(results);
    setLoading(false);
  }

  function handleRemove(symbol) {
    removeFromWatchlist(symbol);
    var updated = symbols.filter(function (s) {
      return s !== symbol;
    });
    setSymbols(updated);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.textPrimary,
        padding: "32px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: fontBody,
      }}
    >
      <NavMenu />

      <h1
        style={{
          fontFamily: fontDisplay,
          fontSize: "1.6rem",
          fontWeight: "bold",
          marginTop: "8px",
          marginBottom: "4px",
        }}
      >
        ⭐ Таңдаулылар
      </h1>
      <p style={{ color: colors.textFaint, fontSize: "0.75rem", marginBottom: "22px", textAlign: "center" }}>
        Бақылайтын акцияларың осында сақталады
      </p>

      {loading ? <p style={{ color: colors.textMuted }}>Жүктелуде...</p> : null}

      {!loading && symbols.length === 0 ? (
        <div style={{ textAlign: "center", color: colors.textFaint, marginTop: "20px" }}>
          <p style={{ marginBottom: "14px" }}>Әзірге тізім бос.</p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              borderRadius: "10px",
              background: colors.gold,
              color: colors.bg,
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            Акция іздеу
          </Link>
        </div>
      ) : null}

      <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {symbols.map((sym) => {
          const q = quotes[sym];
          const isUp = q && typeof q.change === "number" && q.change >= 0;
          return (
            <div
              key={sym}
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: "12px",
                padding: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Link href={"/?symbol=" + sym} style={{ textDecoration: "none", color: colors.textPrimary, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {q && q.logo ? (
                    <img src={q.logo} alt="" width={32} height={32} style={{ borderRadius: "6px" }} />
                  ) : null}
                  <div>
                    <div style={{ fontWeight: "bold", fontFamily: fontMono, fontSize: "1rem" }}>{sym}</div>
                    {q && !q.error ? (
                      <div style={{ fontSize: "0.8rem", fontFamily: fontMono, color: isUp ? colors.gain : colors.loss }}>
                        ${safeNum(q.currentPrice, 2)} {isUp ? "▲" : "▼"} {safeNum(q.changePercent, 2)}%
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.75rem", color: colors.textFaint }}>Деректер жоқ</div>
                    )}
                  </div>
                </div>
              </Link>
              <button
                onClick={() => handleRemove(sym)}
                aria-label="Өшіру"
                style={{
                  background: "transparent",
                  border: "none",
                  color: colors.textFaint,
                  fontSize: "1.3rem",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
