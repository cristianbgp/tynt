# Contributing to tynt

Thanks for helping build tynt. Code fixes, documentation improvements, and small public cartridges are welcome through pull requests.

Bundled examples and community games use the same contribution path. Each gallery entry is discovered from one `cartridges/<slug>/` directory; there is no separate built-in registry to update.

## Submit a cartridge

1. Copy `cartridges/_template` to `cartridges/your-game`.
2. Use a permanent slug containing lowercase letters, numbers, and single hyphens.
3. Export your game from tynt and replace `game.tynt`.
4. Complete `cartridge.json` using the allowed values below.
5. Capture the 160 × 144 game canvas, scale it to a 320 × 288 PNG with nearest-neighbor pixels, and replace `cover.png`.
6. Update the cartridge README with controls and asset acknowledgements.
7. Run `bun run cartridges:check` and `bun run check`.
8. Open a pull request. Merging the pull request publishes the cartridge in the gallery.

Published cartridges require a non-empty title, author, description, controls, and source inside `game.tynt`. The version 1 file shape is strict and rejects unknown fields. The source must export `init()`, `update()`, and `draw()`, and it cannot import modules or access the network.

Use between 1 and 8 descriptive tags. Each tag may contain 1 to 24 letters, numbers, or single hyphens. Tags are normalized to lowercase, so `3D` is stored as `3d` and still appears as `3D` in the gallery. All submitted cartridge source and artwork must use the MIT License and declare `"license": "MIT"` in `cartridge.json`.

`game.tynt` source is limited to 256 KiB, `cover.png` to 256 KiB, and the entire cartridge directory to 768 KiB. Only `game.tynt`, `cartridge.json`, `cover.png`, and an optional `README.md` are accepted.

By submitting, you agree to license the cartridge source and artwork under the MIT License and confirm that you created them or have permission to distribute them under that license.

## Security for contributors and reviewers

Cartridge files are untrusted until reviewed. A cartridge-only pull request should modify only one `cartridges/<slug>/` directory. Changes to dependencies, lockfiles, scripts, workflows, application code, or any other path require a full code and security review.

Review the complete diff on GitHub before checking out or running a contributor branch. Do not run `bun install` or repository scripts from an unreviewed branch. The catalog generator never executes `game.tynt`; it parses and transpiles the source, normalizes the cover image, and rejects invalid output before publication. Read [SECURITY.md](SECURITY.md) for the full trust model and maintainer checklist.

## Development

Install Bun, install each independent package, and start the web and docs processes:

```sh
bun run install:all
bun run dev
```

Before opening a pull request, run:

```sh
bun run check
```
