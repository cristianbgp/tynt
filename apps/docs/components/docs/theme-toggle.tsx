"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { Computer, Moon, Sun } from "pixelarticons/react";
import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { cn } from "@/lib/cn";

type ThemePreference = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

const themes: Array<{
  preference: ThemePreference;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  { preference: "system", label: "System theme", Icon: Computer },
  { preference: "light", label: "Light theme", Icon: Sun },
  { preference: "dark", label: "Dark theme", Icon: Moon },
];

function storedPreference(): ThemePreference {
  const saved = localStorage.getItem("tynt-docs-theme");
  return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
}

function resolveTheme(
  preference: ThemePreference,
  systemDark = matchMedia("(prefers-color-scheme: dark)").matches,
): ResolvedTheme {
  if (preference === "system") return systemDark ? "dark" : "light";
  return preference;
}

function applyTheme(preference: ThemePreference, systemDark?: boolean) {
  const resolved = resolveTheme(preference, systemDark);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.style.colorScheme = resolved;
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = storedPreference();
    setPreference(saved);
    applyTheme(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (preference !== "system") return;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const followSystem = (event: MediaQueryListEvent) => applyTheme("system", event.matches);
    media.addEventListener("change", followSystem);
    return () => media.removeEventListener("change", followSystem);
  }, [preference]);

  function selectTheme(next: ThemePreference) {
    localStorage.setItem("tynt-docs-theme", next);
    setPreference(next);
    applyTheme(next);
  }

  return (
    <Tooltip.Provider delayDuration={350}>
      <div className="flex border-y border-r border-border" role="radiogroup" aria-label="Theme">
        {themes.map(({ preference: option, label, Icon }) => (
          <Tooltip.Root key={option}>
            <Tooltip.Trigger asChild>
              <button
                className={cn(
                  "grid size-10 shrink-0 place-items-center border-l border-border bg-background text-muted hover:bg-foreground hover:text-background",
                  preference === option && "bg-foreground text-background",
                )}
                type="button"
                role="radio"
                aria-label={label}
                aria-checked={preference === option}
                disabled={!ready}
                onClick={() => selectTheme(option)}
              >
                <Icon width={18} height={18} aria-hidden="true" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="z-[80] border border-foreground bg-foreground px-2 py-1 text-[10px] text-background"
                sideOffset={6}
              >
                {label.replace(" theme", "")}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </div>
    </Tooltip.Provider>
  );
}
