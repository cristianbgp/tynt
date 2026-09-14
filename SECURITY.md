# Security

tynt is pre-release software. Security fixes are made on `main`; older snapshots are not supported separately.

## Report a vulnerability

Do not publish exploit details in a public issue. Use GitHub's private vulnerability reporting for this repository when it is available. If it is unavailable, open a public issue that asks the maintainer for a private contact channel without including reproduction steps, payloads, or sensitive details.

Include the affected route or file, impact, browser and operating-system versions, and the smallest safe reproduction you can provide. Please allow time for a fix before public disclosure.

## Cartridge trust model

Cartridges and their covers are untrusted input.

- Catalog generation parses and transpiles cartridge source but never executes it.
- Public cover images are size-limited, decoded with CRC checks, required to be 160 × 144 pixels, and re-encoded before publication. Submitted metadata and unknown PNG chunks are discarded.
- A running cartridge lives in a fresh opaque-origin sandboxed iframe containing a disposable Web Worker.
- The iframe content security policy denies network, images, styles, nested frames, forms, objects, and navigation. The worker also masks network, storage, worker, timer, and dynamic-code APIs from cartridge scope.
- Every message is checked against its iframe window, a per-run random token, and a strict protocol schema.
- Drawing output, strings, arrays, compiled source, lifecycle duration, heartbeat response, and audio event counts have fixed limits. A violation destroys the iframe and worker.

These layers reduce the impact of malicious cartridges; they are not a claim that executing hostile JavaScript is risk-free. Browser-engine vulnerabilities and short-lived CPU or memory denial-of-service remain possible. Only run cartridges from sources you trust, and keep your browser current.

## Reviewing cartridge pull requests

A cartridge-only contribution should change files inside one `cartridges/<slug>/` directory. Review the pull-request diff in GitHub before checking out its branch. Treat changes to `package.json`, lockfiles, scripts, application code, `.github/workflows`, or files outside that cartridge directory as code changes requiring a full maintainer security review.

Do not run `bun install`, repository scripts, or the contributor's branch locally before reviewing all executable changes. Pull-request CI runs on GitHub-hosted infrastructure with read-only repository permissions, no persisted checkout credential, no deployment step, and a timeout. The workflow must remain on the `pull_request` event; do not change it to `pull_request_target` for untrusted code.

When the diff is cartridge-only, inspect `game.tynt`, `cartridge.json`, `README.md`, and the cover before relying on CI validation. CI is a guardrail, not a substitute for review.
