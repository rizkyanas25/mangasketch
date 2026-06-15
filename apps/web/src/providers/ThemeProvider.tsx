'use client';

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "tankobon" | "midnight";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem("mangasketch-theme") as Theme;
    if (savedTheme && ["light", "tankobon", "midnight"].includes(savedTheme)) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    }
    setMounted(true);
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    root.classList.remove("theme-tankobon", "theme-midnight");
    if (t === "tankobon") {
      root.classList.add("theme-tankobon");
    } else if (t === "midnight") {
      root.classList.add("theme-midnight");
    }
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("mangasketch-theme", t);
    applyTheme(t);
  };

  return (
    <ThemeContext.Provider value={{ theme: mounted ? theme : "light", setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
