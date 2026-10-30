"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "./supabaseClient";
import { color, font, radius, size, motion } from "../lib/theme";
import { Button } from "./ui";

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
function IconBell({ size: s = 18, c }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10.5a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14.5 6 10.5z" />
      <path d="M10 19a2 2 0 004 0" />
    </svg>
  );
}
function IconCrown({ size: s = 14, c }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c} xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8z" />
    </svg>
  );
}
function IconChevron({ size: s = 14, c }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function IconUser({ size: s = 16, c }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
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

  const iconBtn = {
    height: size.buttonHeight,
    minWidth: size.buttonHeight,
    borderRadius: radius.md,
    background: color.surfaceInput,
    border: `1px solid ${color.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "0 10px",
    cursor: "pointer",
    transition: `background ${motion.fast}`,
    color: color.textSecondary,
  };

  return (
    <>
      <style>{`
        .tq-head {
          display: flex; justify-content: flex-end; align-items: center;
          width: 100%; box-sizing: border-box; padding: 16px 16px 0;
          font-family: ${font.family};
          position: relative; z-index: 50;
        }
        @media (min-width: 1024px) {
          .tq-head { padding: 24px 28px 0; justify-content: space-between; }
        }
        .tq-head-right { display: flex; align-items: center; gap: 12px; margin-left: auto; }

        .tq-idx-wrap { display: none; gap: 24px; margin-right: auto; }
        @media (min-width: 1100px) { .tq-idx-wrap { display: flex; } }
        .tq-idx-label { font-size: 11.5px; color: ${color.textMuted}; white-space: nowrap; }
        .tq-idx-value { margin-top: 4px; font-size: 14px; font-weight: ${font.semibold}; color: ${color.textPrimary}; }
        .tq-idx-pct { margin-top: 2px; font-size: 11px; }

        .tq-bell:hover, .tq-chev:hover { background: ${color.border}; }

        .tq-menu-wrap { position: relative; }
        .tq-menu-bg { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 85; }
        .tq-menu {
          position: absolute; top: 44px; right: 0; min-width: 180px; z-index: 90; box-sizing: border-box;
          background: ${color.surface}; border: 1px solid ${color.border};
          border-radius: ${radius.lg}px; padding: 8px;
        }
        .tq-menu-item {
          display: block; width: 100%; box-sizing: border-box; padding: 10px 14px; border-radius: ${radius.sm}px;
          background: transparent; border: none; text-align: left; text-decoration: none;
          color: ${color.textPrimary}; font-size: 13px; font-family: inherit; cursor: pointer;
          transition: background ${motion.fast};
        }
        .tq-menu-item:hover { background: ${color.accentSoft}; }
      `}</style>

      <div className="tq-head">
        {indices.length > 0 ? (
          <div className="tq-idx-wrap">
            {indices.map((ix) => (
              <div key={ix.symbol}>
                <div className="tq-idx-label">{ix.label}</div>
                <div className="tq-idx-value">{fmtPrice(ix.price)}</div>
                <div className="tq-idx-pct" style={{ color: ix.pct >= 0 ? color.gainStrong : color.lossStrong }}>
                  {fmtPct(ix.pct)}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="tq-head-right">
          <Link href="/alerts" className="tq-bell" aria-label="Дабылдар" style={iconBtn}>
            <IconBell size={18} c={color.textSecondary} />
          </Link>

          <Button variant="outline" style={{ height: size.buttonHeight, display: "flex", alignItems: "center", gap: 6 }}>
            <IconCrown size={14} c={color.accentText} />
            <span>Pro</span>
          </Button>

          <div className="tq-menu-wrap">
            <button
              type="button"
              className="tq-chev"
              aria-label="Аккаунт мәзірі"
              onClick={() => setMenuOpen((v) => !v)}
              style={iconBtn}
            >
              <IconUser size={16} c={color.textSecondary} />
              <IconChevron size={14} c={color.textMuted} />
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
                      <div style={{ height: 1, background: color.border, margin: "4px 0" }} />
                      <button type="button" className="tq-menu-item" onClick={handleLogout} style={{ color: color.lossStrong }}>
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
