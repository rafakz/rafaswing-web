"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "./supabaseClient";

/* ---------- Бренд белгісі: жапон свичалары ---------- */
function NavLogoMark({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="11" y1="16" x2="11" y2="39" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_3px_#ef4444]" />
      <rect x="7.5" y="24" width="7" height="11" rx="1.5" fill="#ef4444" />

      <line x1="24" y1="8" x2="24" y2="41" stroke="#10b981" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_3px_#10b981]" />
      <rect x="20.5" y="17" width="7" height="18" rx="1.5" fill="#10b981" />

      <line x1="37" y1="4" x2="37" y2="33" stroke="#10b981" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_3px_#10b981]" />
      <rect x="33.5" y="11" width="7" height="16" rx="1.5" fill="#10b981" />
    </svg>
  );
}

/* ---------- Иконкалар: Tailwind currentColor арқылы басқарылады ---------- */
function IconHome({ size = 20, className = "", filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 11.5L12 4l8 7.5" />
      <path d="M6 10v8a1 1 0 001 1h3v-5.5h4V19h3a1 1 0 001-1v-8" />
    </svg>
  );
}
function IconMarkets({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" className={className}>
      <rect x="4" y="12.5" width="4" height="7.5" rx="1" />
      <rect x="10" y="8.5" width="4" height="11.5" rx="1" />
      <rect x="16" y="4.5" width="4" height="15.5" rx="1" />
    </svg>
  );
}
function IconStar({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className={className}>
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 6-5.2-2.8-5.2 2.8 1-6-4.3-4.2 5.9-.8L12 3.5z" />
    </svg>
  );
}
function IconBriefcase({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3.5" y="8" width="17" height="11" rx="1.8" />
      <path d="M8.5 8V6.5a1.5 1.5 0 011.5-1.5h4a1.5 1.5 0 011.5 1.5V8" />
      <path d="M3.5 13h17" />
    </svg>
  );
}
function IconFunnel({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" className={className}>
      <path d="M4 5h16l-6 7.5V18l-4 2v-7.5L4 5z" />
    </svg>
  );
}
function IconNews({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="5" width="13" height="14" rx="1.2" strokeWidth="1.6" />
      <path d="M17 8.5h2.2a0.8 0.8 0 01.8.8V18a1 1 0 01-1 1H8" strokeWidth="1.6" />
      <path d="M7 9h7M7 12h7M7 15h4" strokeWidth="1.4" />
    </svg>
  );
}
function IconSparkle({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinejoin="round" className={className}>
      <path d="M12 3.5l1.3 4.2 4.2 1.3-4.2 1.3-1.3 4.2-1.3-4.2-4.2-1.3 4.2-1.3L12 3.5z" strokeWidth="1.5" />
      <path d="M18.5 15l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9z" strokeWidth="1.2" />
    </svg>
  );
}
function IconBook({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 5.5c2-1 5-1 8 .5 3-1.5 6-1.5 8-.5v13c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5v-13z" />
      <path d="M12 6v13" />
    </svg>
  );
}
function IconGear({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className={className}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.7 6.3l-1.5 1.5M7.8 16.2l-1.5 1.5M17.7 17.7l-1.5-1.5M7.8 7.8L6.3 6.3" />
    </svg>
  );
}
function IconUser({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.5 19.5c1.4-3.4 4.2-5 7.5-5s6.1 1.6 7.5 5" />
    </svg>
  );
}
function IconLogout({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 4H6a1.5 1.5 0 00-1.5 1.5v13A1.5 1.5 0 006 20h3" />
      <path d="M14 16l4-4-4-4" />
      <path d="M18 12H9" />
    </svg>
  );
}
function IconSun({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9L5.3 5.3" />
    </svg>
  );
}
function IconMoon({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
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

/* ---------- Телефондағы төменгі мәзір ---------- */
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
        /* Күндізгі режимнің инверсиясы (қажет болса) */
        html.tradeiq-day { filter: invert(1) hue-rotate(180deg); }
        html.tradeiq-day img, html.tradeiq-day video { filter: invert(1) hue-rotate(180deg); }
        
        /* Мобильді құрылғыда мәзірдің артына контент кіріп кетпеуі үшін */
        @media (max-width: 1023px) {
          body { padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px)); }
        }
      `}</style>

      {/* ---------- ФОН (Оверлей) ---------- */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] lg:hidden transition-opacity" 
          onClick={() => setMobileOpen(false)} 
        />
      )}

      {/* ---------- DESKTOP / СИДЕБАР ---------- */}
      <nav 
        className={`fixed top-0 left-0 h-[100dvh] w-60 flex flex-col z-[80] bg-[#0b0f19]/95 backdrop-blur-xl border-r border-white/10 transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Логотип */}
        <div className="pt-8 pb-6 text-center">
          <NavLogoMark size={44} />
          <div className="mt-3 text-2xl font-bold tracking-[0.15em] text-white">TRADE<span className="text-blue-500">IQ</span></div>
          <div className="mt-1 text-[9px] font-bold tracking-widest text-blue-400">AI-POWERED TRADING</div>
        </div>

        {/* Навигация */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 h-11 px-4 rounded-xl text-sm transition-all duration-200 border ${
                  active 
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400 font-medium shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]" 
                    : "border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200"
                }`}
              >
                <l.Icon size={20} className={active ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" : ""} filled={active} />
                <span>{l.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Төменгі бөлік (Профиль / Тема) */}
        <div className="p-4 border-t border-white/5 bg-white/[0.02]">
          <button 
            type="button" 
            onClick={toggleDayMode}
            className="flex items-center justify-between w-full h-10 px-4 mb-4 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs hover:text-white transition"
          >
            <span>{dayMode ? "Түнгі режим" : "Күндізгі режим"}</span>
            {dayMode ? <IconMoon size={16} /> : <IconSun size={16} />}
          </button>

          {user ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-500/10 blur-xl"></div>
              <div className="relative inline-block mb-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-white/20 relative z-10" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#0b0f19] border border-white/20 text-white font-bold text-xl flex items-center justify-center relative z-10">
                    {initial || <IconUser size={24} />}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-blue-500 border-2 border-[#0b0f19] z-20 shadow-[0_0_5px_#3b82f6]"></span>
              </div>
              <div className="text-sm font-medium text-white truncate relative z-10">{displayName}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 relative z-10">Pro Аккаунт</div>
              <button type="button" onClick={handleLogout} className="mt-3 flex items-center justify-center gap-2 w-full text-xs text-gray-400 hover:text-red-400 transition relative z-10">
                <IconLogout size={14} />
                <span>Шығу</span>
              </button>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#0b0f19] border border-white/10 text-gray-500 flex items-center justify-center mx-auto mb-3">
                <IconUser size={24} />
              </div>
              <Link 
                href="/login" 
                onClick={() => setMobileOpen(false)} 
                className="block w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-[0_0_10px_rgba(37,99,235,0.3)] transition"
              >
                Кіру / Тіркелу
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ---------- ТӨМЕНГІ МӘЗІР (MOBILE BOTTOM TAB) ---------- */}
      <div className="fixed bottom-4 left-3 right-3 z-[60] lg:hidden">
        <div className="bg-[#0f1624]/85 backdrop-blur-xl border border-white/10 rounded-[2rem] px-4 py-3 flex justify-between items-center shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          {tabs.map((t) => {
            const active = isActive(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex flex-col items-center gap-1 min-w-0 flex-1 transition-colors ${active ? "text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "text-gray-500 hover:text-gray-300"}`}
              >
                <t.Icon size={22} filled={active} className={active ? "text-blue-500" : "text-gray-500"} />
                <span className="text-[9px] font-medium truncate max-w-full">{t.label}</span>
                {/* Жарқыраған активті нүкте */}
                {active && <div className="w-1 h-1 bg-blue-500 rounded-full mt-0.5 shadow-[0_0_8px_#3b82f6] absolute -bottom-1"></div>}
              </Link>
            );
          })}
          
          {/* Профиль / Мәзір батырмасы */}
          <button
            type="button"
            className={`flex flex-col items-center gap-1 min-w-0 flex-1 transition-colors relative ${profileActive || mobileOpen ? "text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "text-gray-500 hover:text-gray-300"}`}
            onClick={() => setMobileOpen(true)}
          >
            <IconUser size={22} className={profileActive || mobileOpen ? "text-blue-500" : "text-gray-500"} />
            <span className="text-[9px] font-medium truncate max-w-full">Мәзір</span>
            {(profileActive || mobileOpen) && <div className="w-1 h-1 bg-blue-500 rounded-full mt-0.5 shadow-[0_0_8px_#3b82f6] absolute -bottom-1"></div>}
          </button>
        </div>
      </div>
    </>
  );
}
