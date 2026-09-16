import { FileText, Github, Volume2, VolumeX } from "pixelarticons/react";

const PROJECT_REPOSITORY = "https://github.com/cristianbgp/tynt";
const DOCUMENTATION_SOURCE = "https://docs.tynt.dev";

interface StatusBarProps {
  status: string;
  draftStatus: string;
  soundEnabled: boolean;
  className?: string;
  onSoundToggle(): void;
}

function FooterIconLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: "github" | "docs";
}) {
  const Icon = icon === "github" ? Github : FileText;
  return (
    <a
      className="footer-icon-link flex w-[36px] items-center justify-center border-l border-border text-[#555555] no-underline hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={icon === "github" ? "GitHub" : "Docs"}
      data-cuelume-hover="tick"
      data-cuelume-press=""
      data-cuelume-release=""
    >
      <Icon width={18} height={18} data-icon={icon} aria-hidden="true" />
    </a>
  );
}

export function Attribution() {
  return (
    <a
      className="attribution flex items-center self-stretch border-l border-border px-[10px] whitespace-nowrap text-[#555555] no-underline hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
      href="https://cristianbgp.com"
      target="_blank"
      rel="noreferrer"
      aria-label="made by @cristianbgp"
      data-cuelume-hover="tick"
      data-cuelume-press=""
      data-cuelume-release=""
    >
      <span className="attribution-prefix max-[560px]:hidden">made by&nbsp;</span>@cristianbgp
    </a>
  );
}

export function SoundToggle({
  soundEnabled,
  onSoundToggle,
}: Pick<StatusBarProps, "soundEnabled" | "onSoundToggle">) {
  const Icon = soundEnabled ? Volume2 : VolumeX;
  return (
    <button
      className="sound-toggle mr-[-12px] flex cursor-pointer items-center gap-[6px] self-stretch border-0 border-l border-border bg-transparent px-[12px] text-[10px] text-[#555555] hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
      type="button"
      aria-label={soundEnabled ? "Sound on" : "Sound off"}
      aria-pressed={soundEnabled}
      data-cuelume-hover="tick"
      onClick={onSoundToggle}
    >
      <Icon
        width={24}
        height={24}
        data-icon={soundEnabled ? "volume" : "volume-x"}
        aria-hidden="true"
      />
      <span>sound {soundEnabled ? "on" : "off"}</span>
    </button>
  );
}

export function FooterActions({
  soundEnabled,
  onSoundToggle,
}: Pick<StatusBarProps, "soundEnabled" | "onSoundToggle">) {
  return (
    <div className="footer-actions flex items-stretch self-stretch">
      <Attribution />
      <FooterIconLink href={PROJECT_REPOSITORY} label="Open tynt on GitHub" icon="github" />
      <FooterIconLink href={DOCUMENTATION_SOURCE} label="Open tynt documentation" icon="docs" />
      <SoundToggle soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} />
    </div>
  );
}

export function StatusBar({
  status,
  draftStatus,
  soundEnabled,
  className = "",
  onSoundToggle,
}: StatusBarProps) {
  return (
    <footer
      className={`status-bar flex items-center gap-[14px] border-t border-border px-[12px] text-[11px] text-[#555555] max-[560px]:min-h-[41px] max-[560px]:pb-[env(safe-area-inset-bottom)] ${className}`}
    >
      <span id="status" role="status" aria-live="polite">
        {status}
      </span>
      <span className="text-border max-[560px]:hidden" id="draft-status">
        {draftStatus}
      </span>
      <span className="ml-auto text-border max-[560px]:hidden" id="status-hint">
        Ctrl Shift Enter run or rerun · preview focuses automatically
      </span>
      <FooterActions soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} />
    </footer>
  );
}
