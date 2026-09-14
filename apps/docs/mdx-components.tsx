import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { ExternalLink } from "pixelarticons/react";
import type { AnchorHTMLAttributes, HTMLAttributes } from "react";
import { Callout } from "@/components/mdx/callout";
import { CodeBlock } from "@/components/mdx/code-block";
import { LinkCard } from "@/components/mdx/link-card";
import { Steps } from "@/components/mdx/steps";

function Anchor({ href = "", ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith("/")) return <Link href={href} {...props} />;
  return (
    <a href={href} target="_blank" rel="noreferrer" {...props}>
      {props.children}
      <ExternalLink className="ml-1 inline-block" width={14} height={14} aria-label="external link" />
    </a>
  );
}

const baseComponents: MDXComponents = {
  a: Anchor,
  pre: CodeBlock,
  Callout,
  LinkCard,
  Steps,
};

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return { ...baseComponents, ...components };
}

export function Article({ children, ...props }: HTMLAttributes<HTMLElement>) {
  return <article {...props}>{children}</article>;
}
