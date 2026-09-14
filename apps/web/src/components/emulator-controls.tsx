import { useEffect, useRef, useState, type ComponentType, type PointerEvent, type ReactNode, type SVGProps } from "react";
import type { InputName } from "@tynt/core";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "pixelarticons/react";
import { Button } from "@/components/ui/button";

interface EmulatorControlsProps {
  onInput(input: InputName, down: boolean): void;
}

const directionInputs = ["up", "left", "right", "down"] as const satisfies readonly InputName[];
type DirectionInput = typeof directionInputs[number];

const controls: Array<{ input: DirectionInput; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>>; iconName: string; className: string }> = [
  { input: "up", label: "Direction up", Icon: ArrowUp, iconName: "arrow-up", className: "dpad-up col-start-2 row-start-1" },
  { input: "left", label: "Direction left", Icon: ArrowLeft, iconName: "arrow-left", className: "dpad-left col-start-1 row-start-2" },
  { input: "right", label: "Direction right", Icon: ArrowRight, iconName: "arrow-right", className: "dpad-right col-start-3 row-start-2" },
  { input: "down", label: "Direction down", Icon: ArrowDown, iconName: "arrow-down", className: "dpad-down col-start-2 row-start-3" },
];

function directionsAtPoint(element: HTMLElement, clientX: number, clientY: number): DirectionInput[] {
  const bounds = element.getBoundingClientRect();
  const x = (clientX - bounds.left - bounds.width / 2) / (bounds.width / 2);
  const y = (clientY - bounds.top - bounds.height / 2) / (bounds.height / 2);
  if (Math.hypot(x, y) < 0.24) return [];

  const directions: DirectionInput[] = [];
  if (y < -0.32) directions.push("up");
  if (x < -0.32) directions.push("left");
  if (x > 0.32) directions.push("right");
  if (y > 0.32) directions.push("down");
  return directions;
}

export function EmulatorControls({ onInput }: EmulatorControlsProps) {
  const active = useRef(new Map<InputName, number>());
  const directionPointer = useRef<number | null>(null);
  const onInputRef = useRef(onInput);
  const [pressed, setPressed] = useState<ReadonlySet<InputName>>(new Set());
  onInputRef.current = onInput;

  const syncPressed = () => setPressed(new Set(active.current.keys()));

  const beginAction = (input: InputName, event: PointerEvent<HTMLButtonElement>) => {
    if (active.current.has(input)) return;
    active.current.set(input, event.pointerId);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    syncPressed();
    onInputRef.current(input, true);
  };

  const endAction = (input: InputName, pointerId: number) => {
    if (active.current.get(input) !== pointerId) return;
    active.current.delete(input);
    syncPressed();
    onInputRef.current(input, false);
  };

  const updateDirections = (pointerId: number, nextInputs: readonly DirectionInput[]) => {
    const next = new Set<DirectionInput>(nextInputs);
    let changed = false;
    for (const input of directionInputs) {
      if (active.current.get(input) === pointerId && !next.has(input)) {
        active.current.delete(input);
        onInputRef.current(input, false);
        changed = true;
      }
    }
    for (const input of directionInputs) {
      if (next.has(input) && !active.current.has(input)) {
        active.current.set(input, pointerId);
        onInputRef.current(input, true);
        changed = true;
      }
    }
    if (changed) syncPressed();
  };

  const beginDirections = (event: PointerEvent<HTMLDivElement>) => {
    if (directionPointer.current !== null) return;
    directionPointer.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateDirections(event.pointerId, directionsAtPoint(event.currentTarget, event.clientX, event.clientY));
  };

  const moveDirections = (event: PointerEvent<HTMLDivElement>) => {
    if (directionPointer.current !== event.pointerId) return;
    updateDirections(event.pointerId, directionsAtPoint(event.currentTarget, event.clientX, event.clientY));
  };

  const endDirections = (pointerId: number) => {
    if (directionPointer.current !== pointerId) return;
    directionPointer.current = null;
    updateDirections(pointerId, []);
  };

  useEffect(() => () => {
    for (const input of active.current.keys()) onInputRef.current(input, false);
    active.current.clear();
  }, []);

  const control = (input: InputName, label: string, content: ReactNode, className?: string) => {
    const isAction = input === "a" || input === "b";
    return (
      <Button
        key={input}
        variant="control"
        className={`size-[48px] bg-foreground text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground data-[pressed=true]:bg-background data-[pressed=true]:text-foreground data-[pressed=true]:hover:bg-background data-[pressed=true]:hover:text-foreground ${className ?? ""}`}
        aria-label={label}
        aria-pressed={pressed.has(input)}
        data-pressed={pressed.has(input)}
        onPointerDown={isAction ? (event) => beginAction(input, event) : undefined}
        onPointerUp={isAction ? (event) => endAction(input, event.pointerId) : undefined}
        onPointerCancel={isAction ? (event) => endAction(input, event.pointerId) : undefined}
        onLostPointerCapture={isAction ? (event) => endAction(input, event.pointerId) : undefined}
        onContextMenu={(event) => event.preventDefault()}
      >
        {content}
      </Button>
    );
  };

  return (
    <div className="emulator-controls mt-[18px] flex touch-none select-none items-end justify-between" aria-label="Emulator controls">
      <div
        className="dpad grid touch-none grid-cols-[repeat(3,48px)] grid-rows-[repeat(3,48px)]"
        aria-label="Direction pad"
        onPointerDown={beginDirections}
        onPointerMove={moveDirections}
        onPointerUp={(event) => endDirections(event.pointerId)}
        onPointerCancel={(event) => endDirections(event.pointerId)}
        onLostPointerCapture={(event) => endDirections(event.pointerId)}
        onContextMenu={(event) => event.preventDefault()}
      >
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
