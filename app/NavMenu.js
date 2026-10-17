"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "./supabaseClient";

/* ---------- Жаңа дизайн түстері ---------- */
const colors = {
  accent: "#3b82f6", // Көк неон
  accentGlow: "rgba(59,130,246,0.8)",
  textPrimary: "#ffffff",
  textMuted: "#9ca3af",
  iconIdle: "#9ca3af",
  tabIdle: "#6b7280",
  iconSoft: "#6b7280",
  gain: "#10b981", // Жасыл
  loss: "#ef4444", // Қызыл
};

/* ---------- Бренд белгісі ---------- */
function NavLogoMark({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="11" y1="16" x2="11" y2="39" stroke={colors.loss} strokeWidth="3" strokeLinecap="round" style={{filter: 'drop-shadow(0 0 3px #ef4444)'}} />
      <rect x="7.5" y="24" width="7" height="11" rx="1.5" fill={colors.loss} />

      <line x1="24" y1="8" x2="24" y2="41" stroke={colors.gain} strokeWidth="3" strokeLinecap="round" style={{filter: 'drop-shadow(0 0 3px #10b981)'}} />
      <rect x="20.5" y="17" width="7" height="18" rx="1.5" fill={colors.gain} />

      <line x1="37" y1="4" x2="37" y2="33" stroke={colors.gain} strokeWidth="3" strokeLinecap="round" style={{filter: 'drop-shadow(0 0 3px #10b981)'}} />
      <rect x="33.5" y="11" width="7" height="16" rx="1.5" fill={colors.gain} />
    </svg>
  );
}

