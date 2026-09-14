import { useMemo, useState } from "react";
import { BookOpen, Code, ExternalLink, GalleryThumbnails, Github, Image, Play, Search } from "pixelarticons/react";
import { Link } from "react-router";
import { BrandLink } from "@/components/brand";
import { CartridgePreview } from "@/components/cartridge-preview";
import { Attribution, SoundToggle } from "@/components/status-bar";
import { listPublicCartridges } from "@/cartridges/public-cartridges";

interface GalleryPageProps { soundEnabled?: boolean; onSoundToggle?(): void; }
const soundLinkProps = { "data-cuelume-hover": "tick", "data-cuelume-press": "", "data-cuelume-release": "" } as const;
const PROJECT_REPOSITORY = "https://github.com/cristianbgp/tynt";

export function GalleryPage({ soundEnabled = true, onSoundToggle = () => {} }: GalleryPageProps) {
  const cartridges = listPublicCartridges();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const tags = useMemo(() => [...new Set(cartridges.flatMap((cartridge) => [...cartridge.tags]))].sort(), [cartridges]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return cartridges.filter((cartridge) => {
      if (tag && !cartridge.tags.includes(tag)) return false;
      if (!needle) return true;
      return [cartridge.slug, cartridge.title, cartridge.author, cartridge.description, cartridge.controls, ...cartridge.tags].join(" ").toLowerCase().includes(needle);
    });
  }, [cartridges, query, tag]);

  return (
    <div className="gallery-shell">
      <header className="gallery-topbar">
        <BrandLink />
        <nav className="site-navigation" aria-label="Primary navigation">
          <Link to="/" {...soundLinkProps}><Code width={24} height={24} data-icon="code" aria-hidden="true" /><span>Editor</span></Link>
          <Link className="active" to="/gallery" aria-current="page" {...soundLinkProps}><GalleryThumbnails width={24} height={24} data-icon="gallery" aria-hidden="true" /><span>Gallery</span></Link>
          <Link to="/library" {...soundLinkProps}><BookOpen width={24} height={24} data-icon="library" aria-hidden="true" /><span>Library</span></Link>
          <Link to="/sprites" {...soundLinkProps}><Image width={24} height={24} aria-hidden="true" /><span>Sprites</span></Link>
        </nav>
      </header>
      <main className="gallery-main">
        <header className="gallery-heading">
          <div><h1>Cartridge gallery</h1><p>Play public games, inspect their source, and remix them into your local library.</p></div>
          <a className="gallery-submit" href={`${PROJECT_REPOSITORY}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer" {...soundLinkProps}><Github width={20} height={20} aria-hidden="true" />Submit a cartridge</a>
        </header>
        <section className="gallery-filters" aria-label="Filter public cartridges">
          <label className="library-search-wrap"><Search width={20} height={20} aria-hidden="true" /><span className="sr-only">Search cartridges</span><input className="library-search" type="search" aria-label="Search cartridges" placeholder="Search cartridges" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="gallery-tags" aria-label="Tags">{tags.map((value) => <button key={value} type="button" aria-pressed={tag === value} data-cuelume-hover="tick" data-cuelume-toggle="" onClick={() => setTag((current) => current === value ? null : value)}>{value}</button>)}</div>
        </section>
        {filtered.length === 0 ? <p className="gallery-no-results">No public cartridges match “{query || tag}”.</p> : null}
        <section className="cartridge-grid" aria-label="Public cartridges">
          {filtered.map((cartridge, index) => (
            <article className="cartridge-card" data-featured={index === 0 && !query && !tag || undefined} key={cartridge.slug}>
              <div className="cartridge-artwork"><CartridgePreview filename={cartridge.filename} src={cartridge.coverUrl} /></div>
              <div className="cartridge-copy">
                <div className="cartridge-title-row"><h2>{cartridge.filename}</h2><span>{String(index + 1).padStart(2, "0")}</span></div>
                <span className="library-author">by {cartridge.author}</span>
                <p>{cartridge.description}</p>
                <span className="cartridge-controls">{cartridge.controls}</span>
                <div className="cartridge-tags">{cartridge.tags.map((value) => <span key={value}>{value}</span>)}</div>
                <div className="cartridge-actions">
                  <Link aria-label={`Play ${cartridge.filename}`} to={`/play/public/${cartridge.slug}`} {...soundLinkProps}><Play width={18} height={18} aria-hidden="true" />Play</Link>
                  <Link aria-label={`Open ${cartridge.filename} in editor`} to={`/?cartridge=${cartridge.slug}`} {...soundLinkProps}><Code width={18} height={18} aria-hidden="true" />Editor</Link>
                  <a aria-label={`View ${cartridge.filename} source`} href={cartridge.repository ?? `${PROJECT_REPOSITORY}/tree/main/cartridges/${cartridge.slug}`} target="_blank" rel="noreferrer" {...soundLinkProps}><ExternalLink width={18} height={18} aria-hidden="true" />Source</a>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
      <footer className="gallery-footer"><span>{cartridges.length} public cartridges</span><Link to="/" {...soundLinkProps}>Open editor</Link><Attribution /><SoundToggle soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} /></footer>
    </div>
  );
}
