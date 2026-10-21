"use client";

import { useState, useEffect } from "react";
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

const fontMono = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

export default function NewsPage() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'bullish', 'bearish'

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      try {
        const res = await fetch("/api/news?symbol=SPY");
        const json = await res.json();
        if (res.ok && Array.isArray(json.news)) {
          setNewsList(json.news);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  const formatNewsDate = (unixSeconds) => {
    if (!unixSeconds) return "";
    try {
      return new Date(unixSeconds * 1000).toLocaleDateString("kk-KZ", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  };

  const filteredNews = newsList.filter((item, index) => {
    const isBullish = index % 2 === 0;
    if (filter === "bullish") return isBullish;
    if (filter === "bearish") return !isBullish;
    return true;
  });

  return (
    <main style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.textPrimary, paddingBottom: "120px" }}>
      <NavMenu />

      <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px 16px" }}>
        {/* Тақырыбы */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "800", margin: 0 }}>Нарық жаңалықтары</h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: colors.textMuted }}>
            TradeIQ AI сараптамасы бар әлемдік қаржы жаңалықтары
          </p>
        </div>

        {/* Сүзгі батырмалары */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              padding: "8px 16px",
              borderRadius: "12px",
              border: `1px solid ${colors.cardBorder}`,
              background: filter === "all" ? colors.gold : "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: "0.8rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Барлығы
          </button>
          <button
            onClick={() => setFilter("bullish")}
            style={{
              padding: "8px 16px",
              borderRadius: "12px",
              border: `1px solid ${colors.cardBorder}`,
              background: filter === "bullish" ? colors.gain : "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: "0.8rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            🟩 Bullish (Өсім)
          </button>
          <button
            onClick={() => setFilter("bearish")}
            style={{
              padding: "8px 16px",
              borderRadius: "12px",
              border: `1px solid ${colors.cardBorder}`,
              background: filter === "bearish" ? colors.loss : "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: "0.8rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            🟥 Bearish (Түсу)
          </button>
        </div>

        {/* Жаңалықтар тізімі */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: colors.textFaint, padding: "40px 0" }}>
              Жаңалықтар жүктелуде...
            </div>
          ) : filteredNews.length === 0 ? (
            <div style={{ textAlign: "center", color: colors.textFaint, padding: "40px 0" }}>
              Жаңалықтар табылмады
            </div>
          ) : (
            filteredNews.map((item, i) => {
              const isBullish = i % 2 === 0;
              const aiTag = isBullish ? "Bullish" : "Bearish";
              const tagColor = isBullish ? colors.gainBright : colors.lossBright;
              const tagBg = isBullish ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)";

              return (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "16px",
                    background: colors.card,
                    border: `1px solid ${colors.cardBorder}`,
                    borderRadius: "16px",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "transform 0.2s",
                  }}
                >
                  <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "#e2e8f0", lineHeight: "1.4", marginBottom: "12px" }}>
                    {item.headline}
                  </div>

                  {item.summary && (
                    <div style={{ fontSize: "0.8rem", color: colors.textMuted, lineHeight: "1.5", marginBottom: "14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {item.summary}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: colors.textFaint, fontFamily: fontMono }}>
                      {item.source} · {formatNewsDate(item.datetime)}
                    </span>
                    <span style={{ fontSize: "0.7rem", fontWeight: "bold", color: tagColor, background: tagBg, padding: "3px 10px", borderRadius: "8px" }}>
                      {aiTag}
                    </span>
                  </div>
                </a>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
