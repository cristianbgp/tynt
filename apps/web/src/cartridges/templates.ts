import type { Draft } from "@tynt/core";

export interface CartridgeTemplate {
  id: "blank" | "arcade" | "platformer" | "puzzle" | "top-down";
  name: string;
  description: string;
  draft: Draft;
}

export const CARTRIDGE_TEMPLATES: readonly CartridgeTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Only the three lifecycle functions.",
    draft: {
      title: "untitled",
      description: "A new tynt cartridge.",
      controls: "Add your controls",
      source: `export function init(): void {
  clear(0);
}

export function update(): void {}

export function draw(): void {
  clear(0);
}
`,
    },
  },
  {
    id: "arcade",
    name: "Arcade",
    description: "Movement, collectibles, score, and reset.",
    draft: {
      title: "arcade-game",
      description: "A small score-chasing arcade game.",
      controls: "Arrows move · A collects · B resets",
      source: `let x = 76;
let y = 64;
let targetX = 32;
let targetY = 32;
let score = 0;

function reset(): void {
  x = 76;
  y = 64;
  score = 0;
  seed(1);
}

export function init(): void {
  reset();
}

export function update(): void {
  if (button("left")) x = Math.max(0, x - 1);
  if (button("right")) x = Math.min(152, x + 1);
  if (button("up")) y = Math.max(10, y - 1);
  if (button("down")) y = Math.min(136, y + 1);
  if (buttonPressed("a") && overlap(x, y, 8, 8, targetX, targetY, 6, 6)) {
    score += 1;
    targetX = random(4, 150);
    targetY = random(16, 134);
    tone(880, 60, 0.12);
  }
  if (buttonPressed("b")) reset();
}

export function draw(): void {
  clear(0);
  text("SCORE " + score, 4, 4, 3);
  rect(targetX, targetY, 6, 6, 2, true);
  rect(x, y, 8, 8, 3, true);
}
`,
    },
  },
  {
    id: "platformer",
    name: "Platformer",
    description: "Gravity, jumping, and a solid floor.",
    draft: {
      title: "platformer-game",
      description: "A tiny platformer starting point.",
      controls: "Left/Right move · A jumps · B resets",
      source: `let x = 24;
let y = 112;
let velocityY = 0;
const floorY = 128;

function reset(): void {
  x = 24;
  y = 112;
  velocityY = 0;
}

export function init(): void {
  reset();
}

export function update(): void {
  if (button("left")) x = Math.max(0, x - 1);
  if (button("right")) x = Math.min(152, x + 1);
  const grounded = y >= floorY - 8;
  if (grounded && buttonPressed("a")) velocityY = -4;
  velocityY = Math.min(4, velocityY + 0.2);
  y = Math.min(floorY - 8, y + velocityY);
  if (y >= floorY - 8) velocityY = 0;
  if (buttonPressed("b")) reset();
}

export function draw(): void {
  clear(0);
  text("PLATFORMER", 4, 4, 3);
  rect(0, floorY, 160, 16, 2, true);
  rect(x, y, 8, 8, 3, true);
}
`,
    },
  },
  {
    id: "puzzle",
    name: "Puzzle",
    description: "Grid movement, a goal, and move counting.",
    draft: {
      title: "puzzle-game",
      description: "A compact grid puzzle starting point.",
      controls: "Arrows move · B resets",
      source: `let column = 1;
let row = 1;
let moves = 0;
const goalColumn = 6;
const goalRow = 5;

function reset(): void {
  column = 1;
  row = 1;
  moves = 0;
}

export function init(): void {
  reset();
}

export function update(): void {
  let nextColumn = column;
  let nextRow = row;
  if (buttonPressed("left")) nextColumn -= 1;
  if (buttonPressed("right")) nextColumn += 1;
  if (buttonPressed("up")) nextRow -= 1;
  if (buttonPressed("down")) nextRow += 1;
  nextColumn = Math.max(0, Math.min(7, nextColumn));
  nextRow = Math.max(0, Math.min(5, nextRow));
  if (nextColumn !== column || nextRow !== row) moves += 1;
  column = nextColumn;
  row = nextRow;
  if (buttonPressed("b")) reset();
}

export function draw(): void {
  clear(0);
  text("MOVES " + moves, 4, 4, 3);
  rect(16 + goalColumn * 16, 32 + goalRow * 16, 12, 12, 1, true);
  rect(16 + column * 16, 32 + row * 16, 12, 12, 3, true);
  if (column === goalColumn && row === goalRow) text("SOLVED", 64, 16, 2);
}
`,
    },
  },
  {
    id: "top-down",
    name: "Top-down",
    description: "A scrolling world with a centered player.",
    draft: {
      title: "top-down-game",
      description: "A tiny scrolling adventure starting point.",
      controls: "Arrows move · A interacts · B resets",
      source: `let x = 120;
let y = 100;

function reset(): void {
  x = 120;
  y = 100;
}

export function init(): void {
  reset();
}

export function update(): void {
  if (button("left")) x = Math.max(4, x - 1);
  if (button("right")) x = Math.min(316, x + 1);
  if (button("up")) y = Math.max(4, y - 1);
  if (button("down")) y = Math.min(284, y + 1);
  if (buttonPressed("a")) tone(660, 50, 0.1);
  if (buttonPressed("b")) reset();
}

export function draw(): void {
  camera(x - 80, y - 72);
  clear(0);
  for (let marker = 32; marker < 320; marker += 48) {
    circle(marker, 48 + (marker % 96), 5, 1, true);
  }
  rect(x - 4, y - 4, 8, 8, 3, true);
  camera();
  text("EXPLORE", 4, 4, 3);
}
`,
    },
  },
];
