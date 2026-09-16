"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Close, Search } from "pixelarticons/react";
import Link from "next/link";
import { fetchClient } from "fumadocs-core/search/client/fetch";
import { useDocsSearch } from "fumadocs-core/search/client";
import { useMemo } from "react";

interface SearchDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
}

function plainText(value: string): string {
  return value.replace(/<\/?mark>/g, "").replace(/[`*_#]/g, "");
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const client = useMemo(() => fetchClient(), []);
  const { search, setSearch, query } = useDocsSearch({ client, delayMs: 80 });
  const results = Array.isArray(query.data) ? query.data : [];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          className="fixed top-[12vh] left-1/2 z-[60] max-h-[76vh] w-[min(92vw,680px)] -translate-x-1/2 overflow-hidden border border-border bg-background"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Search documentation</Dialog.Title>
          <div className="flex h-14 items-center border-b border-border">
            <Search
              className="ml-4 shrink-0 text-muted"
              width={20}
              height={20}
              aria-hidden="true"
            />
            <input
              className="min-w-0 flex-1 self-stretch bg-transparent px-3 text-sm outline-none placeholder:text-muted"
              type="search"
              role="searchbox"
              value={search}
              placeholder="Search tynt docs"
              aria-label="Search documentation"
              autoFocus
              onChange={(event) => setSearch(event.target.value)}
            />
            <Dialog.Close
              className="grid size-14 place-items-center border-l border-border bg-background text-muted hover:bg-foreground hover:text-background"
              aria-label="Close search"
            >
              <Close width={20} height={20} aria-hidden="true" />
            </Dialog.Close>
          </div>
          <div className="max-h-[calc(76vh-56px)] overflow-y-auto p-2" aria-live="polite">
            {query.isLoading ? <p className="p-4 text-sm text-muted">Searching...</p> : null}
            {query.error ? (
              <div className="border border-foreground p-4 text-sm">
                <p>Search is unavailable.</p>
                <button
                  className="mt-3 border border-border px-3 py-2 hover:bg-foreground hover:text-background"
                  type="button"
                  onClick={() => setSearch(`${search} `)}
                >
                  Retry
                </button>
              </div>
            ) : null}
            {!query.isLoading && !query.error && search && results.length === 0 ? (
              <p className="p-4 text-sm text-muted">No results for “{search}”.</p>
            ) : null}
            {results.length > 0 ? (
              <ul className="m-0 list-none p-0" aria-label="Search results">
                {results.map((result) => (
                  <li key={result.id}>
                    <Link
                      className="block min-h-12 border border-transparent p-3 no-underline hover:border-border hover:bg-subtle focus-visible:border-foreground"
                      href={result.url}
                      onClick={() => onOpenChange(false)}
                    >
                      <span className="block text-sm font-semibold">
                        {plainText(result.content)}
                      </span>
                      {result.breadcrumbs?.length ? (
                        <span className="mt-1 block text-xs text-muted">
                          {result.breadcrumbs.map(plainText).join(" / ")}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {!search ? (
              <p className="p-4 text-sm text-muted">
                Search guides, examples, and the cartridge API.
              </p>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
