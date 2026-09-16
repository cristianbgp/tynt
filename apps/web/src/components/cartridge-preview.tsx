import { useState } from "react";
import { TyntMark } from "@/components/brand";

interface CartridgePreviewProps {
  filename: string;
  src: string;
}

export function CartridgePreview({ filename, src }: CartridgePreviewProps) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <span
        className="cartridge-preview-fallback grid aspect-[160/144] w-[min(100%,320px)] place-content-center justify-items-center gap-[10px] border border-foreground text-[9px] text-muted-foreground [&_.brand-mark]:size-[36px]"
        role="img"
        aria-label={`${filename} preview`}
      >
        <TyntMark />
        <span>PREVIEW UNAVAILABLE</span>
      </span>
    );
  return (
    <img
      className="cartridge-preview h-auto w-[min(100%,320px)] border border-foreground [image-rendering:pixelated]"
      width="320"
      height="288"
      src={src}
      alt={`${filename} preview`}
      onError={() => setFailed(true)}
    />
  );
}
