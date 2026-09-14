---
title: Examples and Recipes
group: Creator guide
---

# Examples and recipes

Every gallery entry is a complete cartridge under `cartridges/<slug>/`.

## Learn one idea at a time

- `starter.tynt` covers lifecycle, movement, A/B input, and score.
- `shapes.tynt` demonstrates every drawing primitive.
- `sprites.tynt` draws the tynt mark and a two-frame character.
- `coin-dash.tynt` combines sprites, tile maps, camera movement, timers, collisions, randomness, and audio.
- `platformer.tynt` demonstrates gravity and platform collision.
- `snake.tynt`, `pong.tynt`, and `asteroids.tynt` are compact complete games.

## Fixed HUD with a moving camera

```ts
camera(playerX - 76, 0);
sprite(HERO, 8, 8, playerX, playerY, 0);
camera();
text("SCORE " + score, 6, 6, 3);
```

## Deterministic timing

```ts
if (every(30)) tone(440, 50, 0.08);
if (after(60 * 10)) text("TIME", 68, 68, 3);
```
