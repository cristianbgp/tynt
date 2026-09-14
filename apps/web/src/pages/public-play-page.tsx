import { useParams } from "react-router";
import { findPublicCartridge } from "@/cartridges/public-cartridges";
import { CartridgeNotFound, PlayPage } from "@/pages/play-page";

interface PublicPlayPageProps { soundEnabled: boolean; onSoundToggle(): void; }

export function PublicPlayPage({ soundEnabled, onSoundToggle }: PublicPlayPageProps) {
  const { slug = "" } = useParams();
  const cartridge = findPublicCartridge(slug);
  if (!cartridge) return <CartridgeNotFound />;
  return <PlayPage cartridge={cartridge} editorHref={`/?cartridge=${cartridge.slug}`} soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} />;
}
