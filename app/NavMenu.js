"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "./supabaseClient";

const colors = {
  bg: "#0B132B",
  card: "#0F1A3D",
  border: "#1E3A8A",
  gold: "#D4AF37",
  goldBright: "#E8C468",
  accentBlue: "#1E3A8A",
  textPrimary: "#F5F1E6",
  textMuted: "#8A93A6",
};

const fontBody = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const links = [
  { href: "/", label: "Басты бет", icon: "🏠" },
  { href: "/markets", label: "Нарықтар", icon: "📊" },
  { href: "/watchlist", label: "Таңдаулылар", icon: "⭐" },
  { href: "/portfolio", label: "Портфель", icon: "💼" },
  { href: "/alerts", label: "Дабылдар", icon: "🔔" },
  { href: "/screener", label: "Скринер", icon: "🛡️" },
  { href: "/news", label: "Жаңалықтар", icon: "📰" },
  { href: "/ai", label: "AI талдау", icon: "➕" },
  { href: "/lessons", label: "Оқу орталығы", icon: "📖" },
  { href: "/settings", label: "Параметрлер", icon: "⚙️" },
];

const SIDEBAR_WIDTH = "240px";

export default function NavMenu() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const pathname = usePathname();

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

  useEffect(() => {
    function checkWidth() {
      setIsDesktop(window.innerWidth >= 1024);
    }
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setMobileOpen(false);
  }

  const panelOpen = isDesktop ? true : mobileOpen;

  return (
    <>
      {/* ---------- ХАМБУРГЕР ТҰТҚАСЫ (тек мобильде) ---------- */}
      {!isDesktop && (
        <button
          onClick={() => setMobileOpen(true)}
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
      )}

      {/* ---------- ФОН (тек мобильде ашық болғанда) ---------- */}
      {!isDesktop && panelOpen ? (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 70,
          }}
        />
      ) : null}

      {/* ---------- SIDEBAR ---------- */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: SIDEBAR_WIDTH,
          background: colors.card,
          borderRight: `1px solid ${colors.border}`,
          zIndex: 80,
          transform: panelOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          display: "flex",
          flexDirection: "column",
          fontFamily: fontBody,
        }}
      >
        {/* ---- Логотип ---- */}
        <div
          style={{
            padding: "22px 22px 18px 22px",
            borderBottom: `1px solid ${colors.border}`,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "1.6rem" }}>📈</span>
          <div>
            <div
              style={{
                fontSize: "1.15rem",
                fontWeight: "800",
                letterSpacing: "0.5px",
                color: colors.textPrimary,
                lineHeight: 1.1,
              }}
            >
              TradeIQ
            </div>
            <div
              style={{
                fontSize: "0.6rem",
                letterSpacing: "1px",
                color: colors.gold,
                fontWeight: "600",
              }}
            >
              AI-POWERED TRADING
            </div>
          </div>
        </div>

        {/* ---- Навигация сілтемелері ---- */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 22px",
                  color: active ? colors.goldBright : colors.textPrimary,
                  background: active ? "rgba(201,162,39,0.08)" : "transparent",
                  textDecoration: "none",
                  fontSize: "0.92rem",
                  fontWeight: active ? "600" : "400",
                  borderLeft: `3px solid ${active ? colors.gold : "transparent"}`,
                }}
              >
                <span style={{ fontSize: "1.05rem" }}>{l.icon}</span>
                <span>{l.label}</span>
              </Link>
            );
          })}
        </div>

        {/* ---- Профиль / Кіру блогы ---- */}
        <div style={{ borderTop: `1px solid ${colors.border}`, padding: "14px 22px" }}>
          {session && session.user ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: colors.accentBlue,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: colors.textPrimary,
                    fontSize: "1rem",
                    flexShrink: 0,
                  }}
                >
                  👤
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: colors.textPrimary,
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {session.user.email}
                  </div>
                  <div style={{ color: colors.gold, fontSize: "0.68rem" }}>Аккаунт</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 0",
                  color: colors.textMuted,
                  background: "transparent",
                  border: "none",
                  fontSize: "0.85rem",
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: "1rem" }}>🚪</span>
                <span>Шығу</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: colors.goldBright,
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: "bold",
              }}
            >
              <span style={{ fontSize: "1.05rem" }}>👤</span>
              <span>Кіру / Тіркелу</span>
            </Link>
          )}

          <div style={{ marginTop: "12px", color: colors.textMuted, fontSize: "0.62rem" }}>
            © TradeIQ — дала рухымен сауда
          </div>
        </div>
      </nav>
    </>
  );
}
