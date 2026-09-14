import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { TyntMark } from "@/components/brand";
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
  if (record === undefined) return <main className="play-loading" aria-live="polite"><span className="state-mark"><TyntMark /></span><span>Loading cartridge…</span></main>;
  if (record === null) return <CartridgeNotFound local />;
  return <PlayPage cartridge={record} editorHref={`/?local=${record.id}`} soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} />;
}
