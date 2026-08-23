"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "./supabaseClient";

const colors = {
  bg: "#0B0F1A",
  card: "#141B2E",
  border: "#263248",
  gold: "#C9A227",
  goldBright: "#E8C468",
  textPrimary: "#F5F1E6",
  textMuted: "#8A93A6",
};

const fontBody = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const links = [
  { href: "/", label: "Басты бет", icon: "🏠" },
  { href: "/watchlist", label: "Таңдаулылар", icon: "⭐" },
  { href: "/news", label: "Жаңалықтар", icon: "📰" },
  { href: "/lessons", label: "Уроки", icon: "🎓" },
];

export default function NavMenu() {
  const [open, setOpen] = useState(false);
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

  async function handleLogout() {
    await supabase.auth.signOut();
    setOpen(false);
  }

  return (
    <>
      {/* ---------- ХАМБУРГЕР ТҰТҚАСЫ ---------- */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Мәню"
        style={{
          position: "fixed",
          top: "16px",
          left: "16px",
          zIndex: 60,
          width: "42px",
          height: "42px",
          borderRadius: "10px",
          border: `1px solid ${colors.border}`,
          background: colors.card,
          color: colors.textPrimary,
          fontSize: "1.2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        ☰
      </button>

      {/* ---------- ФОН (OVERLAY) ---------- */}
      {open ? (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 70,
          }}
        />
      ) : null}

      {/* ---------- СЫҒАЛАТЫН ПАНЕЛЬ ---------- */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "240px",
          background: colors.card,
          borderRight: `1px solid ${colors.border}`,
          zIndex: 80,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          display: "flex",
          flexDirection: "column",
          padding: "70px 0 20px 0",
          fontFamily: fontBody,
        }}
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 22px",
              color: colors.textPrimary,
              textDecoration: "none",
              fontSize: "0.95rem",
              borderLeft: `3px solid transparent`,
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>{l.icon}</span>
            <span>{l.label}</span>
          </Link>
        ))}

        <div style={{ marginTop: "auto", borderTop: `1px solid ${colors.border}`, paddingTop: "14px" }}>
          {session && session.user ? (
            <>
              <div
                style={{
                  padding: "0 22px 10px 22px",
                  color: colors.textMuted,
                  fontSize: "0.72rem",
                  wordBreak: "break-all",
                }}
              >
                {session.user.email}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 22px",
                  color: colors.textPrimary,
                  background: "transparent",
                  border: "none",
                  fontSize: "0.9rem",
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>🚪</span>
                <span>Шығу</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 22px",
                color: colors.goldBright,
                textDecoration: "none",
                fontSize: "0.9rem",
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>👤</span>
              <span>Кіру / Тіркелу</span>
            </Link>
          )}

          <div style={{ padding: "10px 22px 0 22px", color: colors.textMuted, fontSize: "0.65rem" }}>
            © Ноғай — дала рухымен сауда
          </div>
        </div>
      </nav>
    </>
  );
}
