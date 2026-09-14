import { useState } from "react";
import { TyntMark } from "@/components/brand";

interface CartridgePreviewProps {
  filename: string;
  src: string;
}

export function CartridgePreview({ filename, src }: CartridgePreviewProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="cartridge-preview-fallback" role="img" aria-label={`${filename} preview`}><TyntMark /><span>PREVIEW UNAVAILABLE</span></span>;
  return <img className="cartridge-preview" width="320" height="288" src={src} alt={`${filename} preview`} onError={() => setFailed(true)} />;
}
