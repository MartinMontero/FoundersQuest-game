# VERIFICATION — running log

Every entry is a real tool result from the session that wrote it. UNTESTED marked plainly.

## Round 5 — THE mobile crash, root-caused and fixed: CSP blocked WASM (2026-07-08)

**Tree:** `a4fe8eb`. The on-device error readout (round 4's instrumentation) captured the exact cause — and it was mine:

```
call to WebAssembly.instantiate() blocked by CSP
tier: constrained   gl: Adreno (TM) 650   ua: Firefox/152.0 (Android 16)
```

**Root cause:** `public/_headers` set `script-src 'self'` with no WebAssembly allowance. rapier physics instantiates a WASM module ~1s after the scene renders; the CSP blocked it on **every** browser (hence Firefox *and* Chrome), rapier threw, the error boundary showed. `tier: constrained` proves round 4's tier work was correct but **not the cause** — round 4 was necessary mobile hardening, not the fix; this is.

**Why nothing caught it:** the CSP is a Cloudflare Pages HTTP header. `vite dev`, `vite preview`, and the Playwright container all serve **without** `_headers`, so the shipping security policy was exercised by zero tests. A second blind spot (after the automation-only render tier in round 4).

**Fix:** `script-src 'self' 'wasm-unsafe-eval'` — same-origin WebAssembly instantiation only, **not** JS eval. Key-theft defense intact: `connect-src` still `'self' https://api.anthropic.com`, no third-party scripts, no `unsafe-eval`. (`worker-src 'self' blob:` added too.)

| Check | Result | Evidence |
|---|---|---|
| **Reproduced locally** (finally) | YES | `e2e/csp.spec.ts` regression guard serves the real dist under the OLD CSP → app-crashed visible in 1.2s — the exact field bug |
| Fix under the REAL CSP | PASS | csp.spec serves dist under the real parsed `_headers` → world boots, WASM instantiates, no CSP/WASM console error |
| Blind spot closed | YES | csp-server.ts parses the actual `_headers` and applies it; removing `wasm-unsafe-eval` turns the suite red |
| `tsc`/eslint/vitest | PASS | 273 unit unchanged |
| e2e full suite | PASS | **13/13** (+2 CSP specs); one boot flake under load resolved on rerun; CI gains 1 retry |
| gitleaks | PASS | clean |
| redeploy | LIVE | same alias URL serves `a4fe8eb` |

**OPERATOR-CONFIRMED (2026-07-08):** the world holds together on the operator's Galaxy S23 Ultra (mobile), and loads fast + plays smoothly on a Windows 11 laptop in both Firefox and Chrome — mechanics work, gameplay responsive. The crash saga is closed; the CSP/WASM fix is verified on real hardware, not just locally. Operator Verification Queue item (first cross-device playable) ✅.

## Round 4 — mobile render hardening: tiers + context-loss recovery (2026-07-08)

**Correction (see Round 5):** this round did NOT fix the field crash — the real cause was a CSP/WASM block, not the render tier. The tier system + context-loss recovery are genuine, kept mobile hardening (a phone should not run the desktop effect stack), but the "mobile crash fix" framing was premature. Round 5 is the actual fix.


**Tree:** `66ddaf1`. Trigger: operator field report — the reskinned preview crashed on a real phone ("the world failed to hold together" = the app error boundary), preceded by rendering instability.

**Root cause (identified; the exact GL throw NOT reproduced — see below):** `perf.ts` gated render cost only on `navigator.webdriver`, so every real device — including phones — received the full **desktop** tier (Bloom + MSAA + DPR 1.5 + high-performance GPU hint). A mobile GPU can't sustain that → WebGL context loss → and with no recovery handler, that surfaced as the error boundary. The e2e never caught it: the same webdriver gate meant tests only ran the cheapest automation tier — the shipping render path was **untested**.

| Check | Result | Evidence |
|---|---|---|
| Reproduce full-power path here | **could NOT reproduce the crash** | container software-GL (SwiftShader) boots the full path clean and even a forced `WEBGL_lose_context` didn't trip the boundary — confirming the crash is **real-GPU-specific**, honestly stated |
| Fix: three render tiers | in place | full / constrained (phones: no post-fx, cheap sky, DPR 1, no MSAA) / automation; errs toward constrained; `?render=` override |
| Fix: context-loss recovery | in place + tested | `preventDefault` on loss + `invalidate` on restore; forced loss→restore cycle recovers, no boundary, canvas survives |
| all 3 tiers boot clean | PASS | full/desktop, constrained/mobile, auto-detect/mobile — firstFrame reached, zero console/page errors (local repro + e2e) |
| phone auto-detects constrained | PASS | new e2e asserts a touch/coarse context routes to the safe tier (webdriver spoofed off, as a real phone) |
| `tsc`/eslint/vitest/build | PASS | 273 unit unchanged |
| e2e full suite | PASS | **11/11** (+5 new: render-tiers ×4, context-loss ×1) |
| gitleaks / osv | PASS | clean; 4 documented dev-only filters |
| redeploy | LIVE | same alias URL now serves `66ddaf1` |

**UNTESTED (plainly):** the fix on the operator's actual phone hardware — the whole point; needs an operator re-test. The constrained tier + recovery handler are the defensive fix (can't prove a mobile-GPU loss is gone on software GL), now regression-guarded so the shipping paths stay covered.

## Round 3 — Phase 2b cel-shaded presentation pass (2026-07-08)

**Tree:** `a6aac57`. Trigger: Gate 2 presentation FAIL (grey-box rejected as "MS Paint").

