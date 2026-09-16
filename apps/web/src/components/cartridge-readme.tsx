import { Fragment, type ReactNode } from "react";

function safeHref(value: string): string {
  const href = value.trim();
  if (href.startsWith("/") || href.startsWith("#")) return href;
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:"
      ? href
      : "#";
  } catch {
    return "#";
  }
}

function inline(source: string): ReactNode[] {
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  return source
    .split(pattern)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={index}>{part.slice(1, -1)}</code>;
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={index}>{part.slice(1, -1)}</em>;
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        const href = safeHref(link[2]!);
        const external = /^https?:/.test(href);
        return (
          <a key={index} href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
            {link[1]}
          </a>
        );
      }
      return <Fragment key={index}>{part}</Fragment>;
    });
}

function blocks(source: string): ReactNode[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const result: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index]!;
    if (!line.trim()) {
      index++;
      continue;
    }
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      index++;
      while (index < lines.length && !lines[index]!.startsWith("```")) code.push(lines[index++]!);
      if (index < lines.length) index++;
      result.push(
        <pre key={result.length}>
          <code data-language={language || undefined}>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const content = inline(heading[2]!);
      const key = result.length;
      result.push(
        heading[1]!.length === 1 ? (
          <h2 key={key}>{content}</h2>
        ) : heading[1]!.length === 2 ? (
          <h3 key={key}>{content}</h3>
        ) : (
          <h4 key={key}>{content}</h4>
        ),
      );
      index++;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index]!))
        items.push(lines[index++]!.replace(/^[-*]\s+/, ""));
      result.push(
        <ul key={result.length}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{inline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    const paragraph = [line.trim()];
    index++;
    while (
      index < lines.length &&
      lines[index]!.trim() &&
      !/^(#{1,3})\s+|^```|^[-*]\s+/.test(lines[index]!)
    )
      paragraph.push(lines[index++]!.trim());
    result.push(<p key={result.length}>{inline(paragraph.join(" "))}</p>);
  }
  return result;
}

export function CartridgeReadme({ source }: { source: string }) {
  return (
    <div className="cartridge-readme [&_ul]:list-square grid gap-[14px] leading-[1.65] text-[#555555] [&_a]:border-b [&_a]:border-current [&_a]:text-foreground [&_a]:no-underline [&_a:hover]:bg-foreground [&_a:hover]:text-background [&_code]:bg-muted [&_code]:px-[4px] [&_h2]:m-0 [&_h2]:text-[24px] [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:m-0 [&_h3]:text-[18px] [&_h3]:font-semibold [&_h3]:text-foreground [&_h4]:m-0 [&_h4]:font-semibold [&_h4]:text-foreground [&_li]:ml-[18px] [&_p]:m-0 [&_pre]:m-0 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted [&_pre]:p-[14px] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:m-0 [&_ul]:p-0">
      {blocks(source)}
    </div>
  );
}
