"use client";

import { useState } from "react";

const colors = {
  bg: "#0B132B",
  card: "#0F1A3D",
  border: "#1E3A8A",
  gold: "#D4AF37",
  textPrimary: "#F5F1E6",
  textFaint: "#5B6478",
};

const fontBody = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export default function FloatingChat({
  chatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  chatError,
  onSubmit,
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ---------- ЖҮЗБЕЛІ ПАНЕЛЬ ---------- */}
      {open ? (
        <div
          className="tradeiq-card"
          style={{
            position: "fixed",
            bottom: "88px",
            right: "20px",
            width: "min(340px, calc(100vw - 40px))",
            maxHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            background: colors.card,
            borderRadius: "16px",
            padding: "18px",
            border: `1px solid ${colors.border}`,
            boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
            zIndex: 95,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: "bold",
                color: colors.gold,
                textTransform: "uppercase",
                letterSpacing: "0.6px",
              }}
            >
              💬 AI-мен сөйлесу
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Жабу"
              style={{
                background: "transparent",
                border: "none",
                color: colors.textFaint,
                fontSize: "1.1rem",
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", marginBottom: "12px" }}>
            {chatMessages.length === 0 ? (
              <p style={{ color: colors.textFaint, fontSize: "0.8rem", margin: 0 }}>
                Сауда, акциялар немесе талдау туралы сұрағыңды жаз.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {chatMessages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                      background: m.role === "user" ? colors.gold : colors.bg,
                      color: m.role === "user" ? colors.bg : colors.textPrimary,
                      border: m.role === "user" ? "none" : `1px solid ${colors.border}`,
                      borderRadius: "10px",
                      padding: "8px 12px",
                      fontSize: "0.82rem",
                      lineHeight: "1.4",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.text}
                  </div>
                ))}
                {chatLoading ? (
                  <div style={{ alignSelf: "flex-start", color: colors.textFaint, fontSize: "0.8rem" }}>
                    Жазып жатыр...
                  </div>
                ) : null}
              </div>
            )}
            {chatError ? (
              <p style={{ color: "#E2764C", fontSize: "0.78rem", marginTop: "8px" }}>{chatError}</p>
            ) : null}
          </div>

          <form onSubmit={onSubmit} style={{ display: "flex", gap: "8px" }}>
            <input
              className="tradeiq-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Сұрағыңды жаз..."
              style={{
                flex: 1,
                minWidth: 0,
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
              disabled={chatLoading}
              className="tradeiq-search-btn"
              style={{
                padding: "10px 16px",
                borderRadius: "10px",
                border: "none",
                background: colors.gold,
                color: colors.bg,
                fontWeight: "bold",
                fontSize: "0.85rem",
                fontFamily: fontBody,
                cursor: chatLoading ? "default" : "pointer",
                flexShrink: 0,
              }}
            >
              Жіберу
            </button>
          </form>
        </div>
      ) : null}

      {/* ---------- FAB БАТЫРМАСЫ ---------- */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="AI чатты ашу"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "54px",
          height: "54px",
          borderRadius: "50%",
          background: colors.gold,
          color: colors.bg,
          border: "none",
          fontSize: "1.4rem",
          cursor: "pointer",
          boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
          zIndex: 96,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}
