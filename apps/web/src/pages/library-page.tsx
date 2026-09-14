import { useEffect, useMemo, useState } from "react";
import { safeFilename, type Draft } from "@tynt/core";
import { play } from "cuelume";
import { Code, Copy, InfoBox, Play, Search, Trash } from "pixelarticons/react";
import { Link } from "react-router";
import { TyntMark } from "@/components/brand";
import { CartridgeDetailsDialog } from "@/components/cartridge-details-dialog";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import type { CartridgeLibrary, LibraryCartridge } from "@/library/cartridge-library";

interface LibraryPageProps {
  library: CartridgeLibrary;
  soundEnabled: boolean;
  onSoundToggle(): void;
}

const soundLinkProps = {
  "data-cuelume-hover": "tick",
  "data-cuelume-press": "",
  "data-cuelume-release": "",
} as const;

function searchableText(record: LibraryCartridge): string {
  return [record.title, record.author, record.description, record.controls].filter(Boolean).join(" ").toLowerCase();
}

export function LibraryPage({ library, soundEnabled, onSoundToggle }: LibraryPageProps) {
  const [records, setRecords] = useState<LibraryCartridge[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<LibraryCartridge | null>(null);

  const refresh = async () => {
    try {
      setRecords(await library.list());
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, [library]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? records.filter((record) => searchableText(record).includes(normalized)) : records;
  }, [query, records]);

  const duplicate = async (record: LibraryCartridge) => {
    try {
      await library.duplicate(record.id);
      await refresh();
      play("success");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
      play("error");
    }
  };

  const remove = async (record: LibraryCartridge) => {
    if (!window.confirm(`Delete ${record.title}.tynt from this device?`)) return;
    try {
      await library.remove(record.id);
      await refresh();
      play("success");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
      play("error");
    }
  };

  const saveDetails = async (draft: Draft) => {
    if (!editing) return;
    try {
      await library.save({ id: editing.id, draft, thumbnail: editing.thumbnail });
      setEditing(null);
      await refresh();
      play("success");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
      play("error");
    }
  };

  return (
    <div className="gallery-shell library-shell grid h-full w-full grid-rows-[41px_minmax(0,1fr)_25px] bg-background max-[560px]:h-dvh max-[560px]:grid-rows-[41px_minmax(0,1fr)_calc(41px+env(safe-area-inset-bottom))]">
      <SiteHeader active="library" />
      <main className="gallery-main overflow-auto px-[clamp(18px,5vw,72px)] pt-[42px] pb-[72px] max-[560px]:px-[14px] max-[560px]:pt-[28px] max-[560px]:pb-[28px]">
        <header className="library-heading mx-auto mb-[32px] flex max-w-[1180px] items-end justify-between gap-[28px] border-b border-foreground pb-[24px] max-[560px]:flex-col max-[560px]:items-stretch">
          <div>
            <p className="eyebrow m-0 mb-[9px] text-[10px] uppercase text-muted-foreground">Stored on this device</p>
            <h1 className="m-0 text-[clamp(30px,5vw,58px)] leading-[0.95] font-[580] tracking-[-0.065em]">Your library</h1>
          </div>
          <label className="library-search-wrap flex w-[min(360px,100%)] items-center border border-border">
            <Search className="ml-[10px] flex-none" width={24} height={24} aria-hidden="true" />
            <span className="sr-only">Search library</span>
            <input
              className="library-search w-full border-0 bg-background px-[12px] py-[10px] font-[inherit] text-foreground outline-none focus:border-foreground focus:shadow-[inset_0_0_0_1px_var(--foreground)]"
              type="search"
              aria-label="Search library"
              placeholder="Search cartridges"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </header>
        {error ? <p className="library-error mx-auto max-w-[1180px] border border-[var(--error)] p-[20px] text-[var(--error)]" role="alert">{error}</p> : null}
        {!loading && !error && records.length === 0 ? (
          <section className="library-empty mx-auto grid min-h-[360px] max-w-[1180px] place-content-center justify-items-center gap-[14px] border border-border text-center [&_h2]:m-0 [&_p]:m-0">
            <span className="state-mark inline-grid size-[42px] place-items-center bg-foreground [&_.brand-mark]:size-[24px]"><TyntMark /></span>
            <h2>Your library is empty</h2>
            <p className="text-[#555555]">Save a cartridge from the editor and it will stay on this device.</p>
            <div className="mt-[10px] flex min-h-[41px] border border-l-0 border-border max-[360px]:w-full max-[360px]:grid max-[360px]:grid-cols-1 [&>a]:flex [&>a]:min-w-0 [&>a]:items-center [&>a]:justify-center [&>a]:gap-[7px] [&>a]:border-l [&>a]:border-border [&>a]:px-[10px] [&>a]:no-underline [&>a:hover]:bg-foreground [&>a:hover]:text-background [&>a:focus-visible]:bg-foreground [&>a:focus-visible]:text-background max-[360px]:[&>*]:w-full">
              <Link to="/" {...soundLinkProps}>Create a cartridge</Link>
              <Link to="/gallery" {...soundLinkProps}>Browse examples</Link>
            </div>
          </section>
        ) : null}
        {!loading && records.length > 0 && filtered.length === 0 ? (
          <p className="library-no-results mx-auto max-w-[1180px] border border-border p-[20px]">No cartridges match “{query}”.</p>
        ) : null}
        <section className="library-grid mx-auto grid max-w-[1180px] grid-cols-2 border-t border-l border-border max-[900px]:grid-cols-1" aria-label="Saved cartridges">
          {filtered.map((record) => (
            <article className="library-card grid min-w-0 grid-cols-[minmax(150px,2fr)_minmax(190px,3fr)] grid-rows-[minmax(220px,auto)_41px] border-r border-b border-border [overflow-wrap:anywhere] max-[560px]:grid-cols-1 max-[560px]:grid-rows-[auto_auto_41px]" key={record.id}>
              <div className="library-thumbnail grid min-w-0 place-items-center bg-muted p-[24px]">
                {record.thumbnail
                  ? <img className="w-[min(100%,320px)] border border-foreground bg-foreground [image-rendering:pixelated]" src={record.thumbnail} alt={`Latest ${record.title} preview`} />
                  : <span className="text-[10px] text-muted-foreground" aria-label="No preview available">NO PREVIEW</span>}
              </div>
              <div className="library-card-copy flex min-w-0 flex-col border-l border-border p-[20px] [overflow-wrap:anywhere] max-[560px]:border-t max-[560px]:border-l-0">
                <div className="cartridge-title-row flex items-baseline justify-between gap-[16px]">
                  <h2 className="m-0 text-[16px] font-semibold tracking-[-0.03em]">{safeFilename(record.title)}</h2>
                  <span className="text-[10px] text-muted-foreground">v{record.formatVersion}</span>
                </div>
                {record.author ? <p className="library-author mt-[6px] mb-0 text-[10px] text-muted-foreground">by {record.author}</p> : null}
                <p className="my-[16px] leading-normal text-[#555555]">{record.description || "No description yet."}</p>
                <span className="cartridge-controls text-[10px] leading-normal text-muted-foreground">{record.controls || "Controls not documented"}</span>
                <time className="mt-auto pt-[16px] text-[10px] text-muted-foreground" dateTime={record.updatedAt}>Updated {new Date(record.updatedAt).toLocaleDateString()}</time>
              </div>
              <div className="library-card-actions col-span-full grid grid-cols-5 border-t border-border [&>a]:flex [&>a]:min-w-0 [&>a]:items-center [&>a]:justify-center [&>a]:gap-[7px] [&>a]:border-l [&>a]:border-border [&>a]:px-[10px] [&>a]:no-underline [&>a:hover]:bg-foreground [&>a:hover]:text-background [&>a:focus-visible]:bg-foreground [&>a:focus-visible]:text-background [&>button]:min-w-0 [&>button]:px-[10px] max-[560px]:[&_span]:hidden">
                <Link aria-label={`Open ${record.title}`} to={`/?local=${record.id}`} {...soundLinkProps}><Code width={24} height={24} aria-hidden="true" /><span>Open</span></Link>
                <Link aria-label={`Play ${record.title}`} to={`/play/local/${record.id}`} {...soundLinkProps}><Play width={24} height={24} aria-hidden="true" /><span>Play</span></Link>
                <Button aria-label={`Edit details for ${record.title}`} onClick={() => setEditing(record)}><InfoBox width={24} height={24} aria-hidden="true" /><span>Details</span></Button>
                <Button aria-label={`Duplicate ${record.title}`} onClick={() => { void duplicate(record); }}><Copy width={24} height={24} aria-hidden="true" /><span>Duplicate</span></Button>
                <Button aria-label={`Delete ${record.title}`} onClick={() => { void remove(record); }}><Trash width={24} height={24} aria-hidden="true" /><span>Delete</span></Button>
              </div>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter summary={`${records.length} local ${records.length === 1 ? "cartridge" : "cartridges"}`} soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} />
      {editing ? (
        <CartridgeDetailsDialog
          open
          draft={editing}
          onOpenChange={(open) => { if (!open) setEditing(null); }}
          onSave={(draft) => { void saveDetails(draft); }}
        />
      ) : null}
    </div>
  );
}
