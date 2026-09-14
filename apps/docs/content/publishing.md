---
title: Publishing
group: Creator guide
---

# Publish a cartridge

Copy `cartridges/_template` to `cartridges/your-game`. Replace `game.tynt` and add a 320 × 288 nearest-neighbor `cover.png` captured from the 160 × 144 game canvas, then complete `cartridge.json` and the cartridge README.

All submitted cartridge source and artwork must use the MIT License and declare `"license": "MIT"` in `cartridge.json`. By submitting a cartridge, you confirm that you created its contents or have permission to distribute them under MIT.

Run `bun run check` from the repository root. The gallery generator discovers every valid `cartridges/<slug>/` directory automatically; contributors never edit a central registry.

Submit the complete cartridge directory in one pull request. Keep unrelated application, dependency, workflow, and configuration changes out of a cartridge submission.
