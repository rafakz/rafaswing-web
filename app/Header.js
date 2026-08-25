"use client";

import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const colors = {
  card: "#0F1A3D",
  border: "#1E3A8A",
  gold: "#D4AF37",
  goldBright: "#E8C468",
  textPrimary: "#F5F1E6",
  textMuted: "#8A93A6",
  gain: "#4FA98B",
  loss: "#C2542D",
};

function safeNum(v, digits) {
  return typeof v === "number" && !isNaN(v) ? v.toFixed(digits) : "—";
}

export default function Header({ overview }) {
  const [session, setSession] = useState(null);

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

  const displayName =
    session && session.user
      ? (session.user.user_metadata && session.user.user_metadata.full_name) ||
        session.user.email
      : null;

  const indices = Array.isArray(overview) ? overview : [];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "14px",
        padding: "16px 24px",
        background: colors.card,
        borderBottom: `1px solid ${colors.border}`,
        width: "100%",
      }}
    >
      {/* ---- Сәлемдесу ---- */}
      <div style={{ fontSize: "0.95rem", fontWeight: "600", color: colors.textPrimary, minWidth: "160px" }}>
        {displayName ? (
          <>
            Қош келдіңіз, <span style={{ color: colors.goldBright }}>{displayName}</span>!
          </>
        ) : (
          "Қош келдіңіз!"
        )}
      </div>

      {/* ---- Индекстер ---- */}
      <div style={{ display: "flex", gap: "22px", flexWrap: "wrap" }}>
        {indices.map((item) => {
          const up = typeof item.change === "number" && item.change >= 0;
          return (
            <div key={item.symbol} style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
              <span style={{ color: colors.textMuted }}>{item.label}</span>{" "}
              <span
                style={{
                  fontWeight: "700",
                  color: item.error ? colors.textMuted : up ? colors.gain : colors.loss,
                }}
              >
                {item.error ? "—" : safeNum(item.currentPrice, 2)}
              </span>
            </div>
          );
        })}
      </div>

      {/* ---- Pro жоспар ---- */}
      <button
        style={{
          background: colors.gold,
          color: "#1a1400",
          fontWeight: "700",
          fontSize: "0.8rem",
          padding: "8px 16px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        👑 Pro жоспар
      </button>
    </div>
  );
}
