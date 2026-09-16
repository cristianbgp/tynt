import { useRef, type PointerEventHandler } from "react";

interface PointerPaintOptions {
  selector: string;
  paint(element: HTMLElement): void;
}

export function usePointerPaint<T extends HTMLElement>({ selector, paint }: PointerPaintOptions) {
  const activePointer = useRef<number | null>(null);
  const paintedCells = useRef(new Set<HTMLElement>());

  const cellAtPointer = (root: T, target: EventTarget | null, clientX: number, clientY: number) => {
    const direct = target instanceof Element ? target.closest<HTMLElement>(selector) : null;
    if (direct && root.contains(direct)) return direct;
    const hit = document.elementFromPoint?.(clientX, clientY)?.closest<HTMLElement>(selector) ?? null;
    return hit && root.contains(hit) ? hit : null;
  };

  const paintCell = (cell: HTMLElement | null) => {
    if (!cell || paintedCells.current.has(cell)) return;
    paintedCells.current.add(cell);
    paint(cell);
  };

  const onPointerDown: PointerEventHandler<T> = (event) => {
    if (activePointer.current !== null) return;
    const cell = cellAtPointer(event.currentTarget, event.target, event.clientX, event.clientY);
    if (!cell) return;
    activePointer.current = event.pointerId;
    paintedCells.current = new Set();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    paintCell(cell);
  };

  const onPointerMove: PointerEventHandler<T> = (event) => {
    if (activePointer.current !== event.pointerId) return;
    event.preventDefault();
    paintCell(cellAtPointer(event.currentTarget, event.target, event.clientX, event.clientY));
  };

  const finishStroke: PointerEventHandler<T> = (event) => {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    paintedCells.current.clear();
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: finishStroke,
    onPointerCancel: finishStroke,
    onLostPointerCapture: finishStroke,
  };
}
