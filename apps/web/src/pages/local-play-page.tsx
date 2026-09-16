import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { TyntMark } from "@/components/brand";
import { SiteHeader } from "@/components/site-chrome";
import type { CartridgeLibrary, LibraryCartridge } from "@/library/cartridge-library";
import { CartridgeNotFound, PlayPage } from "@/pages/play-page";

interface LocalPlayPageProps { library: CartridgeLibrary; soundEnabled: boolean; onSoundToggle(): void; }

export function LocalPlayPage({ library, soundEnabled, onSoundToggle }: LocalPlayPageProps) {
  const { id = "" } = useParams();
  const [record, setRecord] = useState<LibraryCartridge | null>();
  useEffect(() => {
    let active = true;
    void library.get(id).then((next) => { if (active) setRecord(next ?? null); }).catch(() => { if (active) setRecord(null); });
    return () => { active = false; };
  }, [id, library]);
  if (record === undefined) return <div className="grid min-h-full grid-rows-[41px_minmax(0,1fr)]"><SiteHeader editorTo={`/?local=${id}`} /><main className="flex items-center justify-center gap-[12px]" aria-live="polite"><span className="state-mark"><TyntMark /></span><span>Loading cartridge…</span></main></div>;
  if (record === null) return <CartridgeNotFound local />;
  return <PlayPage cartridge={record} editorHref={`/?local=${record.id}`} soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} />;
}
