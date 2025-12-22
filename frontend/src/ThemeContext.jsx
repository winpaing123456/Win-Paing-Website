import React, { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

const PALETTES = {
  cyan: {
    accent: "#00e5ff",
    accentAlt: "#22c55e",
    accentSoft: "#043441",
    bg: "#050b16"
  },

  purple: {
    accent: "#a855f7",
    accentAlt: "#22d3ee",
    accentSoft: "#291438",
    bg: "#070515"
  },

  orange: {
    accent: "#fb923c",
    accentAlt: "#fde047",
    accentSoft: "#3b2414",
    bg: "#090613"
  },

  mint: {
    accent: "#34d399",
    accentAlt: "#22d3ee",
    accentSoft: "#124f3d",
    bg: "#041914"
  },

  pink: {
    accent: "#fb7185",
    accentAlt: "#a855f7",
    accentSoft: "#3f1220",
    bg: "#16040a"
  }
};

export function ThemeProvider({ children }) {
  const [palette, setPalette] = useState("cyan");

  useEffect(() => {
    const p = PALETTES[palette];

    document.documentElement.style.setProperty("--accent", p.accent);
    document.documentElement.style.setProperty("--accent-alt", p.accentAlt);
    document.documentElement.style.setProperty("--accent-soft", p.accentSoft);
    document.documentElement.style.setProperty("--bg", p.bg);
  }, [palette]);

  return (
    <ThemeContext.Provider value={{ palette, setPalette, PALETTES }}>
      {children}
    </ThemeContext.Provider>
  );
}
