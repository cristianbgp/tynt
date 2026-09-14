import { useEffect, useMemo, useState } from "react";
import { safeFilename, type Draft } from "@tynt/core";
import { play } from "cuelume";
import { BookOpen, Code, Copy, GalleryThumbnails, Image, InfoBox, Play, Search, Trash } from "pixelarticons/react";
import { Link } from "react-router";
import { BrandLink, TyntMark } from "@/components/brand";
import { CartridgeDetailsDialog } from "@/components/cartridge-details-dialog";
import { Attribution, SoundToggle } from "@/components/status-bar";
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
    <div className="gallery-shell library-shell">
      <header className="gallery-topbar">
        <BrandLink />
        <nav className="site-navigation" aria-label="Primary navigation">
          <Link to="/" {...soundLinkProps}><Code width={24} height={24} aria-hidden="true" /><span>Editor</span></Link>
          <Link to="/gallery" {...soundLinkProps}><GalleryThumbnails width={24} height={24} aria-hidden="true" /><span>Gallery</span></Link>
          <Link className="active" to="/library" aria-current="page" {...soundLinkProps}><BookOpen width={24} height={24} aria-hidden="true" /><span>Library</span></Link>
          <Link to="/sprites" {...soundLinkProps}><Image width={24} height={24} aria-hidden="true" /><span>Sprites</span></Link>
        </nav>
      </header>
      <main className="gallery-main">
        <header className="library-heading">
          <div>
            <p className="eyebrow">Stored on this device</p>
            <h1>Your library</h1>
          </div>
          <label className="library-search-wrap">
            <Search width={24} height={24} aria-hidden="true" />
            <span className="sr-only">Search library</span>
            <input
              className="library-search"
              type="search"
              aria-label="Search library"
              placeholder="Search cartridges"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </header>
        {error ? <p className="library-error" role="alert">{error}</p> : null}
        {!loading && !error && records.length === 0 ? (
          <section className="library-empty">
            <span className="state-mark"><TyntMark /></span>
            <h2>Your library is empty</h2>
            <p>Save a cartridge from the editor and it will stay on this device.</p>
            <div>
              <Link to="/" {...soundLinkProps}>Create a cartridge</Link>
              <Link to="/gallery" {...soundLinkProps}>Browse examples</Link>
            </div>
          </section>
        ) : null}
        {!loading && records.length > 0 && filtered.length === 0 ? (
          <p className="library-no-results">No cartridges match “{query}”.</p>
        ) : null}
        <section className="library-grid" aria-label="Saved cartridges">
          {filtered.map((record) => (
            <article className="library-card" key={record.id}>
              <div className="library-thumbnail">
                {record.thumbnail
                  ? <img src={record.thumbnail} alt={`Latest ${record.title} preview`} />
                  : <span aria-label="No preview available">NO PREVIEW</span>}
              </div>
              <div className="library-card-copy">
                <div className="cartridge-title-row">
                  <h2>{safeFilename(record.title)}</h2>
                  <span>v{record.formatVersion}</span>
                </div>
                {record.author ? <p className="library-author">by {record.author}</p> : null}
                <p>{record.description || "No description yet."}</p>
                <span className="cartridge-controls">{record.controls || "Controls not documented"}</span>
                <time dateTime={record.updatedAt}>Updated {new Date(record.updatedAt).toLocaleDateString()}</time>
              </div>
              <div className="library-card-actions">
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
      <footer className="gallery-footer">
        <span>{records.length} local {records.length === 1 ? "cartridge" : "cartridges"}</span>
        <Link to="/" {...soundLinkProps}>Open editor</Link>
        <Attribution />
        <SoundToggle soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} />
      </footer>
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
