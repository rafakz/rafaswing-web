"use client";

import { color, font, radius, space, size, motion } from "../lib/theme";

/* Карточка: мокаптағы қою беттің үстіндегі жұқа жиекті панель. */
export function Card({ children, style, padding = space.lg, as: Tag = "div", ...rest }) {
  return (
    <Tag
      {...rest}
      style={{
        boxSizing: "border-box",
        minWidth: 0,
        padding,
        background: color.surface,
        border: `1px solid ${color.borderSoft}`,
        borderRadius: radius.xl,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

/* Батырма: variant = "primary" (көк толық), "outline" (контур), "ghost" (мәтін). */
export function Button({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  fullWidth = false,
  style,
  ...rest
}) {
  const variants = {
    primary: {
      background: color.accentStrong,
      border: "none",
      color: color.textOnAccent,
    },
    outline: {
      background: color.accentSoft,
      border: `1px solid ${color.borderActive}`,
      color: color.accentText,
    },
    ghost: {
      background: "transparent",
      border: `1px solid ${color.accent}`,
      color: color.accentText,
    },
  };

  const v = variants[variant] || variants.primary;

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      style={{
        height: size.buttonHeight,
        padding: `0 ${space.lg}px`,
        width: fullWidth ? "100%" : undefined,
        borderRadius: radius.lg,
        fontFamily: font.family,
        fontSize: font.md,
        fontWeight: font.semibold,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: `filter ${motion.fast}`,
        ...v,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