| Check | Result | Evidence |
|---|---|---|
| `tsc` / eslint | PASS | zero errors |
| `vitest run` | PASS | 273/273 unchanged — reskin touched zero mechanics/strings/testids |
| `vite build` | PASS | chunk-size advisory only (three.js; split queued for Phase 6 perf) |
| e2e (pre-baked chromium) | PASS | 6/6, stage1 journey 1.4m; the reskin left the regression harness fully green |
| gitleaks / osv | PASS | no leaks; osv 4 documented dev-only filters, no new advisories |
| self-look-check | PASS (my own eyes) | viewed roam.png + trance-open.png: coherent cel-shaded low-poly world (cloaked wanderer, teal rune monoliths, vault sanctum, nebula starfield) + diegetic parchment-journal UI. Night-and-day vs grey-box. |
| **Preview deploy** | **LIVE** | `wrangler pages deploy` success → https://claude-dev-environment-setup.founders-quest-game.pages.dev (project founders-quest-game; `_headers` uploaded) |
| Live CSP header check | **OPERATOR-SIDE** | container egress proxy denies `*.pages.dev` (403 on curl — same block as CC0 asset sites); `_headers` is guard-tested against canon, so CSP ships, but the live-response check is the operator's (DevTools/curl from their machine) |

**Honest caveat:** `perf.ts` downscales the render ONLY under `navigator.webdriver` (automation) — Bloom, Vignette, accent lights, full sky shader, 1400 stars, DPR 1.5 all ship to real browsers. The e2e FPS number (~21 headless software-GL) is not player hardware and not the shipping visual tier.
**UNTESTED:** the live look on operator hardware (the whole point of the preview) · live CSP headers (operator-side) · anything key-dependent (Phase 4).

## Round 2 — Phase 2 grey-box Stage 1 slice (2026-07-08)

**Tree:** `4542ccf`.

| Check | Result | Evidence |
|---|---|---|
| `tsc` / eslint | PASS | zero errors |
| `vitest run` | PASS | **273/273**, 11 files (+16 from review fixes) |
| `vite build` | PASS | 3,170 kB / **1,074.5 kB gzip** (three.js dominates; chunk advisory noted — split consideration for Phase 6 perf pass) |
| e2e (pre-baked chromium-1194) | PASS | **6/6**: boot+loading-triad · plateau rim (strafes the old gap's diagonal 5s, never falls) · reduced-motion camera-at-framing discriminator · normal-motion dolly contrast · storage-degraded honest banner · **stage-1 self-play 4.3 min keyboard-only** (8 shrines, all input types, quickadd→guardian, E2 link, banked-Truth state, flagpole Action-only, vault nudge+capture, reload persistence, exact 02 key-set assertion, zero console errors, zero Anthropic calls) |
| FPS | recorded honestly | ~16 fps mean in HEADLESS CONTAINER on software GL — not player hardware; real-hardware number queued for the operator at Gate 2 |
| gitleaks | PASS | no leaks (tree) |
| Review chain | 1 BLOCKER + 7 MAJOR + 12 MINOR found by two adversarial reviews (canon-fidelity + live play-feel); all fixed and re-verified except items below |
| Cloudflare preview deploy | **BLOCKED (operator)** | token lacks Pages:Edit at execution time (authorization error 10000 on /pages/projects, twice); container may hold the pre-update env value — retry next opportunity/container |

**UNTESTED (plainly):** kill-plane respawn path (the fixed rim now prevents inducing a fall in e2e; code-reviewed only) · error-boundary UI (renders only on a real crash; no fault-injection hook was ruled) · live preview CSP (blocked on the deploy) · anything requiring a real key (Phase 4 queue). **Known accepted noise:** THREE.Clock deprecation warning (three 0.185 + fiber 8 line) — console *warning*, not error; revisit at Phase 6.
**Deferred by rule:** law-3 answer-type hints ship with Phase 3's hint-string canon diff (explicitly surfaced at Gate 2, not drifted). Session-draft retention (F3) vs game-design §2.1 wording — needs a one-line ruling at Gate 2.

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
| GitHub Actions run 3 (`7259211`) | e2e job PASS · checks job FAIL at osv step | lint/typecheck/test/build all green in CI; osv-scanner exit 1 on the 4 known findings (log-confirmed — download and scan worked). Fixed by `osv-scanner.toml`. |
| GitHub Actions run 4 (`a2cf9df`) | **PASS — both jobs, every step** | checks: npm ci → lint → typecheck → test → build → osv-scanner (online, filtered w/ reasons) → gitleaks (full history) all success. e2e: playwright install + boot smoke success. Job ids 85845571327 / 85845571370. |

**Process:** 6 modules implemented by parallel agents with disjoint file ownership → integration green on first run (206 tests) → two adversarial reviews (canon-fidelity, BYOK floor): 0 BLOCKER, 1 MAJOR (stored `origin` on evidence — canon rules provenance derived; removed), 10 minors → all fixed (+20 tests) → my own verification runs above.

**BYOK floor status (Phase 1 scope):** key containment proven by test (own storage key, consent-precedes-store negative-tested, never serialized — planted `sk-ant-` fixture absent from all serializer output); one endpoint constant guard-tested; three error classes + 400KB pre-flight cap classified and tested; fallback acceptance persisted (`founders-quest:settings`) and tested; parity suite byte-matches 03/04 at test time, mutation-checked.

**UNTESTED (by design or pending):** any live Anthropic call (no key exists — operator queue, Phase 4); CSP on a deployed preview (first deploy is Phase 2); e2e beyond boot (UI lands Phase 2); byte-parity fixture for `COUNCIL_SYSTEM_PROMPT` runs in the parity suite but the temple that consumes it is Phase 4.
