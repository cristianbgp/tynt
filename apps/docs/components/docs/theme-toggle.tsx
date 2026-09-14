"use client";

import { Moon, Sun } from "pixelarticons/react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const current = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(current);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("tynt-docs-theme", next);
    applyTheme(next);
    setTheme(next);
  }

  const nextTheme = theme === "dark" ? "light" : "dark";
  return (
    <button
      className="grid size-10 shrink-0 place-items-center border-l border-border bg-background text-muted hover:bg-foreground hover:text-background"
      type="button"
      aria-label={`Switch to ${nextTheme} theme`}
      onClick={toggleTheme}
    >
      {theme === "dark" ? <Sun width={18} height={18} aria-hidden="true" /> : <Moon width={18} height={18} aria-hidden="true" />}
    </button>
  );
}
