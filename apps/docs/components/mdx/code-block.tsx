"use client";

import { Check, Copy } from "pixelarticons/react";
import { useRef, useState, type HTMLAttributes } from "react";

export function CodeBlock({ children, ...props }: HTMLAttributes<HTMLPreElement>) {
  const codeRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(codeRef.current?.textContent ?? "");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  }

  return (
    <div className="docs-code-block group relative my-7 border border-border bg-subtle">
      <button
        className="absolute right-2 top-2 z-10 grid size-10 place-items-center border border-border bg-background text-muted opacity-100 hover:border-foreground hover:bg-foreground hover:text-background focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
        type="button"
        aria-label={copied ? "Code copied" : "Copy code"}
        onClick={copyCode}
      >
        {copied ? <Check width={18} height={18} aria-hidden="true" /> : <Copy width={18} height={18} aria-hidden="true" />}
      </button>
      <pre ref={codeRef} className="overflow-x-auto p-4 pr-14 text-[13px] leading-6" {...props}>{children}</pre>
    </div>
  );
}
