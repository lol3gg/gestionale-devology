"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "devology-theme";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("light", theme === "light");
}

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const isLight = document.documentElement.classList.contains("light");
    setTheme(isLight ? "light" : "dark");
    setHydrated(true);
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "Passa al tema scuro" : "Passa al tema chiaro"}
      title={isLight ? "Tema scuro" : "Tema chiaro"}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-border bg-brand-elevated text-brand-soft shadow-sm transition hover:border-brand-accent/40 hover:text-brand-accent-light ${className}`}
    >
      {/* Evita flash dell'icona sbagliata prima dell'idratazione. */}
      {!hydrated ? (
        <Sun className="h-4 w-4" />
      ) : isLight ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </button>
  );
}
