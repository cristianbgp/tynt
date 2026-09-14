interface StatusBarProps {
  status: string;
  draftStatus: string;
  soundEnabled: boolean;
  onSoundToggle(): void;
}

export function Attribution() {
  return (
    <a
      className="attribution"
      href="https://cristianbgp.com"
      target="_blank"
      rel="noreferrer"
      aria-label="made by @cristianbgp"
      data-cuelume-hover="tick"
      data-cuelume-press=""
      data-cuelume-release=""
    >
      <span className="attribution-prefix">made by&nbsp;</span>@cristianbgp
    </a>
  );
}

export function SoundToggle({ soundEnabled, onSoundToggle }: Pick<StatusBarProps, "soundEnabled" | "onSoundToggle">) {
  const Icon = soundEnabled ? Volume2 : VolumeX;
  return (
    <button
      className="sound-toggle"
      type="button"
      aria-label={soundEnabled ? "Sound on" : "Sound off"}
      aria-pressed={soundEnabled}
      onClick={onSoundToggle}
    >
      <Icon width={24} height={24} data-icon={soundEnabled ? "volume" : "volume-x"} aria-hidden="true" />
      <span>sound {soundEnabled ? "on" : "off"}</span>
    </button>
  );
}

export function StatusBar({ status, draftStatus, soundEnabled, onSoundToggle }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span id="status" role="status" aria-live="polite">{status}</span>
      <span id="draft-status">{draftStatus}</span>
      <span id="status-hint">Ctrl Shift Enter run or rerun · preview focuses automatically</span>
      <Attribution />
      <SoundToggle soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} />
    </footer>
  );
}
import { Volume2, VolumeX } from "pixelarticons/react";
