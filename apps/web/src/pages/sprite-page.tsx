import { useMemo, useState } from "react";
import { play } from "cuelume";
import { BookOpen, Code, Copy, GalleryThumbnails, Image, Trash } from "pixelarticons/react";
import { Link } from "react-router";
import { BrandLink } from "@/components/brand";
import { Attribution, SoundToggle } from "@/components/status-bar";
import { Button } from "@/components/ui/button";

interface SpritePageProps {
  soundEnabled: boolean;
  onSoundToggle(): void;
}

const soundLinkProps = {
  "data-cuelume-hover": "tick", "data-cuelume-press": "", "data-cuelume-release": "",
} as const;

function spriteCode(pixels: readonly number[]): string {
  const rows = Array.from({ length: 8 }, (_, row) => `  ${pixels.slice(row * 8, row * 8 + 8).join(", ")},`);
  return `const spritePixels = [\n${rows.join("\n")}\n] as const;\n\n// draw with: sprite(spritePixels, 8, 8, x, y);`;
}

export function SpritePage({ soundEnabled, onSoundToggle }: SpritePageProps) {
  const [pixels, setPixels] = useState(() => Array<number>(64).fill(0));
  const [color, setColor] = useState(3);
  const [status, setStatus] = useState("8 × 8 · color 3 selected");
  const code = useMemo(() => spriteCode(pixels), [pixels]);

  const paint = (index: number) => {
    setPixels((current) => current.map((value, pixelIndex) => pixelIndex === index ? color : value));
    setStatus(`pixel ${index % 8 + 1}, ${Math.floor(index / 8) + 1} painted`);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
      play("success");
    } catch {
      setStatus("copy failed");
      play("error");
    }
  };

  return (
    <div className="gallery-shell sprite-shell">
      <header className="gallery-topbar">
        <BrandLink />
        <nav className="site-navigation" aria-label="Primary navigation">
          <Link to="/" {...soundLinkProps}><Code width={24} height={24} aria-hidden="true" /><span>Editor</span></Link>
          <Link to="/gallery" {...soundLinkProps}><GalleryThumbnails width={24} height={24} aria-hidden="true" /><span>Gallery</span></Link>
          <Link to="/library" {...soundLinkProps}><BookOpen width={24} height={24} aria-hidden="true" /><span>Library</span></Link>
          <Link className="active" to="/sprites" aria-current="page" {...soundLinkProps}><Image width={24} height={24} aria-hidden="true" /><span>Sprites</span></Link>
        </nav>
      </header>
      <main className="sprite-main">
        <header className="sprite-heading">
          <h1>Sprite editor</h1>
          <p>Paint an indexed 8×8 sprite, then copy it directly into a cartridge.</p>
        </header>
        <section className="sprite-workspace">
          <div className="sprite-canvas" aria-label="Eight by eight sprite canvas">
            {pixels.map((value, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Pixel ${index % 8 + 1}, ${Math.floor(index / 8) + 1} color ${value}`}
                style={{ background: ["#000", "#555", "#aaa", "#fff"][value] }}
                onClick={() => paint(index)}
                data-cuelume-press=""
                data-cuelume-release=""
              />
            ))}
          </div>
          <aside className="sprite-controls">
            <div className="sprite-palette" aria-label="Sprite palette">
              {[0, 1, 2, 3].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`Color ${value}`}
                  aria-pressed={color === value}
                  style={{ background: ["#000", "#555", "#aaa", "#fff"][value] }}
                  onClick={() => { setColor(value); setStatus(`8 × 8 · color ${value} selected`); }}
                  data-cuelume-toggle=""
                />
              ))}
            </div>
            <textarea aria-label="Sprite code" readOnly value={code} />
            <div className="sprite-actions">
              <Button aria-label="Copy sprite code" onClick={() => { void copy(); }}><Copy width={24} height={24} aria-hidden="true" />Copy code</Button>
              <Button aria-label="Clear sprite" onClick={() => { setPixels(Array(64).fill(0)); setStatus("cleared"); }}><Trash width={24} height={24} aria-hidden="true" />Clear</Button>
            </div>
            <p className="sprite-status" role="status" aria-live="polite">{status}</p>
          </aside>
        </section>
      </main>
      <footer className="gallery-footer"><span>four indexed colors</span><Link to="/" {...soundLinkProps}>Open editor</Link><Attribution /><SoundToggle soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} /></footer>
    </div>
  );
}
