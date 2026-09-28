"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "./supabaseClient";

const colors = {
  card: "#0F1A3D",
  border: "#1E3A8A",
  gold: "#D4AF37",
  goldBright: "#E8C468",
  textPrimary: "#F5F1E6",
};

/* ---------- NavMenu-мен бірдей иконка тілі ---------- */
function IconBell({ size = 17, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10.5a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14.5 6 10.5z" />
      <path d="M10 19a2 2 0 004 0" />
    </svg>
  );
}
function IconCrown({ size = 14, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8z" />
    </svg>
  );
}

export default function Header() {
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

  return (
    <>
      <style>{`
        .tradeiq-header-bar { padding-left: 68px; }
        @media (min-width: 1024px) {
          .tradeiq-header-bar { padding-left: 24px; }
        }
        .tradeiq-header-icon-btn { transition: border-color 0.15s ease, transform 0.15s ease; }
        .tradeiq-header-icon-btn:hover { border-color: ${colors.gold}; transform: translateY(-1px); }
      `}</style>
      <div
        className="tradeiq-header-bar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          padding: "16px 24px 16px 68px",
          background: colors.card,
          borderBottom: `1px solid ${colors.border}`,
          width: "100%",
          boxSizing: "border-box",
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

      {/* ---- Дабылдар жарлығы + Pro жоспар ---- */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link
          href="/alerts"
          className="tradeiq-header-icon-btn"
          aria-label="Дабылдар"
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            border: `1px solid ${colors.border}`,
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconBell size={17} color={colors.textPrimary} />
        </Link>

        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
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
          <IconCrown size={14} color="#1a1400" />
          Pro жоспар
        </button>
      </div>
      </div>
    </>
  );
}
