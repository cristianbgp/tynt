import { useEffect, useState } from "react";
import { bind, play, setEnabled } from "cuelume";
import { Route, Routes } from "react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorPage } from "@/pages/editor-page";
import { GalleryPage } from "@/pages/gallery-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { LibraryPage } from "@/pages/library-page";
import { LocalPlayPage } from "@/pages/local-play-page";
import { PublicPlayPage } from "@/pages/public-play-page";
import { SpritePage } from "@/pages/sprite-page";
import { browserCartridgeLibrary } from "@/library/browser-library";
import type { CartridgeLibrary } from "@/library/cartridge-library";

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
      <Routes>
        <Route index element={<EditorPage library={library} soundEnabled={soundEnabled} onSoundToggle={toggleSound} />} />
        <Route path="gallery" element={<GalleryPage soundEnabled={soundEnabled} onSoundToggle={toggleSound} />} />
        <Route path="library" element={<LibraryPage library={library} soundEnabled={soundEnabled} onSoundToggle={toggleSound} />} />
        <Route path="play/public/:slug" element={<PublicPlayPage soundEnabled={soundEnabled} onSoundToggle={toggleSound} />} />
        <Route path="play/local/:id" element={<LocalPlayPage library={library} soundEnabled={soundEnabled} onSoundToggle={toggleSound} />} />
        <Route path="sprites" element={<SpritePage soundEnabled={soundEnabled} onSoundToggle={toggleSound} />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </TooltipProvider>
  );
}
