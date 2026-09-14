import Link from "next/link";
import { ArrowLeft, ArrowRight } from "pixelarticons/react";
import type { DocsPage } from "@/lib/source";

export function DocsPagination({ previous, next }: { previous?: DocsPage; next?: DocsPage }) {
  return (
    <nav className="mt-16 grid gap-3 border-t border-border pt-6 sm:grid-cols-2" aria-label="Document pagination">
      {previous ? (
        <Link className="group flex min-h-20 items-center gap-3 border border-border p-4 text-sm no-underline hover:bg-foreground hover:text-background" href={previous.url}>
          <ArrowLeft className="shrink-0" width={18} height={18} aria-hidden="true" />
          <span><span className="block text-[10px] uppercase tracking-widest opacity-70">Previous</span>{previous.data.title}</span>
        </Link>
      ) : <span />}
      {next ? (
        <Link className="group flex min-h-20 items-center justify-end gap-3 border border-border p-4 text-right text-sm no-underline hover:bg-foreground hover:text-background" href={next.url}>
          <span><span className="block text-[10px] uppercase tracking-widest opacity-70">Next</span>{next.data.title}</span>
          <ArrowRight className="shrink-0" width={18} height={18} aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
