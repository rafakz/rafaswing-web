"use client";

import { useState, useEffect } from "react";
import NavMenu from "../NavMenu";

const colors = {
  bg: "#0B0F1A",
  card: "#141B2E",
  border: "#263248",
  gold: "#C9A227",
  goldBright: "#E8C468",
  textPrimary: "#F5F1E6",
  textMuted: "#8A93A6",
  textFaint: "#5B6478",
};

const fontDisplay = "'Georgia', 'Times New Roman', serif";
const fontBody = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function timeAgo(unixSeconds) {
  if (!unixSeconds || typeof unixSeconds !== "number") return "";
  var diffMs = Date.now() - unixSeconds * 1000;
  var mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "жаңа ғана";
  if (mins < 60) return mins + " минут бұрын";
  var hours = Math.floor(mins / 60);
  if (hours < 24) return hours + " сағат бұрын";
  var days = Math.floor(hours / 24);
  return days + " күн бұрын";
}

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({});

  function toggleExpand(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function loadNews() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/market-news");
      const json = await res.json();
      if (json && json.error) {
        setError(json.error);
      } else if (json && Array.isArray(json.news)) {
        setNews(json.news);
      }
    } catch (err) {
      setError("Байланыс қатесі");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, 60 * 60 * 1000); // сағат сайын
    return () => clearInterval(interval);
  }, []);

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
          color: colors.textPrimary,
          marginTop: "8px",
          marginBottom: "4px",
        }}
      >
        Жаңалықтар
      </h1>
      <p style={{ color: colors.textFaint, fontSize: "0.75rem", marginBottom: "22px" }}>
        Нарық жаңалықтары сағат сайын жаңарады
      </p>

      {loading ? <p style={{ color: colors.textMuted }}>Жүктелуде...</p> : null}
      {error ? <p style={{ color: "#E2764C" }}>{error}</p> : null}

      <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {news.map((item, i) => {
          const id = item.id || i;
          const isOpen = !!expanded[id];
          return (
            <div
              key={id}
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <div
                onClick={() => toggleExpand(id)}
                style={{ display: "flex", gap: "12px", cursor: "pointer" }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    width={72}
                    height={72}
                    style={{ borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                  />
                ) : null}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: "600", lineHeight: "1.3", marginBottom: "6px" }}>
                    {item.headline}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: colors.textFaint, display: "flex", gap: "8px" }}>
                    <span>{item.source}</span>
                    <span>·</span>
                    <span>{timeAgo(item.datetime)}</span>
                    {item.summary ? (
                      <span style={{ color: colors.gold, marginLeft: "auto" }}>
                        {isOpen ? "Жасыру ▲" : "Толығырақ ▼"}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {isOpen && item.summary ? (
                <div
                  style={{
                    marginTop: "10px",
                    paddingTop: "10px",
                    borderTop: `1px solid ${colors.border}`,
                    fontSize: "0.82rem",
                    color: colors.textMuted,
                    lineHeight: "1.5",
                  }}
                >
                  {item.summary}
                  {item.url ? (
                    <div style={{ marginTop: "10px" }}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: colors.goldBright, fontSize: "0.78rem", textDecoration: "none" }}
                      >
                        Түпнұсқа дереккөзге өту →
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {!loading && news.length === 0 && !error ? (
        <p style={{ color: colors.textFaint, marginTop: "20px" }}>Жаңалық табылмады</p>
      ) : null}
    </main>
  );
}
