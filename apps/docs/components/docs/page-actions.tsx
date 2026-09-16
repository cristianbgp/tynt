import { FileText, MagicEdit } from "pixelarticons/react";

export function PageActions({ rawUrl, sourcePath }: { rawUrl: string; sourcePath: string }) {
  const editUrl = `https://github.com/cristianbgp/tynt/edit/main/apps/docs/${sourcePath}`;
  const className =
    "inline-flex min-h-9 items-center gap-2 border border-border px-3 text-xs text-muted no-underline hover:bg-foreground hover:text-background";
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <a className={className} href={rawUrl}>
        <FileText width={16} height={16} aria-hidden="true" />
        Raw Markdown
      </a>
      <a className={className} href={editUrl}>
        <MagicEdit width={16} height={16} aria-hidden="true" />
        Edit on GitHub
      </a>
    </div>
  );
}
