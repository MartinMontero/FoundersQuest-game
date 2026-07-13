# Founder's Quest

A validation-journey game. Your startup beliefs are the monsters: assumptions
stand as guardians in eight worlds, and only real evidence — things customers
actually said, did, or paid for (E2+) — moves the Truth meter. Self-reported
action alone summons the Shadow.

## Quickstart

Node 20+ (22 preferred).

```bash
npm install
npm run dev        # local dev server

npm test           # unit tests (vitest)
npm run e2e        # end-to-end tests (playwright)
npm run pwa:smoke  # service-worker / installability smoke test

npm run build      # production build to dist/
```

## Controls

- **WASD** or arrow keys — move
- **E** or Enter — interact with what is near or focused
- **Tab** / Shift+Tab — cycle nearby interactables
- **M** — the Cartographer's Chart (once it has been handed over in the opening)
- **L** — the Legend (same unlock as the Chart)
- **F** — Field Mode (the founder's journal side; always available)
- **C** — the Council temple
- **Escape** — close panels / drop focus

## Bring your own key (BYOK)

The Council is the only part of the game that talks to an AI, and it runs on
*your* Anthropic API key, entered at runtime in the Council temple. There is no
server in the path and no shared key: the browser talks to `api.anthropic.com`
directly. Your key is stored on your device under its own storage key, is never
serialized into save data, and never appears in exports. Remove it any time
with the visible control in the temple.

## Privacy

- No telemetry of any kind. No analytics, no crash reporting, no tracking.
- Nothing you write leaves your device without explicit consent, and the only
  destination that exists is the Anthropic API under your own key.
- The game works offline and can be installed (PWA). All assets ship in the
  static bundle; nothing is fetched from third parties at runtime.

## Deploy

Pure static site on Cloudflare Pages: build command `npm run build`, output
directory `dist`, `NODE_VERSION=22`. There is no `functions/` directory, no
secret binding, and nothing server-side to configure — by design (see
`.env.example`). Full steps: `docs/canon/06-deploy-runbook.md`.

## Docs

- `docs/canon/` — the canon, read 01 through 06 in order; `01-constitution.md`
  outranks everything.
- `BACKLOG.md` — the item inventory for the current build run.
- `BLOCKERS.md` — parked decisions and stop conditions, with the resolution log.
- `CREDITS.md` — third-party assets (all CC0) and vendored code (MIT).

Code is AGPL-3.0-or-later; content (questions, recipes, docs) is CC BY 4.0.
