"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "./supabaseClient";

/* ---------- Түстер (мокаптан өлшенген) ---------- */
const colors = {
  accent: "#0B62F5",
  textPrimary: "#F7FAFE",
  textMuted: "#B9BCCA",
  iconIdle: "#AFB1BE",
  tabIdle: "#A7ACBB",
  iconSoft: "#B6B9C9",
  gain: "#25975F",
  loss: "#E5604F",
};

/* ---------- Бренд белгісі: жапон свичалары ---------- */
function NavLogoMark({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="11" y1="16" x2="11" y2="39" stroke={colors.loss} strokeWidth="3" strokeLinecap="round" />
      <rect x="7.5" y="24" width="7" height="11" rx="1.5" fill={colors.loss} />

      <line x1="24" y1="8" x2="24" y2="41" stroke={colors.gain} strokeWidth="3" strokeLinecap="round" />
      <rect x="20.5" y="17" width="7" height="18" rx="1.5" fill={colors.gain} />

      <line x1="37" y1="4" x2="37" y2="33" stroke={colors.gain} strokeWidth="3" strokeLinecap="round" />
      <rect x="33.5" y="11" width="7" height="16" rx="1.5" fill={colors.gain} />
    </svg>
  );
}

/* ---------- Иконкалар: бір стильде, сызықты (line icon) ---------- */
function IconHome({ size = 20, color, filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11.5L12 4l8 7.5" />
      <path d="M6 10v8a1 1 0 001 1h3v-5.5h4V19h3a1 1 0 001-1v-8" />
    </svg>
  );
}
function IconMarkets({ size = 20, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinejoin="round">
      <rect x="4" y="12.5" width="4" height="7.5" rx="1" />
      <rect x="10" y="8.5" width="4" height="11.5" rx="1" />
      <rect x="16" y="4.5" width="4" height="15.5" rx="1" />
    </svg>
  );
}
function IconStar({ size = 20, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 6-5.2-2.8-5.2 2.8 1-6-4.3-4.2 5.9-.8L12 3.5z" />
    </svg>
  );
}
function IconBriefcase({ size = 20, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="8" width="17" height="11" rx="1.8" />
      <path d="M8.5 8V6.5a1.5 1.5 0 011.5-1.5h4a1.5 1.5 0 011.5 1.5V8" />
      <path d="M3.5 13h17" />
    </svg>
  );
}
function IconFunnel({ size = 20, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinejoin="round">
      <path d="M4 5h16l-6 7.5V18l-4 2v-7.5L4 5z" />
    </svg>
  );
}
function IconNews({ size = 20, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="5" width="13" height="14" rx="1.2" strokeWidth="1.6" />
      <path d="M17 8.5h2.2a0.8 0.8 0 01.8.8V18a1 1 0 01-1 1H8" strokeWidth="1.6" />
      <path d="M7 9h7M7 12h7M7 15h4" strokeWidth="1.4" />
    </svg>
  );
}
function IconSparkle({ size = 20, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeLinejoin="round">
      <path d="M12 3.5l1.3 4.2 4.2 1.3-4.2 1.3-1.3 4.2-1.3-4.2-4.2-1.3 4.2-1.3L12 3.5z" strokeWidth="1.5" />
      <path d="M18.5 15l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9z" strokeWidth="1.2" />
    </svg>
  );
}
function IconBook({ size = 20, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5.5c2-1 5-1 8 .5 3-1.5 6-1.5 8-.5v13c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5v-13z" />
      <path d="M12 6v13" />
    </svg>
  );
}
function IconGear({ size = 20, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.7 6.3l-1.5 1.5M7.8 16.2l-1.5 1.5M17.7 17.7l-1.5-1.5M7.8 7.8L6.3 6.3" />
    </svg>
  );
}
function IconUser({ size = 20, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.5 19.5c1.4-3.4 4.2-5 7.5-5s6.1 1.6 7.5 5" />
    </svg>
  );
}
function IconLogout({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4H6a1.5 1.5 0 00-1.5 1.5v13A1.5 1.5 0 006 20h3" />
      <path d="M14 16l4-4-4-4" />
      <path d="M18 12H9" />
    </svg>
  );
}
function IconSun({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9L5.3 5.3" />
    </svg>
  );
}
function IconMoon({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/* ---------- Сол жақ мәзір (мокаптағы 9 пункт) ---------- */
const links = [
  { href: "/", label: "Басты бет", Icon: IconHome },
  { href: "/markets", label: "Нарықтар", Icon: IconMarkets },
  { href: "/watchlist", label: "Таңдаулылар", Icon: IconStar },
  { href: "/portfolio", label: "Портфель", Icon: IconBriefcase },
  { href: "/screener", label: "Скринер", Icon: IconFunnel },
  { href: "/news", label: "Жаңалықтар", Icon: IconNews },
  { href: "/ai", label: "AI талдау", Icon: IconSparkle },
  { href: "/lessons", label: "Оқу орталығы", Icon: IconBook },
  { href: "/settings", label: "Параметрлер", Icon: IconGear },
];

/* ---------- Телефондағы төменгі мәзір (мокаптағы 7 пункт, соңғысы — Профиль) ---------- */
const tabs = [
  { href: "/", label: "Басты бет", Icon: IconHome },
  { href: "/markets", label: "Нарықтар", Icon: IconMarkets },
  { href: "/screener", label: "Скринер", Icon: IconFunnel },
  { href: "/portfolio", label: "Портфель", Icon: IconBriefcase },
  { href: "/news", label: "Жаңалықтар", Icon: IconNews },
  { href: "/ai", label: "AI талдау", Icon: IconSparkle },
];

export default function NavMenu() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [dayMode, setDayMode] = useState(false);
  const pathname = usePathname();
  const path = pathname || "";

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
    try {
      if (window.localStorage.getItem("tradeiq-day-mode") === "1") setDayMode(true);
    } catch (e) {
      // үнсіз
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (dayMode) root.classList.add("tradeiq-day");
    else root.classList.remove("tradeiq-day");
  }, [dayMode]);

  function toggleDayMode() {
    const next = !dayMode;
    setDayMode(next);
    try {
      window.localStorage.setItem("tradeiq-day-mode", next ? "1" : "0");
    } catch (e) {
      // үнсіз
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setMobileOpen(false);
  }

  function isActive(href) {
    if (href === "/") return path === "/";
    return path === href || path.startsWith(href + "/");
  }

  const user = session && session.user ? session.user : null;
  const meta = user && user.user_metadata ? user.user_metadata : {};
  const displayName = user
    ? meta.full_name || meta.name || (user.email ? user.email.split("@")[0] : "Аккаунт")
    : "";
  const avatarUrl = meta.avatar_url || meta.picture || "";
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "";
  const profileActive = path === "/settings" || path === "/login";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        html.tradeiq-day { filter: invert(1) hue-rotate(180deg); }
        html.tradeiq-day img, html.tradeiq-day video { filter: invert(1) hue-rotate(180deg); }

        .tq-sidebar {
          position: fixed; top: 0; left: 0; height: 100vh; height: 100dvh; width: 240px;
          box-sizing: border-box; display: flex; flex-direction: column;
          background: #01091C; border-right: 1px solid #131E34; z-index: 80;
          transform: translateX(-100%); transition: transform 0.25s ease;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .tq-sidebar.tq-open { transform: translateX(0); }
        .tq-overlay { position: fixed; top: 0; right: 0; bottom: 0; left: 0; background: rgba(0,0,0,0.55); z-index: 70; }

        .tq-logo { padding: 26px 0 18px; text-align: center; }
        .tq-wordmark { margin-top: 10px; padding-left: 3px; font-size: 24px; font-weight: 500; letter-spacing: 3px; line-height: 1.1; color: #DBE0EC; }
        .tq-tagline { margin-top: 6px; padding-left: 1.6px; font-size: 9px; letter-spacing: 1.6px; color: #C2C8D5; }

        .tq-links { flex: 1; min-height: 0; overflow-y: auto; padding: 10px 0 8px; }
        .tq-link {
          display: flex; align-items: center; gap: 14px; height: 44px; box-sizing: border-box;
          margin: 0 14px 9px; padding: 0 14px; border-radius: 10px; border: 1px solid transparent;
          color: #EAECF6; font-size: 15px; font-weight: 400; text-decoration: none;
          transition: background 0.15s ease;
        }
        .tq-link:hover { background: rgba(11,98,245,0.08); }
        .tq-link.tq-active { background: #011133; border-color: #0B1940; color: #F0F5FF; font-weight: 500; }

        .tq-bottom { padding: 12px 14px 16px; }
        .tq-day {
          display: flex; align-items: center; justify-content: space-between; width: 100%; height: 36px;
          box-sizing: border-box; margin-bottom: 14px; padding: 0 14px; border-radius: 10px;
          background: #041124; border: 1px solid #0B1628; color: #8E93A2;
          font-size: 13px; font-family: inherit; cursor: pointer;
        }
        .tq-profile { background: #051024; border: 1px solid #0B1628; border-radius: 12px; padding: 14px 10px 12px; text-align: center; }
        .tq-avatar-wrap { position: relative; width: 52px; height: 52px; margin: 0 auto 10px; }
        .tq-avatar { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
        .tq-avatar-fallback { background: #0A1F4D; border: 1px solid #131E34; color: #F7FAFE; font-size: 20px; font-weight: 600; }
        .tq-avatar-dot { position: absolute; right: 1px; bottom: 1px; width: 13px; height: 13px; border-radius: 50%; background: #0B62F5; border: 2px solid #051024; }
        .tq-pname { font-size: 14px; font-weight: 500; color: #F1F6FE; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tq-psub { margin-top: 3px; font-size: 12px; color: #8990A1; }
        .tq-logout {
          display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; padding: 4px 8px;
          background: transparent; border: none; color: #868C9E; font-size: 12px; font-family: inherit; cursor: pointer;
        }
        .tq-login {
          display: block; padding: 9px 10px; border-radius: 8px; background: #0448D0; color: #FFFFFF;
          font-size: 13px; font-weight: 600; text-decoration: none;
        }

        .tq-tabbar {
          position: fixed; left: 8px; right: 8px; bottom: calc(8px + env(safe-area-inset-bottom, 0px)); z-index: 60;
          display: flex; height: 62px; box-sizing: border-box; padding: 0 4px; border-radius: 16px;
          background: #04132A; border: 1px solid #0F1B33;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .tq-tab {
          flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
          background: transparent; border: none; padding: 0; color: #8C90A1; font-size: 9.5px; font-family: inherit;
          text-decoration: none; cursor: pointer;
        }
        .tq-tab span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tq-tab.tq-tab-active { color: #0B62F5; }

        @media (min-width: 1024px) {
          .tq-sidebar { transform: none; }
          .tq-overlay, .tq-tabbar { display: none; }
        }
        @media (max-width: 1023px) {
          body { padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px)); }
        }
      `}</style>

      {/* ---------- ФОН (тек телефонда, мәзір ашық кезде) ---------- */}
      {mobileOpen ? <div className="tq-overlay" onClick={() => setMobileOpen(false)} /> : null}

      {/* ---------- SIDEBAR ---------- */}
      <nav className={"tq-sidebar" + (mobileOpen ? " tq-open" : "")}>
        {/* ---- Логотип ---- */}
        <div className="tq-logo">
          <NavLogoMark size={44} />
          <div className="tq-wordmark">TRADEIQ</div>
          <div className="tq-tagline">AI-POWERED TRADING</div>
        </div>

        {/* ---- Навигация сілтемелері ---- */}
        <div className="tq-links">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={"tq-link" + (active ? " tq-active" : "")}
              >
                <l.Icon size={22} color={active ? colors.accent : colors.iconIdle} filled={active} />
                <span>{l.label}</span>
              </Link>
            );
          })}
        </div>

        {/* ---- Күндізгі режим + Профиль ---- */}
        <div className="tq-bottom">
          <button type="button" className="tq-day" onClick={toggleDayMode}>
            <span>{dayMode ? "Түнгі режим" : "Күндізгі режим"}</span>
            {dayMode ? (
              <IconMoon size={18} color={colors.iconSoft} />
            ) : (
              <IconSun size={18} color={colors.iconSoft} />
            )}
          </button>

          {user ? (
            <div className="tq-profile">
              <div className="tq-avatar-wrap">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="tq-avatar" referrerPolicy="no-referrer" />
                ) : (
                  <div className="tq-avatar tq-avatar-fallback">
                    {initial || <IconUser size={24} color={colors.textPrimary} />}
                  </div>
                )}
                <span className="tq-avatar-dot" />
              </div>
              <div className="tq-pname">{displayName}</div>
              <div className="tq-psub">Аккаунт</div>
              <button type="button" className="tq-logout" onClick={handleLogout}>
                <IconLogout size={14} color="#868C9E" />
                <span>Шығу</span>
              </button>
            </div>
          ) : (
            <div className="tq-profile">
              <div className="tq-avatar-wrap">
                <div className="tq-avatar tq-avatar-fallback">
                  <IconUser size={24} color={colors.textMuted} />
                </div>
              </div>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="tq-login">
                Кіру / Тіркелу
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ---------- ТӨМЕНГІ МӘЗІР (тек телефонда) ---------- */}
      <div className="tq-tabbar">
        {tabs.map((t) => {
          const active = isActive(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={"tq-tab" + (active ? " tq-tab-active" : "")}
            >
              <t.Icon size={22} color={active ? colors.accent : colors.tabIdle} filled={active} />
              <span>{t.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={"tq-tab" + (profileActive ? " tq-tab-active" : "")}
          onClick={() => setMobileOpen(true)}
        >
          <IconUser size={22} color={profileActive ? colors.accent : colors.tabIdle} />
          <span>Профиль</span>
        </button>
      </div>
    </>
  );
}
