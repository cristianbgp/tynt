"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Close, ExternalLink, Gamepad, Github } from "pixelarticons/react";
import type { DocsNavigationItem } from "@/lib/navigation";
import { DocsSidebar } from "@/components/docs/docs-sidebar";

interface MobileNavigationProps {
  currentPath: string;
  items: DocsNavigationItem[];
  open: boolean;
  onOpenChange(open: boolean): void;
}

export function MobileNavigation({ currentPath, items, open, onOpenChange }: MobileNavigationProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 data-[state=closed]:opacity-0" />
        <Dialog.Content
          className="fixed inset-y-0 left-0 z-50 flex w-[min(88vw,360px)] flex-col border-r border-border bg-background shadow-none"
          aria-describedby={undefined}
        >
          <div className="flex h-14 shrink-0 items-center border-b border-border pl-4">
            <Dialog.Title className="text-sm font-semibold">Documentation navigation</Dialog.Title>
            <Dialog.Close className="ml-auto grid size-14 place-items-center border-l border-border bg-background text-muted hover:bg-foreground hover:text-background" aria-label="Close documentation navigation">
              <Close width={20} height={20} aria-hidden="true" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <DocsSidebar items={items} currentPath={currentPath} onNavigate={() => onOpenChange(false)} />
          </div>
          <nav className="grid shrink-0 border-t border-border p-3" aria-label="tynt project links">
            <a className="flex min-h-11 items-center gap-3 border border-transparent px-3 text-xs text-muted no-underline hover:border-foreground hover:bg-foreground hover:text-background" href="https://tynt.dev/gallery">
              <Gamepad width={18} height={18} aria-hidden="true" />Open the tynt gallery
            </a>
            <a className="flex min-h-11 items-center gap-3 border border-transparent px-3 text-xs text-muted no-underline hover:border-foreground hover:bg-foreground hover:text-background" href="https://github.com/cristianbgp/tynt">
              <Github width={18} height={18} aria-hidden="true" />View tynt on GitHub
            </a>
            <a className="flex min-h-11 items-center gap-3 border border-transparent px-3 text-xs text-muted no-underline hover:border-foreground hover:bg-foreground hover:text-background" href="https://tynt.dev">
              <ExternalLink width={18} height={18} aria-hidden="true" />Open the tynt editor
            </a>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
