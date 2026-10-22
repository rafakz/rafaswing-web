"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const colors = {
  bg: "rgba(11, 15, 25, 0.92)",
  border: "rgba(255, 255, 255, 0.08)",
  textMuted: "#6b7280",
  active: "#3b82f6",
  activeGlow: "rgba(59, 130, 246, 0.4)",
};

export default function NavMenu() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Басты бет",
      path: "/",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: "Скринер",
      path: "/screener",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      ),
    },
    {
      label: "Портфель",
      path: "/portfolio",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      label: "Жаңалықтар",
      path: "/news",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M18 14h-8" />
          <path d="M15 18h-5" />
          <path d="M10 6h8v4h-8V6Z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "460px",
        background: colors.bg,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${colors.border}`,
        borderRadius: "24px",
        padding: "8px 12px",
        zIndex: 1000,
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                textDecoration: "none",
                color: isActive ? colors.active : colors.textMuted,
                fontSize: "0.68rem",
                fontWeight: isActive ? "700" : "500",
                transition: "all 0.2s ease",
                padding: "6px 10px",
                borderRadius: "14px",
                background: isActive ? "rgba(59, 130, 246, 0.1)" : "transparent",
              }}
            >
              <div style={{ filter: isActive ? `drop-shadow(0 0 6px ${colors.activeGlow})` : "none" }}>
                {item.icon}
              </div>
                <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
