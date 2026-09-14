---
title: Security
group: Creator guide
---

# Cartridge security

Treat every cartridge as untrusted code. tynt runs cartridges in a fresh opaque-origin sandboxed iframe and disposable worker, with network and storage APIs unavailable. Messages are validated, lifecycle calls have watchdogs, and drawing and audio have fixed budgets.

Public covers are decoded with CRC checks, required to be exactly 320 × 288 pixels, and re-encoded before publication. These protections reduce risk but cannot eliminate browser-engine vulnerabilities or brief denial-of-service attempts.

Review the complete diff before checking out a contributed branch or running repository commands. A cartridge-only change belongs inside one `cartridges/<slug>/` directory. Report vulnerabilities using the repository `SECURITY.md` instructions.
