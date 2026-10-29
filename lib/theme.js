/* TradeIQ дизайн токендары — мокаптан өлшенген.
   Барлық түс, өлшем, шрифт осы файлдан алынады.
   Импорт: import { color, font, radius, space } from "../lib/theme"; (app/ ішінен) */

export const color = {
  // Беттер
  bg: "#01091C",
  surface: "#000E23",
  surfaceAlt: "#000A1F",
  surfaceInput: "#030B1E",
  surfaceTile: "#031337",
  surfaceTabBar: "#04132A",

  // Жиектер
  border: "#131E34",
  borderSoft: "#0B1B32",
  borderActive: "#12326B",

  // Акцент (көк)
  accent: "#0B62F5",
  accentStrong: "#0448D0",
  accentText: "#3D7BFF",
  accentSoft: "#011746",
  accentGlow: "#2F7BFF",

  // Мәтін
  textPrimary: "#F7FAFE",
  textSecondary: "#B9BCCA",
  textMuted: "#868C9E",
  textOnAccent: "#FFFFFF",

  // Өсу / құлау
  gain: "#25975F",
  gainStrong: "#22B866",
  loss: "#E5604F",
  lossStrong: "#F2806F",
  neutral: "#D4A24C",
};

export const font = {
  family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  xs: 11,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 19,
  display: 26,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  pill: 999,
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const size = {
  buttonHeight: 36,
  inputHeight: 48,
  navItemHeight: 44,
  sidebarWidth: 240,
  tabBarHeight: 62,
};

/* Көлеңке тек қажет жерде. Мокапта негізінен жиек бар. */
export const shadow = {
  none: "none",
  overlay: "0 12px 30px rgba(0, 0, 0, 0.45)",
};

export const motion = {
  fast: "0.15s ease",
  base: "0.25s ease",
};

/* Өсім/кему мәніне қарай түс */
export function changeColor(value) {
  if (typeof value !== "number" || isNaN(value)) return color.textMuted;
  return value >= 0 ? color.gain : color.loss;
}
