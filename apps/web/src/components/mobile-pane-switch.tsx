export type MobilePane = "code" | "play";

interface MobilePaneSwitchProps {
  value: MobilePane;
  onChange(value: MobilePane): void;
}

export function MobilePaneSwitch({ value, onChange }: MobilePaneSwitchProps) {
  return (
    <div className="mobile-pane-switch" role="group" aria-label="Mobile workspace">
      <button type="button" aria-label="Show code" aria-pressed={value === "code"} data-cuelume-hover="tick" data-cuelume-toggle="" onClick={() => onChange("code")}>Code</button>
      <button type="button" aria-label="Show game" aria-pressed={value === "play"} data-cuelume-hover="tick" data-cuelume-toggle="" onClick={() => onChange("play")}>Play</button>
    </div>
  );
}
