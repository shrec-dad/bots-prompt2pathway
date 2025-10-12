// src/lib/theme.ts

export type ThemePalette = {
  from: string;
  via: string;
  to: string;
};

const THEME_STORAGE_KEY = "theme:platformGradient";

/** Default platform gradient (your current purple → indigo → teal). */
export const DEFAULT_THEME: ThemePalette = {
  from: "#a855f7", // purple-500-ish
  via: "#6366f1",  // indigo-500-ish
  to: "#14b8a6",   // teal-500-ish
};

/* ----------------------- Contrast helpers ----------------------- */

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return { r, g, b };
}

function relLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Pick white or black for best contrast across the whole gradient. */
function pickContrastText(p: ThemePalette): "#ffffff" | "#000000" {
  const avg =
    (relLuminance(p.from) + relLuminance(p.via) + relLuminance(p.to)) / 3;
  return avg < 0.5 ? "#ffffff" : "#000000";
}

/** Choose boldness. We keep it punchy: darker → 800, lighter → 800 as well. */
function pickFontWeight(p: ThemePalette): "700" | "800" {
  // Keep consistent bold look; if you prefer lighter for bright gradients, flip this.
  return "800";
}

/* ----------------------- Persistence ----------------------- */

export function getSavedTheme(): ThemePalette | null {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ThemePalette;
    if (parsed && parsed.from && parsed.via && parsed.to) return parsed;
  } catch {}
  return null;
}

export function saveTheme(palette: ThemePalette) {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(palette));
}

/* ----------------------- Apply to document ----------------------- */

export function applyTheme(palette?: ThemePalette) {
  const p = palette || getSavedTheme() || DEFAULT_THEME;

  const text = pickContrastText(p);
  const weight = pickFontWeight(p);

  const root = document.documentElement;

  // Variables used by your theme.css utilities
  root.style.setProperty("--grad-from", p.from);
  root.style.setProperty("--grad-via", p.via);
  root.style.setProperty("--grad-to", p.to);
  root.style.setProperty("--grad-text", text);
  root.style.setProperty("--grad-font-weight", weight);

  // Back-compat with places that already use --brand-* vars
  root.style.setProperty("--brand-from", p.from);
  root.style.setProperty("--brand-via", p.via);
  root.style.setProperty("--brand-to", p.to);
  root.style.setProperty("--brand-fg-strong", text);
}

export function setAndApplyTheme(palette: ThemePalette) {
  saveTheme(palette);
  applyTheme(palette);
}

export function resetToDefaultTheme() {
  saveTheme(DEFAULT_THEME);
  applyTheme(DEFAULT_THEME);
}
