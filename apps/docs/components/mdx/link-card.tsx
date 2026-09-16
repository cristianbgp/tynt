import { ExternalLink } from "pixelarticons/react";
import Link from "next/link";
import type { ReactNode } from "react";

interface LinkCardProps {
  children: ReactNode;
  href: string;
  title: string;
}

export function LinkCard({ children, href, title }: LinkCardProps) {
  const content = (
    <>
      <span className="flex items-center justify-between gap-3 font-semibold">
        {title}
        <ExternalLink width={18} height={18} aria-hidden="true" />
      </span>
      <span className="mt-2 block text-sm leading-6 text-muted group-hover:text-inherit">
        {children}
      </span>
    </>
  );
  const className =
    "group my-7 block border border-border p-4 no-underline hover:border-foreground hover:bg-foreground hover:text-background focus-visible:border-foreground";

  if (href.startsWith("/"))
    return (
      <Link className={className} href={href}>
        {content}
      </Link>
    );
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {content}
    </a>
  );
}
