export type MobilePane = "code" | "play";

interface MobilePaneSwitchProps {
  value: MobilePane;
  onChange(value: MobilePane): void;
}

export function MobilePaneSwitch({ value, onChange }: MobilePaneSwitchProps) {
  const buttonClassName =
    "min-w-0 cursor-pointer border-0 border-r border-border bg-background text-foreground transition-colors last:border-r-0 hover:bg-foreground hover:text-background aria-pressed:bg-foreground aria-pressed:text-background aria-pressed:hover:bg-[#555555]";
  return (
    <div
      className="mobile-pane-switch hidden max-[560px]:grid max-[560px]:grid-cols-2 max-[560px]:border-b max-[560px]:border-border"
      role="group"
      aria-label="Mobile workspace"
    >
      <button
        className={buttonClassName}
        type="button"
        aria-label="Show code"
        aria-pressed={value === "code"}
        data-cuelume-hover="tick"
        data-cuelume-toggle=""
        onClick={() => onChange("code")}
      >
        Code
      </button>
      <button
        className={buttonClassName}
        type="button"
        aria-label="Show game"
        aria-pressed={value === "play"}
        data-cuelume-hover="tick"
        data-cuelume-toggle=""
        onClick={() => onChange("play")}
      >
        Play
      </button>
    </div>
  );
}
