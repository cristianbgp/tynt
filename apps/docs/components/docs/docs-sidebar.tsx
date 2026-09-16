import Link from "next/link";
import type { DocsNavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/cn";

interface DocsSidebarProps {
  items: DocsNavigationItem[];
  currentPath: string;
  onNavigate?(): void;
}

function NavigationItems({
  items,
  currentPath,
  onNavigate,
  depth = 0,
}: DocsSidebarProps & { depth?: number }) {
  return (
    <ul className={cn("m-0 list-none p-0", depth > 0 && "mt-1 border-l border-border pl-3")}>
      {items.map((item) => (
        <li className="my-0.5" key={item.url ?? `${depth}-${item.title}`}>
          {item.url ? (
            <Link
              className="block min-h-10 border border-transparent px-3 py-2 text-[13px] leading-6 text-muted no-underline hover:border-foreground hover:bg-foreground hover:text-background focus-visible:border-foreground aria-[current=page]:border-foreground aria-[current=page]:bg-foreground aria-[current=page]:text-background"
              href={item.url}
              aria-current={currentPath === item.url ? "page" : undefined}
              onClick={onNavigate}
            >
              {item.title}
            </Link>
          ) : (
            <div className="px-3 pt-4 pb-1 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
              {item.title}
            </div>
          )}
          {item.children?.length ? (
            <NavigationItems
              items={item.children}
              currentPath={currentPath}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function DocsSidebar({ items, currentPath, onNavigate }: DocsSidebarProps) {
  return (
    <nav aria-label="Documentation">
      <NavigationItems items={items} currentPath={currentPath} onNavigate={onNavigate} />
    </nav>
  );
}
