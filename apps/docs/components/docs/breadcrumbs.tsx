import Link from "next/link";
import { ChevronRight } from "pixelarticons/react";

interface BreadcrumbsProps {
  title: string;
  url: string;
}

export function Breadcrumbs({ title, url }: BreadcrumbsProps) {
  const nested = url.split("/").filter(Boolean).slice(1, -1);

  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted" aria-label="Breadcrumb">
      <Link className="px-1 py-1 text-muted no-underline hover:bg-foreground hover:text-background" href="/docs">Docs</Link>
      {nested.map((part) => (
        <span className="contents" key={part}>
          <ChevronRight width={14} height={14} aria-hidden="true" />
          <span className="px-1 py-1 capitalize">{part.replaceAll("-", " ")}</span>
        </span>
      ))}
      {url !== "/docs" ? (
        <>
          <ChevronRight width={14} height={14} aria-hidden="true" />
          <span className="px-1 py-1 text-foreground" aria-current="page">{title}</span>
        </>
      ) : null}
    </nav>
  );
}
