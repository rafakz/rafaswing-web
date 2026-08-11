"use client";

import { useState } from "react";

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function searchStock(e) {
    e.preventDefault();
    if (!ticker.trim()) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch(
        `/api/stock?symbol=${ticker.trim().toUpperCase()}`
      );
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Қате шықты");
      } else {
        setData(json);
      }
    } catch (err) {
      setError("Байланыс қатесі");
    } finally {
      setLoading(false);
    }
  }

  const isUp = data && data.change >= 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", marginBottom: "4px" }}>
        🚀 RafaSwing
      </h1>
      <p style={{ color: "#94a3b8", marginBottom: "24px", fontSize: "0.9rem" }}>
        Swing trading & investment platform
      </p>

      <form
        onSubmit={searchStock}
        style={{ display: "flex", gap: "8px", width: "100%", maxWidth: "360px" }}
      >
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="Ticker жаз (мыс. AAPL)"
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid #334155",
            background: "#1e293b",
            color: "white",
            fontSize: "1rem",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "12px 20px",
            borderRadius: "10px",
            border: "none",
            background: "#22c55e",
            color: "#0f172a",
            fontWeight: "bold",
            fontSize: "1rem",
          }}
        >
          Іздеу
        </button>
      </form>

      {loading && (
        <p style={{ marginTop: "24px", color: "#94a3b8" }}>Жүктелуде...</p>
      )}

      {error && (
        <p style={{ marginTop: "24px", color: "#f87171" }}>{error}</p>
      )}

      {data && (
        <div
          style={{
            marginTop: "24px",
            width: "100%",
            maxWidth: "360px",
            background: "#1e293b",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {data.logo && (
              <img
                src={data.logo}
                alt={data.symbol}
                width={36}
                height={36}
                style={{ borderRadius: "8px" }}
              />
            )}
            <div>
              <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                {data.symbol}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                {data.name}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "16px", display: "flex", alignItems: "baseline", gap: "10px" }}>
            <span style={{ fontSize: "1.8rem", fontWeight: "bold" }}>
              ${data.currentPrice.toFixed(2)}
            </span>
            <span
              style={{
                fontSize: "1rem",
                color: isUp ? "#4ade80" : "#f87171",
              }}
            >
              {isUp ? "▲" : "▼"} {data.change.toFixed(2)} (
              {data.changePercent.toFixed(2)}%)
            </span>
          </div>

          <div
            style={{
              marginTop: "16px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              fontSize: "0.85rem",
              color: "#cbd5e1",
            }}
          >
            <div>Ашылу: ${data.open.toFixed(2)}</div>
            <div>Жабылу (алдыңғы): ${data.previousClose.toFixed(2)}</div>
            <div>Максимум: ${data.high.toFixed(2)}</div>
            <div>Минимум: ${data.low.toFixed(2)}</div>
            {data.marketCap && (
              <div>Market Cap: ${data.marketCap.toFixed(0)}M</div>
            )}
            {data.industry && <div>Сала: {data.industry}</div>}
          </div>
        </div>
      )}
    </main>
  );
}
