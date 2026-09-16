import { lazy, Suspense, useEffect, useState } from "react";
import { bind, play, setEnabled } from "cuelume";
import { Route, Routes } from "react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { browserCartridgeLibrary } from "@/library/browser-library";
import type { CartridgeLibrary } from "@/library/cartridge-library";

const EditorPage = lazy(() => import("@/pages/editor-page").then(({ EditorPage }) => ({ default: EditorPage })));
const CartridgePage = lazy(() => import("@/pages/cartridge-page").then(({ CartridgePage }) => ({ default: CartridgePage })));
const GalleryPage = lazy(() => import("@/pages/gallery-page").then(({ GalleryPage }) => ({ default: GalleryPage })));
const LibraryPage = lazy(() => import("@/pages/library-page").then(({ LibraryPage }) => ({ default: LibraryPage })));
const LocalPlayPage = lazy(() => import("@/pages/local-play-page").then(({ LocalPlayPage }) => ({ default: LocalPlayPage })));
const NotFoundPage = lazy(() => import("@/pages/not-found-page").then(({ NotFoundPage }) => ({ default: NotFoundPage })));
const PublicPlayPage = lazy(() => import("@/pages/public-play-page").then(({ PublicPlayPage }) => ({ default: PublicPlayPage })));
const SpritePage = lazy(() => import("@/pages/sprite-page").then(({ SpritePage }) => ({ default: SpritePage })));
const SoundPage = lazy(() => import("@/pages/sound-page").then(({ SoundPage }) => ({ default: SoundPage })));

const SOUND_PREFERENCE_KEY = "tynt:sound-enabled";

function initialSoundEnabled(): boolean {
  return window.localStorage.getItem(SOUND_PREFERENCE_KEY) !== "false";
}

interface AppProps {
  library?: CartridgeLibrary;
}

export function App({ library = browserCartridgeLibrary }: AppProps) {
  const [soundEnabled, setSoundEnabled] = useState(initialSoundEnabled);

  useEffect(() => {
    bind();
  }, []);

  useEffect(() => {
    setEnabled(soundEnabled);
    window.localStorage.setItem(SOUND_PREFERENCE_KEY, String(soundEnabled));
  }, [soundEnabled]);

  const toggleSound = () => {
    const nextEnabled = !soundEnabled;
    setEnabled(nextEnabled);
    setSoundEnabled(nextEnabled);
    if (nextEnabled) play("toggle");
  };

  return (
    <TooltipProvider delayDuration={500}>
      <Suspense fallback={<main className="grid min-h-full place-items-center" role="status">Loading tynt…</main>}>
        <Routes>
          <Route index element={<EditorPage library={library} soundEnabled={soundEnabled} onSoundToggle={toggleSound} />} />
          <Route path="gallery" element={<GalleryPage soundEnabled={soundEnabled} onSoundToggle={toggleSound} />} />
          <Route path="cartridges/:slug" element={<CartridgePage soundEnabled={soundEnabled} onSoundToggle={toggleSound} />} />
          <Route path="library" element={<LibraryPage library={library} soundEnabled={soundEnabled} onSoundToggle={toggleSound} />} />
          <Route path="play/public/:slug" element={<PublicPlayPage soundEnabled={soundEnabled} onSoundToggle={toggleSound} />} />
          <Route path="play/local/:id" element={<LocalPlayPage library={library} soundEnabled={soundEnabled} onSoundToggle={toggleSound} />} />
          <Route path="sprites" element={<SpritePage soundEnabled={soundEnabled} onSoundToggle={toggleSound} />} />
          <Route path="sounds" element={<SoundPage soundEnabled={soundEnabled} onSoundToggle={toggleSound} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </TooltipProvider>
  );
}
