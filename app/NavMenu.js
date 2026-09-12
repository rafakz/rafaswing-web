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

/* ---------- Бренд белгісі (homepage-тегі TradeIQMark-пен үйлесімді) ---------- */
function NavLogoMark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="19" cy="5" r="1.6" fill={colors.gold} />
      <path
        d="M2 16.5L6 11l3 3 4-7 4 5 5-3"
        stroke={colors.gold}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/* ---------- Навигация иконкалары — бір стильде, сызықты (line icon) ---------- */
function IconHome({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11.5L12 4l8 7.5" />
      <path d="M6 10v8a1 1 0 001 1h3v-5.5h4V19h3a1 1 0 001-1v-8" />
    </svg>
  );
}
function IconMarkets({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="13" width="3.2" height="7" rx="0.8" fill={color} />
      <rect x="10.4" y="9" width="3.2" height="11" rx="0.8" fill={color} />
      <rect x="16.8" y="5" width="3.2" height="15" rx="0.8" fill={color} />
    </svg>
  );
}
function IconStar({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 6-5.2-2.8-5.2 2.8 1-6-4.3-4.2 5.9-.8L12 3.5z" />
    </svg>
  );
}
function IconBriefcase({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="8" width="17" height="11" rx="1.8" />
      <path d="M8.5 8V6.5a1.5 1.5 0 011.5-1.5h4a1.5 1.5 0 011.5 1.5V8" />
      <path d="M3.5 13h17" />
    </svg>
  );
}
function IconBell({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10.5a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14.5 6 10.5z" />
      <path d="M10 19a2 2 0 004 0" />
    </svg>
  );
}
function IconFunnel({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinejoin="round">
      <path d="M4 5h16l-6 7.5V18l-4 2v-7.5L4 5z" />
    </svg>
  );
}
function IconNews({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="5" width="13" height="14" rx="1.2" strokeWidth="1.6" />
      <path d="M17 8.5h2.2a0.8 0.8 0 01.8.8V18a1 1 0 01-1 1H8" strokeWidth="1.6" />
      <path d="M7 9h7M7 12h7M7 15h4" strokeWidth="1.4" />
    </svg>
  );
}
function IconSparkle({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeLinejoin="round">
      <path d="M12 3.5l1.3 4.2 4.2 1.3-4.2 1.3-1.3 4.2-1.3-4.2-4.2-1.3 4.2-1.3L12 3.5z" strokeWidth="1.5" />
      <path d="M18.5 15l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9z" strokeWidth="1.2" />
    </svg>
  );
}
function IconBook({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5.5c2-1 5-1 8 .5 3-1.5 6-1.5 8-.5v13c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5v-13z" />
      <path d="M12 6v13" />
    </svg>
  );
}
function IconGear({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.7 6.3l-1.5 1.5M7.8 16.2l-1.5 1.5M17.7 17.7l-1.5-1.5M7.8 7.8L6.3 6.3" />
    </svg>
  );
}
function IconUser({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.5 19.5c1.4-3.4 4.2-5 7.5-5s6.1 1.6 7.5 5" />
    </svg>
  );
}
function IconLogout({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4H6a1.5 1.5 0 00-1.5 1.5v13A1.5 1.5 0 006 20h3" />
      <path d="M14 16l4-4-4-4" />
      <path d="M18 12H9" />
    </svg>
  );
}

const links = [
  { href: "/", label: "Басты бет", Icon: IconHome },
  { href: "/markets", label: "Нарықтар", Icon: IconMarkets },
  { href: "/watchlist", label: "Таңдаулылар", Icon: IconStar },
  { href: "/portfolio", label: "Портфель", Icon: IconBriefcase },
  { href: "/alerts", label: "Дабылдар", Icon: IconBell },
  { href: "/screener", label: "Скринер", Icon: IconFunnel },
  { href: "/news", label: "Жаңалықтар", Icon: IconNews },
  { href: "/ai", label: "AI талдау", Icon: IconSparkle },
  { href: "/lessons", label: "Оқу орталығы", Icon: IconBook },
  { href: "/settings", label: "Параметрлер", Icon: IconGear },
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
          <NavLogoMark size={24} />
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
            const iconColor = active ? colors.goldBright : colors.textPrimary;
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
                <l.Icon size={18} color={iconColor} />
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
                  <IconUser size={16} color={colors.textPrimary} />
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
                <IconLogout size={16} color={colors.textMuted} />
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
              <IconUser size={17} color={colors.goldBright} />
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