/* ---------- Иконкалар ---------- */
function IconHome({ size = 20, color, filled = false, glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={glow ? {filter: `drop-shadow(0 0 6px ${color})`} : {}}>
      <path d="M4 11.5L12 4l8 7.5" />
      <path d="M6 10v8a1 1 0 001 1h3v-5.5h4V19h3a1 1 0 001-1v-8" />
    </svg>
  );
}
function IconMarkets({ size = 20, color, glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinejoin="round" style={glow ? {filter: `drop-shadow(0 0 6px ${color})`} : {}}>
      <rect x="4" y="12.5" width="4" height="7.5" rx="1" />
      <rect x="10" y="8.5" width="4" height="11.5" rx="1" />
      <rect x="16" y="4.5" width="4" height="15.5" rx="1" />
    </svg>
  );
}
function IconStar({ size = 20, color, glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" style={glow ? {filter: `drop-shadow(0 0 6px ${color})`} : {}}>
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 6-5.2-2.8-5.2 2.8 1-6-4.3-4.2 5.9-.8L12 3.5z" />
    </svg>
  );
}
function IconBriefcase({ size = 20, color, glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={glow ? {filter: `drop-shadow(0 0 6px ${color})`} : {}}>
      <rect x="3.5" y="8" width="17" height="11" rx="1.8" />
      <path d="M8.5 8V6.5a1.5 1.5 0 011.5-1.5h4a1.5 1.5 0 011.5 1.5V8" />
      <path d="M3.5 13h17" />
    </svg>
  );
}
function IconFunnel({ size = 20, color, glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinejoin="round" style={glow ? {filter: `drop-shadow(0 0 6px ${color})`} : {}}>
      <path d="M4 5h16l-6 7.5V18l-4 2v-7.5L4 5z" />
    </svg>
  );
}
function IconNews({ size = 20, color, glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={glow ? {filter: `drop-shadow(0 0 6px ${color})`} : {}}>
      <rect x="4" y="5" width="13" height="14" rx="1.2" strokeWidth="1.6" />
      <path d="M17 8.5h2.2a0.8 0.8 0 01.8.8V18a1 1 0 01-1 1H8" strokeWidth="1.6" />
      <path d="M7 9h7M7 12h7M7 15h4" strokeWidth="1.4" />
    </svg>
  );
}
function IconSparkle({ size = 20, color, glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeLinejoin="round" style={glow ? {filter: `drop-shadow(0 0 6px ${color})`} : {}}>
      <path d="M12 3.5l1.3 4.2 4.2 1.3-4.2 1.3-1.3 4.2-1.3-4.2-4.2-1.3 4.2-1.3L12 3.5z" strokeWidth="1.5" />
      <path d="M18.5 15l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9z" strokeWidth="1.2" />
    </svg>
  );
}
function IconBook({ size = 20, color, glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={glow ? {filter: `drop-shadow(0 0 6px ${color})`} : {}}>
      <path d="M4 5.5c2-1 5-1 8 .5 3-1.5 6-1.5 8-.5v13c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5v-13z" />
      <path d="M12 6v13" />
    </svg>
  );
}
function IconGear({ size = 20, color, glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" style={glow ? {filter: `drop-shadow(0 0 6px ${color})`} : {}}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.7 6.3l-1.5 1.5M7.8 16.2l-1.5 1.5M17.7 17.7l-1.5-1.5M7.8 7.8L6.3 6.3" />
    </svg>
  );
}
function IconUser({ size = 20, color, glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={glow ? {filter: `drop-shadow(0 0 6px ${color})`} : {}}>
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

/* ---------- Сол жақ мәзір (Desktop) ---------- */
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

/* ---------- Төменгі мәзір (Mobile) ---------- */
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
    } catch (e) {}
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
    } catch (e) {}
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        /* Күндізгі режимнің инверсиясы */
        html.tradeiq-day { filter: invert(1) hue-rotate(180deg); }
        html.tradeiq-day img, html.tradeiq-day video { filter: invert(1) hue-rotate(180deg); }

        /* ---------- СИДЕБАР (ДЕСКТОП) ---------- */
        .tq-sidebar {
          position: fixed; top: 0; left: 0; height: 100vh; height: 100dvh; width: 240px;
          box-sizing: border-box; display: flex; flex-direction: column;
          background: rgba(11, 15, 25, 0.95); 
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255, 255, 255, 0.08); z-index: 80;
          transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Inter', -apple-system, sans-serif;
        }
        .tq-sidebar.tq-open { transform: translateX(0); }
        
        /* Оверлей (Фон) */
        .tq-overlay { 
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); 
          backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); 
          z-index: 70; opacity: 0; animation: tqFadeIn 0.3s forwards; 
        }

        /* Логотип аймағы */
        .tq-logo { padding: 32px 0 24px; text-align: center; }
        .tq-wordmark { margin-top: 12px; font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #ffffff; }
        .tq-wordmark span { color: #3b82f6; text-shadow: 0 0 10px rgba(59,130,246,0.6); }
        .tq-tagline { margin-top: 4px; font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #60a5fa; }

        /* Навигация сілтемелері */
        .tq-links { flex: 1; overflow-y: auto; padding: 0 12px; }
        .tq-link {
          display: flex; align-items: center; gap: 12px; height: 44px; box-sizing: border-box;
          margin-bottom: 4px; padding: 0 16px; border-radius: 12px; border: 1px solid transparent;
          color: #9ca3af; font-size: 14px; text-decoration: none; transition: all 0.2s ease;
        }
        .tq-link:hover { background: rgba(255,255,255,0.05); color: #e5e7eb; }
        .tq-link.tq-active { 
          background: rgba(59,130,246,0.1); 
          border-color: rgba(59,130,246,0.3); 
          color: #60a5fa; 
          font-weight: 600; 
          box-shadow: inset 0 0 15px rgba(59,130,246,0.1);
        }

        /* Төменгі бөлік (Профиль / Тема) */
        .tq-bottom { padding: 16px; border-top: 1px solid rgba(255,255,255,0.05); }
        .tq-day {
          display: flex; align-items: center; justify-content: space-between; width: 100%; height: 40px;
          margin-bottom: 16px; padding: 0 16px; border-radius: 12px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #9ca3af;
          font-size: 12px; cursor: pointer; transition: all 0.2s ease;
        }
        .tq-day:hover { color: #ffffff; background: rgba(255,255,255,0.08); }

        /* Профиль карточкасы */
        .tq-profile { 
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); 
          border-radius: 16px; padding: 16px; text-align: center; position: relative; overflow: hidden;
        }
        .tq-profile-bg { position: absolute; top: 0; left: 0; width: 100%; height: 50%; background: rgba(59,130,246,0.1); filter: blur(20px); z-index: 0; }
        .tq-avatar-wrap { position: relative; width: 48px; height: 48px; margin: 0 auto 12px; z-index: 1; }
        .tq-avatar { width: 48px; height: 48px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); object-fit: cover; }
        .tq-avatar-fallback { background: #0b0f19; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: #fff; font-size: 20px; font-weight: bold; width: 100%; height: 100%; border: 1px solid rgba(255,255,255,0.2); }
        .tq-avatar-dot { position: absolute; right: 0; bottom: 0; width: 12px; height: 12px; border-radius: 50%; background: #3b82f6; border: 2px solid #0b0f19; box-shadow: 0 0 5px #3b82f6; }
        .tq-pname { font-size: 14px; font-weight: 600; color: #ffffff; position: relative; z-index: 1; }
        .tq-psub { margin-top: 4px; font-size: 10px; color: #9ca3af; position: relative; z-index: 1; }
        .tq-logout {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px; margin-top: 12px; width: 100%;
          background: transparent; border: none; color: #9ca3af; font-size: 12px; cursor: pointer; position: relative; z-index: 1; transition: color 0.2s;
        }
        .tq-logout:hover { color: #ef4444; }
        .tq-login {
          display: block; padding: 10px; border-radius: 12px; background: #3b82f6; color: #fff;
          font-size: 12px; font-weight: 600; text-decoration: none; box-shadow: 0 0 10px rgba(59,130,246,0.3); transition: all 0.2s; position: relative; z-index: 1;
        }
        .tq-login:hover { background: #2563eb; }

        /* ---------- ТӨМЕНГІ МӘЗІР (MOBILE) ---------- */
        .tq-tabbar {
          position: fixed; left: 16px; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); z-index: 60;
          display: flex; justify-content: space-between; align-items: center; height: 64px; box-sizing: border-box; padding: 0 12px; border-radius: 32px;
          background: rgba(15, 22, 36, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.8);
          font-family: 'Inter', -apple-system, sans-serif;
        }
        .tq-tab {
          flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
          background: transparent; border: none; padding: 0; color: #6b7280; font-size: 9px; font-weight: 500;
          text-decoration: none; cursor: pointer; transition: all 0.2s; position: relative; height: 100%;
        }
        .tq-tab span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tq-tab.tq-tab-active { color: #3b82f6; text-shadow: 0 0 8px rgba(59,130,246,0.8); }
        .tq-tab-dot {
          position: absolute; bottom: 6px; width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; box-shadow: 0 0 8px #3b82f6;
        }

        /* Адаптация */
        @media (min-width: 1024px) {
          .tq-sidebar { transform: none; }
          .tq-overlay, .tq-tabbar { display: none; }
        }
        @media (max-width: 1023px) {
          body { padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px)); }
        }
        @keyframes tqFadeIn { to { opacity: 1; } }
      `}</style>

      {/* ---------- ФОН (Оверлей) ---------- */}
      {mobileOpen && <div className="tq-overlay" onClick={() => setMobileOpen(false)} />}

      {/* ---------- СИДЕБАР ---------- */}
      <nav className={"tq-sidebar" + (mobileOpen ? " tq-open" : "")}>
        <div className="tq-logo">
          <NavLogoMark size={44} />
          <div className="tq-wordmark">TRADE<span>IQ</span></div>
          <div className="tq-tagline">AI-POWERED TRADING</div>
        </div>

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
                <l.Icon size={20} color={active ? colors.accent : colors.iconIdle} filled={active} glow={active} />
                <span>{l.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="tq-bottom">
          <button type="button" className="tq-day" onClick={toggleDayMode}>
            <span>{dayMode ? "Түнгі режим" : "Күндізгі режим"}</span>
            {dayMode ? <IconMoon size={16} color={colors.iconSoft} /> : <IconSun size={16} color={colors.iconSoft} />}
          </button>

          {user ? (
            <div className="tq-profile">
              <div className="tq-profile-bg"></div>
              <div className="tq-avatar-wrap">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="tq-avatar" referrerPolicy="no-referrer" />
                ) : (
                  <div className="tq-avatar-fallback">
                    {initial || <IconUser size={22} color="#fff" />}
                  </div>
                )}
                <span className="tq-avatar-dot" />
              </div>
              <div className="tq-pname">{displayName}</div>
              <div className="tq-psub">Pro Аккаунт</div>
              <button type="button" className="tq-logout" onClick={handleLogout}>
                <IconLogout size={14} color="currentColor" />
                <span>Шығу</span>
              </button>
            </div>
          ) : (
            <div className="tq-profile">
              <div className="tq-avatar-wrap" style={{ margin: "0 auto 16px" }}>
                <div className="tq-avatar-fallback" style={{ background: "transparent", borderColor: "rgba(255,255,255,0.1)" }}>
                  <IconUser size={22} color={colors.iconSoft} />
                </div>
              </div>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="tq-login">
                Кіру / Тіркелу
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ---------- ТӨМЕНГІ МӘЗІР (MOBILE) ---------- */}
      <div className="tq-tabbar">
        {tabs.map((t) => {
          const active = isActive(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={"tq-tab" + (active ? " tq-tab-active" : "")}
            >
              <t.Icon size={22} color={active ? colors.accent : colors.tabIdle} filled={active} glow={active} />
              <span style={{ paddingBottom: active ? "8px" : "0", transition: "all 0.2s" }}>{t.label}</span>
              {active && <div className="tq-tab-dot"></div>}
            </Link>
          );
        })}
        <button
          type="button"
          className={"tq-tab" + (profileActive || mobileOpen ? " tq-tab-active" : "")}
          onClick={() => setMobileOpen(true)}
        >
          <IconUser size={22} color={profileActive || mobileOpen ? colors.accent : colors.tabIdle} glow={profileActive || mobileOpen} />
          <span style={{ paddingBottom: (profileActive || mobileOpen) ? "8px" : "0", transition: "all 0.2s" }}>Мәзір</span>
          {(profileActive || mobileOpen) && <div className="tq-tab-dot"></div>}
        </button>
      </div>
    </>
  );
}
