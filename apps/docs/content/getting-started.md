---
title: Getting Started
group: Creator guide
---

# Make your first cartridge

A cartridge is a TypeScript file with three exported lifecycle functions. `init()` runs once, `update()` runs at 60 Hz, and `draw()` emits the frame.

```ts
let x = 76;

export function init(): void { clear(0); }

export function update(): void {
  if (button("left")) x = Math.max(0, x - 1);
  if (button("right")) x = Math.min(152, x + 1);
}

export function draw(): void {
  clear(0);
  rect(x, 68, 8, 8, 3, true);
  text("tynt", 72, 82, 2);
}
```

Press **Run** or <kbd>Control</kbd> + <kbd>Shift</kbd> + <kbd>Enter</kbd>. The preview receives focus automatically. Use arrow keys to move, Z for A, and X for B; the on-screen controls work the same way.

Colors are indexes from `0` to `3`: black, dark gray, light gray, and white. Coordinates are rounded to pixels and clipped to 160 × 144.

Next, browse {@link "Examples and Recipes" | Examples and Recipes} or keep the {@link "Cartridge API" | Cartridge API} nearby.
