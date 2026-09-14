import { useEffect, useRef, useState, type ComponentType, type PointerEvent, type ReactNode, type SVGProps } from "react";
import type { InputName } from "@tynt/core";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "pixelarticons/react";
import { Button } from "@/components/ui/button";

interface EmulatorControlsProps {
  onInput(input: InputName, down: boolean): void;
}

const controls: Array<{ input: InputName; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>>; iconName: string; className: string }> = [
  { input: "up", label: "Direction up", Icon: ArrowUp, iconName: "arrow-up", className: "dpad-up col-start-2 row-start-1" },
  { input: "left", label: "Direction left", Icon: ArrowLeft, iconName: "arrow-left", className: "dpad-left col-start-1 row-start-2" },
  { input: "right", label: "Direction right", Icon: ArrowRight, iconName: "arrow-right", className: "dpad-right col-start-3 row-start-2" },
  { input: "down", label: "Direction down", Icon: ArrowDown, iconName: "arrow-down", className: "dpad-down col-start-2 row-start-3" },
];

export function EmulatorControls({ onInput }: EmulatorControlsProps) {
  const active = useRef(new Map<InputName, number>());
  const onInputRef = useRef(onInput);
  const [pressed, setPressed] = useState<ReadonlySet<InputName>>(new Set());
  onInputRef.current = onInput;

  const begin = (input: InputName, event: PointerEvent<HTMLButtonElement>) => {
    if (active.current.has(input)) return;
    active.current.set(input, event.pointerId);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setPressed(new Set(active.current.keys()));
    onInputRef.current(input, true);
  };

  const end = (input: InputName, pointerId: number) => {
    if (active.current.get(input) !== pointerId) return;
    active.current.delete(input);
    setPressed(new Set(active.current.keys()));
    onInputRef.current(input, false);
  };

  useEffect(() => () => {
    for (const input of active.current.keys()) onInputRef.current(input, false);
    active.current.clear();
  }, []);

  const control = (input: InputName, label: string, content: ReactNode, className?: string) => (
    <Button
      key={input}
      variant="control"
      className={`size-[40px] bg-foreground text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground data-[pressed=true]:bg-background data-[pressed=true]:text-foreground data-[pressed=true]:hover:bg-background data-[pressed=true]:hover:text-foreground ${className ?? ""}`}
      aria-label={label}
      aria-pressed={pressed.has(input)}
      data-pressed={pressed.has(input)}
      onPointerDown={(event) => begin(input, event)}
      onPointerUp={(event) => end(input, event.pointerId)}
      onPointerCancel={(event) => end(input, event.pointerId)}
      onLostPointerCapture={(event) => end(input, event.pointerId)}
      onContextMenu={(event) => event.preventDefault()}
    >
      {content}
    </Button>
  );

  return (
    <div className="emulator-controls mt-[18px] flex touch-none select-none items-end justify-between" aria-label="Emulator controls">
      <div className="dpad grid grid-cols-[repeat(3,40px)] grid-rows-[repeat(3,40px)]" aria-label="Direction pad">
        {controls.map(({ input, label, Icon, iconName, className }) => control(
          input,
          label,
          <Icon width={24} height={24} data-icon={iconName} aria-hidden="true" />,
          className,
        ))}
        <span className="dpad-center col-start-2 row-start-2 border border-foreground bg-foreground" aria-hidden="true" />
      </div>
      <div className="action-buttons flex items-end gap-[12px] pb-[10px]">
        <div className="translate-y-[8px]">{control("b", "Action B", "B")}</div>
        <div>{control("a", "Action A", "A")}</div>
      </div>
    </div>
  );
}
