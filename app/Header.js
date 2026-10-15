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
  { symbol: "SPY", label: "S&P 500 (SPY)" },
  { symbol: "ONEQ", label: "NASDAQ (ONEQ)" },
  { symbol: "QQQ", label: "NASDAQ 100 (QQQ)" },
];

function fmtPrice(v) {
  if (typeof v !== "number" || isNaN(v)) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(v) {
  if (typeof v !== "number" || isNaN(v)) return "—";
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}

/* ---------- NavMenu-мен бірдей иконка тілі ---------- */
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
  const meta = user && user.user_metadata ? user.user_metadata : {};
  const displayName = user
    ? meta.full_name || meta.name || (user.email ? user.email.split("@")[0] : "")
    : "";

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
          display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
          gap: 16px 20px; width: 100%; box-sizing: border-box; padding: 20px 16px 8px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        @media (min-width: 1024px) {
          .tq-head { padding: 26px 28px 8px; }
        }
        .tq-hello { font-size: clamp(20px, 5vw, 26px); font-weight: 500; line-height: 1.3; color: #F7FAFE; }
        .tq-sub { margin-top: 8px; font-size: 14px; color: #B9BCCA; }

        .tq-head-right { display: flex; align-items: center; gap: 10px; margin-left: auto; }
        .tq-idx-wrap { display: none; gap: 26px; margin-right: 14px; }
        .tq-idx-3 { display: none; }
        @media (min-width: 1100px) {
          .tq-idx-wrap { display: flex; }
        }
        @media (min-width: 1280px) {
          .tq-idx-3 { display: block; }
        }
        .tq-idx-label { font-size: 11.5px; color: #A6A8B7; white-space: nowrap; }
        .tq-idx-value { margin-top: 6px; font-size: 15px; font-weight: 500; color: #F6F9FE; }
        .tq-idx-pct { margin-top: 3px; font-size: 12px; }

        .tq-bell {
          width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
          border-radius: 10px; transition: background 0.15s ease;
        }
        .tq-bell:hover { background: rgba(255,255,255,0.05); }

        .tq-pro {
          display: flex; align-items: center; gap: 8px; height: 34px; padding: 0 14px; border-radius: 8px;
          background: #00103C; border: 1px solid #173473; color: #7AA2EE;
          font-size: 13px; font-weight: 500; font-family: inherit; white-space: nowrap; cursor: pointer;
        }
        .tq-chev {
          width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
          background: #07132B; border: 1px solid #131E34; cursor: pointer; padding: 0;
        }

        .tq-menu-wrap { position: relative; }
        .tq-menu-bg { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 85; }
        .tq-menu {
          position: absolute; top: 42px; right: 0; min-width: 190px; z-index: 90; box-sizing: border-box;
          background: #000E23; border: 1px solid #131E34; border-radius: 12px; padding: 6px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.45);
        }
        .tq-menu-item {
          display: block; width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px;
          background: transparent; border: none; text-align: left; text-decoration: none;
          color: #EAECF6; font-size: 14px; font-family: inherit; cursor: pointer;
        }
        .tq-menu-item:hover { background: rgba(11,98,245,0.12); }
      `}</style>

      <div className="tq-head">
        {/* ---- Сәлемдесу ---- */}
        <div>
          <div className="tq-hello">
            {displayName ? (
              <>
                Қош келдіңіз,
                <br />
                {displayName}!
              </>
            ) : (
              "Қош келдіңіз!"
            )}
          </div>
          <div className="tq-sub">Ақылды инвестиция. Нақты талдау.</div>
        </div>

        <div className="tq-head-right">
          {/* ---- Индекстер (басты бетте ғана, overview келгенде) ---- */}
          {indices.length > 0 ? (
            <div className="tq-idx-wrap">
              {indices.map((ix, i) => (
                <div key={ix.symbol} className={i === 2 ? "tq-idx tq-idx-3" : "tq-idx"}>
                  <div className="tq-idx-label">{ix.label}</div>
                  <div className="tq-idx-value">{fmtPrice(ix.price)}</div>
                  <div className="tq-idx-pct" style={{ color: ix.pct >= 0 ? colors.gain : colors.loss }}>
                    {fmtPct(ix.pct)}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* ---- Дабылдар + Pro жоспар + аккаунт мәзірі ---- */}
          <Link href="/alerts" className="tq-bell" aria-label="Дабылдар">
            <IconBell size={22} color={colors.bell} />
          </Link>

          <button type="button" className="tq-pro">
            <IconCrown size={15} color={colors.crown} />
            <span>Pro жоспар</span>
          </button>

          <div className="tq-menu-wrap">
            <button
              type="button"
              className="tq-chev"
              aria-label="Аккаунт мәзірі"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <IconChevron size={16} color={colors.chevron} />
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
                      <button type="button" className="tq-menu-item" onClick={handleLogout}>
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
