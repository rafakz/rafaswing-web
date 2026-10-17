"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "./supabaseClient";

const colors = {
  gain: "#25975F",
  loss: "#E5604F",
  bell: "#C6C7D4",
  chevron: "#7E869B",
  crown: "#1464F4",
};

/* Индекс орнына ETF көрсетіледі (баға — ETF бағасы, индекс деңгейі емес) */
const INDEX_MAP = [
  { symbol: "SPY", label: "S&P 500" },
  { symbol: "QQQ", label: "NASDAQ" },
];

function fmtPrice(v) {
  if (typeof v !== "number" || isNaN(v)) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(v) {
  if (typeof v !== "number" || isNaN(v)) return "—";
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}

/* ---------- Иконкалар ---------- */
function IconBell({ size = 22, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10.5a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14.5 6 10.5z" />
      <path d="M10 19a2 2 0 004 0" />
    </svg>
  );
}
function IconCrown({ size = 15, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8z" />
    </svg>
  );
}
function IconChevron({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function IconUser({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}

export default function Header({ overview }) {
  const [session, setSession] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
    setMenuOpen(false);
  }

  const user = session && session.user ? session.user : null;

  const indices = Array.isArray(overview)
    ? INDEX_MAP.map((m) => {
        const it = overview.find((o) => o && o.symbol === m.symbol);
        if (!it || it.error || typeof it.currentPrice !== "number") return null;
        return { symbol: m.symbol, label: m.label, price: it.currentPrice, pct: it.changePercent };
      }).filter(Boolean)
    : [];

  return (
    <>
      <style>{`
        .tq-head {
          display: flex; justify-content: flex-end; align-items: center; 
          width: 100%; box-sizing: border-box; padding: 16px 16px 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: relative; z-index: 50;
        }
        @media (min-width: 1024px) {
          .tq-head { padding: 24px 28px 0; justify-content: space-between; }
        }

        .tq-head-right { display: flex; align-items: center; gap: 12px; margin-left: auto; }
        
        .tq-idx-wrap { display: none; gap: 24px; margin-right: auto; }
        @media (min-width: 1100px) {
          .tq-idx-wrap { display: flex; }
        }
        
        .tq-idx-label { font-size: 11.5px; color: #A6A8B7; white-space: nowrap; }
        .tq-idx-value { margin-top: 4px; font-size: 14px; font-weight: 600; color: #F6F9FE; }
        .tq-idx-pct { margin-top: 2px; font-size: 11px; }

        .tq-bell {
          width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
          border-radius: 10px; transition: background 0.2s ease;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
        }
        .tq-bell:hover { background: rgba(255,255,255,0.08); }

        .tq-pro {
          display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: 10px;
          background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa;
          font-size: 13px; font-weight: 600; font-family: inherit; white-space: nowrap; cursor: pointer;
          transition: all 0.2s ease;
        }
        .tq-pro:hover { background: rgba(59,130,246,0.2); box-shadow: 0 0 10px rgba(59,130,246,0.2); }

        .tq-chev {
          height: 36px; padding: 0 10px; border-radius: 10px; display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); 
          cursor: pointer; transition: background 0.2s;
        }
        .tq-chev:hover { background: rgba(255,255,255,0.08); }

        .tq-menu-wrap { position: relative; }
        .tq-menu-bg { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 85; }
        .tq-menu {
          position: absolute; top: 44px; right: 0; min-width: 180px; z-index: 90; box-sizing: border-box;
          background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }
        .tq-menu-item {
          display: block; width: 100%; box-sizing: border-box; padding: 10px 14px; border-radius: 8px;
          background: transparent; border: none; text-align: left; text-decoration: none;
          color: #e2e8f0; font-size: 13px; font-family: inherit; cursor: pointer; transition: background 0.2s;
        }
        .tq-menu-item:hover { background: rgba(59,130,246,0.15); color: #fff; }
      `}</style>

      <div className="tq-head">
        
        {/* ---- ДК нұсқадағы индекстер (Телефонда көрінбейді) ---- */}
        {indices.length > 0 ? (
          <div className="tq-idx-wrap">
            {indices.map((ix) => (
              <div key={ix.symbol} className="tq-idx">
                <div className="tq-idx-label">{ix.label}</div>
                <div className="tq-idx-value">{fmtPrice(ix.price)}</div>
                <div className="tq-idx-pct" style={{ color: ix.pct >= 0 ? colors.gainBright : colors.lossBright }}>
                  {fmtPct(ix.pct)}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="tq-head-right">
          
          <Link href="/alerts" className="tq-bell" aria-label="Дабылдар">
            <IconBell size={18} color={colors.bell} />
          </Link>

          <button type="button" className="tq-pro">
            <IconCrown size={14} color={colors.goldBright} />
            <span>Pro</span>
          </button>

          <div className="tq-menu-wrap">
            <button
              type="button"
              className="tq-chev"
              aria-label="Аккаунт мәзірі"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <IconUser size={16} color={colors.bell} />
              <IconChevron size={14} color={colors.chevron} />
            </button>

            {menuOpen ? (
              <>
                <div className="tq-menu-bg" onClick={() => setMenuOpen(false)} />
                <div className="tq-menu">
                  {user ? (
                    <>
                      <Link href="/settings" className="tq-menu-item" onClick={() => setMenuOpen(false)}>
                        Параметрлер
                      </Link>
                      <Link href="/alerts" className="tq-menu-item" onClick={() => setMenuOpen(false)}>
                        Дабылдар
                      </Link>
                      <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "4px 0" }}></div>
                      <button type="button" className="tq-menu-item" onClick={handleLogout} style={{ color: colors.lossBright }}>
                        Шығу
                      </button>
                    </>
                  ) : (
                    <Link href="/login" className="tq-menu-item" onClick={() => setMenuOpen(false)}>
                      Кіру / Тіркелу
                    </Link>
                  )}
                </div>
              </>
            ) : null}
          </div>

        </div>
      </div>
    </>
  );
}
