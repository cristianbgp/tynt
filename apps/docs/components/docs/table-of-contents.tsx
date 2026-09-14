"use client";

import type { TOCItemType } from "fumadocs-core/toc";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function TableOfContents({ items }: { items: TOCItemType[] }) {
  const [active, setActive] = useState<string>();

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.url.slice(1)))
      .filter((heading): heading is HTMLElement => heading !== null);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-96px 0px -70%" },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="On this page">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">On this page</p>
      {items.length ? (
        <ul className="m-0 list-none space-y-1 p-0">
          {items.map((item) => (
            <li key={item.url}>
              <a
                className={cn(
                  "block border-l border-border py-1.5 pl-3 text-xs leading-5 text-muted no-underline hover:border-foreground hover:bg-foreground hover:text-background",
                  item.depth > 2 && "pl-6",
                  active === item.url && "border-foreground text-foreground",
                )}
                href={item.url}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">Overview</p>
      )}
    </nav>
  );
}
