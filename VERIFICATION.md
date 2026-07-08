# VERIFICATION — running log

Every entry is a real tool result from the session that wrote it. UNTESTED marked plainly.

## Round 1 — Phase 1 core (2026-07-08)

**Tree:** `7259211` on `claude/dev-environment-setup-tsp3tv`.

| Check | Result | Evidence |
|---|---|---|
| `tsc --noEmit` | PASS | zero errors |
| `eslint .` | PASS | zero errors (incl. core-purity + no-form rules) |
| `vitest run` | PASS | **226/226**, 9 files: transport 41 · parity 53 · serializer 23 · metrics 29 · key 19 · migration 22 · store 18 · guards 8 · settings 13 |
| `vite build` | PASS | 142.63 kB / **45.84 kB gzip** (boot shell only — no game code yet) |
| Playwright boot smoke | PASS | pre-baked chromium-1194; shell renders; **zero console errors; zero requests to api.anthropic.com at boot** |
| gitleaks (tree + full history) | PASS | no leaks found, both scans |
| osv-scanner | PASS w/ 4 documented ignores | 4 advisories, ALL dev-toolchain-only (`esbuild (dev)` GHSA-67mh-4wv8-2f99; `vite (dev)` GHSA-4w7w-66w2-5vf9, GHSA-fx2h-pf6j-xcff — Windows-only, GHSA-v6wh-96g9-6wx3 — Windows-only). Fix versions require Vite ≥6.4.2 — breaks the canon-ruled Vite 5 pin. None ship in `dist/` (static output, runtime deps = react/react-dom only). vitest bumped to 3.2.7 to clear the one UI-server critical. Ignores + reasons live in `osv-scanner.toml`; verified exit 0 with "Filtered 4 vulnerabilities" printed. **Correction for the record:** an earlier local run's "exit: 0" was bogus (`$?` captured `tail`'s exit through a pipe, not the scanner's) — CI run 3 exposed the real exit 1; this entry supersedes it. |
| GitHub Actions run 1–2 | FAIL (explained) | guard tests ENOENT on module files not yet committed in those trees (agents' work in flight; committed in `7259211`). Diagnosed from CI logs, not assumed. |
| GitHub Actions run 3 (`7259211`) | e2e job PASS · checks job FAIL at osv step | lint/typecheck/test/build all green in CI; osv-scanner exit 1 on the 4 known findings (log-confirmed — download and scan worked). Fixed by `osv-scanner.toml`; run 4 result in the phase report. |

**Process:** 6 modules implemented by parallel agents with disjoint file ownership → integration green on first run (206 tests) → two adversarial reviews (canon-fidelity, BYOK floor): 0 BLOCKER, 1 MAJOR (stored `origin` on evidence — canon rules provenance derived; removed), 10 minors → all fixed (+20 tests) → my own verification runs above.

**BYOK floor status (Phase 1 scope):** key containment proven by test (own storage key, consent-precedes-store negative-tested, never serialized — planted `sk-ant-` fixture absent from all serializer output); one endpoint constant guard-tested; three error classes + 400KB pre-flight cap classified and tested; fallback acceptance persisted (`founders-quest:settings`) and tested; parity suite byte-matches 03/04 at test time, mutation-checked.

**UNTESTED (by design or pending):** any live Anthropic call (no key exists — operator queue, Phase 4); CSP on a deployed preview (first deploy is Phase 2); e2e beyond boot (UI lands Phase 2); byte-parity fixture for `COUNCIL_SYSTEM_PROMPT` runs in the parity suite but the temple that consumes it is Phase 4.
