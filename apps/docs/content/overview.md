# Create tiny games with tynt

tynt is a tiny browser game console for making and sharing monochrome TypeScript games on a fixed 160 × 144 canvas.

```ts
export function init(): void { clear(0); }
export function update(): void {}
export function draw(): void {
  clear(0);
  text("hello tynt", 48, 68, 3);
}
```

Start with {@link "Getting Started" | Getting Started}, explore the generated {@link "Cartridge API" | Cartridge API}, or learn how to {@link Publishing | publish a cartridge}.

The editor, gallery, local library, and sprite editor live together in the web app. Every public example is a normal repository cartridge you can inspect and remix.
