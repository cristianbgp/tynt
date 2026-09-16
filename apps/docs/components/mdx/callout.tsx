import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CalloutProps {
  children: ReactNode;
  title: string;
  variant?: "note" | "warning";
}

export function Callout({ children, title, variant = "note" }: CalloutProps) {
  return (
    <aside
      className={cn(
        "docs-callout my-7 border border-border p-4",
        variant === "warning" && "border-foreground",
      )}
      role="note"
      aria-label={title}
      data-variant={variant}
    >
      <strong className="mb-2 block text-sm tracking-[0.08em] uppercase">{title}</strong>
      <div className="text-sm leading-6 text-muted [&>:first-child]:mt-0 [&>:last-child]:mb-0">
        {children}
      </div>
    </aside>
  );
}
