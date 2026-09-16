"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DocsHeader } from "@/components/docs/docs-header";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { MobileNavigation } from "@/components/docs/mobile-navigation";
import { SearchDialog } from "@/components/docs/search-dialog";
import type { DocsNavigationItem } from "@/lib/navigation";

interface DocsShellProps {
  children: ReactNode;
  navigation: DocsNavigationItem[];
}

export function DocsShell({ children, navigation }: DocsShellProps) {
  const path = usePathname();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.docsReady = "true";
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      delete document.documentElement.dataset.docsReady;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DocsHeader
        onOpenNavigation={() => setNavigationOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[248px_minmax(0,1fr)_232px]">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-border p-4 lg:block">
          <DocsSidebar items={navigation} currentPath={path} />
        </aside>
        {children}
      </div>
      <MobileNavigation
        currentPath={path}
        items={navigation}
        open={navigationOpen}
        onOpenChange={setNavigationOpen}
      />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
