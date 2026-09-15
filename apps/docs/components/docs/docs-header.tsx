"use client";

import Link from "next/link";
import { ExternalLink, Gamepad, Github, Menu, Search } from "pixelarticons/react";
import { ThemeToggle } from "@/components/docs/theme-toggle";

interface DocsHeaderProps {
  onOpenNavigation(): void;
  onOpenSearch(): void;
}

const iconLinkClass =
  "grid size-10 shrink-0 place-items-center border-l border-border text-muted no-underline hover:bg-foreground hover:text-background";

export function DocsHeader({ onOpenNavigation, onOpenSearch }: DocsHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <a className="fixed left-3 top-3 z-[80] -translate-y-24 border border-foreground bg-background px-3 py-2 text-xs text-foreground no-underline focus:translate-y-0" href="#docs-content">Skip to content</a>
      <div className="mx-auto flex h-14 max-w-[1600px] items-center px-3 sm:px-5">
        <button
          className="mr-2 grid size-10 place-items-center border border-border text-muted hover:bg-foreground hover:text-background lg:hidden"
          type="button"
          aria-label="Open documentation navigation"
          onClick={onOpenNavigation}
        >
          <Menu width={20} height={20} aria-hidden="true" />
        </button>
        <Link className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground no-underline" href="/docs" aria-label="tynt docs">
          <img className="size-6 dark:invert" src="/tynt-mark.svg" alt="" width="24" height="24" />
          <span>tynt</span>
          <span className="hidden text-muted min-[360px]:inline">docs</span>
        </Link>

        <button
          className="ml-auto flex h-10 min-w-10 items-center justify-center gap-2 border border-border px-3 text-xs text-muted hover:bg-foreground hover:text-background sm:min-w-56 sm:justify-start"
          type="button"
          aria-label="Search documentation"
          onClick={onOpenSearch}
        >
          <Search width={17} height={17} aria-hidden="true" />
          <span className="hidden sm:inline">Search documentation</span>
          <kbd className="ml-auto hidden border border-current px-1.5 py-0.5 text-[10px] md:inline">⌘ K</kbd>
        </button>

        <div className="ml-2 hidden border-y border-r border-border md:flex">
          <a className={iconLinkClass} href="https://tynt.dev/gallery" aria-label="Open the tynt gallery">
            <Gamepad width={18} height={18} aria-hidden="true" />
          </a>
          <a className={iconLinkClass} href="https://github.com/cristianbgp/tynt" aria-label="View tynt on GitHub">
            <Github width={18} height={18} aria-hidden="true" />
          </a>
          <a className={iconLinkClass} href="https://tynt.dev" aria-label="Open the tynt editor">
            <ExternalLink width={18} height={18} aria-hidden="true" />
          </a>
        </div>
        <div className="ml-2"><ThemeToggle /></div>
      </div>
    </header>
  );
}
