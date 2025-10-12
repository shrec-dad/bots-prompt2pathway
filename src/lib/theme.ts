// src/lib/theme.ts
// Central place for default colors, contrast logic, and applying CSS variables.

export type Palette = { from: string; via: string; to: string };

// Snapshot of your current platform scheme (the one you want as the default reset)
export const DEFAULT_PALETTE: Palette = {
  from: "#c4b5fd", // violet-300
  via:  "#a5b4fc", // indigo-300
  to:   "#86efac", // green-300
};

const THEME_KEY = "app:theme.palette.v1";

/** Convert #rrggbb or #rgb to [r,g,b] */
function hexToRGB(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Y relative luminance per WCAG */
function relLum(hex: string) {
  const [r, g, b] = hexToRGB(hex).map((v) => v / 255);
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Contrast ratio of two hex colors (1..21) */
function contrast(hex1: string, hex2: string) {
  const L1 = relLum(hex1);
  const L2 = relLum(hex2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Pick black or white text for max contrast on a given background color */
export function pickTextColor(bgHex: string): "#000000" | "#ffffff" {
  const cBlack = contrast(bgHex, "#000000");
  const cWhite = contrast(bgHex, "#ffffff");
  return cWhite >= cBlack ? "#ffffff" : "#000000";
}

/** Blend three gradient stops to a single approx color (for contrast calc) */
function approxGradientMid({ from, via, to }: Palette): string {
  const [r1, g1, b1] = hexToRGB(from);
  const [r2, g2, b2] = hexToRGB(via);
  const [r3, g3, b3] = hexToRGB(to);
  const r = Math.round((r1 + r2 + r3) / 3);
  const g = Math.round((g1 + g2 + g3) / 3);
  const b = Math.round((b1 + b2 + b3) / 3);
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Load palette (with default fallback) */
export function loadPalette(): Palette {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw) return JSON.parse(raw) as Palette;
  } catch {}
  return { ...DEFAULT_PALETTE };
}

/** Apply CSS variables based on palette + auto contrast */
export function applyTheme(p?: Palette) {
  const palette = p ?? loadPalette();
  const mid = approxGradientMid(palette);
  const text = pickTextColor(mid);

  const root = document.documentElement;
  root.style.setProperty("--grad-from", palette.from);
  root.style.setProperty("--grad-via", palette.via);
  root.style.setProperty("--grad-to", palette.to);
  root.style.setProperty("--grad-text", text);
  // Always bold when used on gradient
  root.style.setProperty("--grad-font-weight", "800");
}

/** Save palette and apply CSS variables */
export function savePalette(p: Palette) {
  localStorage.setItem(THEME_KEY, JSON.stringify(p));
  applyTheme(p);
}

/** Reset to default system palette */
export function resetPalette() {
  savePalette({ ...DEFAULT_PALETTE });
}

