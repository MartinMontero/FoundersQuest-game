# VERIFICATION — running log

Every entry is a real tool result from the session that wrote it. UNTESTED marked plainly.

## Round 12 — founder naming + character equipment fix (2026-07-10)

Two operator asks. **(1) Name your founder** — a first-run naming card (`FounderNaming.tsx`) opens
once over the roaming world, keyboard-first (autofocus field, Enter begins, Escape/"Stay founder"
adopts the canon default `founder`). The name persists device-locally under the settings' OWN key
(`founders-quest:settings` → new `founderName` field), NEVER inside `founders-quest:v3`, never sent —
a thin zustand store (`state/founder.ts`) re-renders the HUD, which now shows `FOUNDER · <name>` above
the world banner. Empty/whitespace choices adopt the default so the card never nags. The first-run
movement hint holds back behind the card while the founder is unnamed. **(2) One sword + staff** — the
KayKit rogue ships a knife + two crossbows + a throwable in the RIGHT hand (where the staff goes) and a
knife in the LEFT; `RogueCharacter.tsx` now hides the right-hand knife, both crossbows, and the
throwable, keeping only the left-hand blade — so the founder holds one sword in one hand and the
glowing staff in the other. Screenshot-confirmed.

**e2e note (honest):** the naming card is a first-run modal, so it would block the fresh-start gameplay
specs. Added a `seedFounderName` helper (pre-seeds the settings key via `addInitScript`) applied to
stage1 / plateau / reduced-motion, and dismissed the card in-test in storage-degraded (its shim throws
on `localStorage`, so a seed can't apply — a legit memory-mode exercise of the card). One new spec
(`founder-naming.spec.ts`, 2 tests) covers the name + skip paths, HUD display, persistence-across-reload,
the settings-key/v3 separation, and zero-Anthropic.

**Tree:** committed this round. | `tsc`/`eslint` PASS · `vitest` **286/286** (+13: settings founderName
×5, founder store/helpers ×8) · e2e **17/17** serial (boot · plateau · reduced-motion ×2 · storage-
degraded · stage-1 self-play 1.3 min · render-tiers ×4 · context-loss · csp ×2 · **founder-naming ×2**).
Naming card + named HUD captured at the constrained tier. **UNTESTED:** live preview CSP (deploy still
blocked on the operator's Pages:Edit token, per Round 1 tail); real-hardware FPS (re-flagged).

## Round 11 — photoreal push IV: soft cloud banks / atmosphere (2026-07-09)

The atmosphere half of "push realism". `Clouds.tsx` rings the plateau at the islands' distance with
14 banks × 6 billboarded soft-sprite puffs (the code-built radial sprite — no texture file, CSP-safe),
warm-tinted under the sunset HDR + nebula glow, the whole ring drifting slowly (frozen under reduced
motion), far-sky (fog-independent, depth-write off). Reads as the benchmark's "sky islands adrift in
cloud". Skipped on the automation tier, so e2e is unaffected. **Reflective water deliberately deferred**
— it doesn't fit a floating grass plateau (the benchmark's water is its own world); it belongs in a
later world, not forced into World 1.

**A flake investigation, honestly (worth recording):** I first tried to *raise* the CI fps to steady
the stage-1 movement journey — dropped automation dpr to 0.5 and swapped the 8 pillar models for cheap
cylinders. Both worked (fps 5.5 → 16) but stage-1 then failed *consistently* at the registry re-open
(a `tabToChip` → E step). A `git stash` bisect proved MY changes caused it: HEAD (trees commit) passed,
my changes failed. Diagnosis: the higher fps exposes a timing sensitivity in the test's rapid
Tab-then-E cadence (not a real-player interaction). So I REVERTED both fps hacks to the known-stable
automation cadence and instead raised `retries` (CI 2 / local 1) to absorb the genuine low-fps timing
jitter — a repeatable break would still fail every attempt. Clouds are gated off automation, so they
never touched this.

**Tree:** committed this round. | `tsc`/`eslint` PASS · `vitest` **273/273** · e2e **13/13** (serial).
**UNTESTED:** real-hardware FPS with the full stack (trees + grass + clouds + HDR + shadows) — cheap
on a GPU, unmeasured on the operator's devices (re-flagged).

## Round 10 — photoreal push III: real CC0 trees (2026-07-09)

Operator confirmed the preview runs smooth on both devices and chose "push realism further". First
lever: real trees. `Trees.tsx` loads two Quaternius "Ultimate Nature" CC0 trees (external `.gltf` +
`.bin` + PBR bark/leaf textures, all same-origin so the CSP holds and no `blob:` fetch) and `<Clone>`s
16 (full) / 10 (constrained) across a deterministic scatter that dodges the interactable footprints;
shadow-casting, static. **Mounted only off the CI tier** (`{IS_AUTOMATION ? null : <Trees/>}`) so the
software-GL automation path never loads the ~4 MB of bark textures — automation behaviour is
byte-identical to Round 9, so the whole e2e suite is unaffected.

**Tree:** committed this round. | `tsc`/`eslint` PASS · `vitest` **273/273** · e2e **13/13**.
**Tooling note (not a product issue):** the headless screenshot harness (SwiftShader software-GL) is
now too slow to stabilise a full-viewport full-tier frame — it hangs on Playwright's font/stability
wait. A smaller viewport captures fine, and the boot probe confirms the full tier boots with 0 errors.
Real GPUs render this instantly. **UNTESTED:** real-hardware FPS *with trees* — 16 static models +
4 MB textures are cheap on a GPU but I re-flagged perf to the operator. **Next:** reflective water +
richer atmosphere/clouds (the rest of "push realism").

## Round 9 — photoreal push II: instanced wind-swept grass + an automation-tier FPS fix (2026-07-09)

- **Grass** (`Grass.tsx`) — one InstancedMesh of a tapered curved blade, 9000 (full) / 3500
  (constrained) / **0 (automation)**, GPU-instanced with a vertex-shader wind sway (one shared
  `uTime` uniform, frozen under reduced motion). Per-instance colour + rotation + scale; no shadow
  casting (thousands of casters for no gain). Turns the plateau into the benchmark's savanna field;
  the old primitive cone "grass" is gone.

- **Automation-tier FPS fix (real, diagnosed):** stage1 flaked at the vault step. Grass is 0 on
  automation, so not grass — the CI software-GL FPS had collapsed to ~5.5 (rigged-character skinning
  + textured PBR ground), and with rapier's FIXED timestep low fps runs the game in slow motion, so
  the long movement journey times out. Fix: the automation tier swaps the 54-bone skinned character
  for a cheap capsule and the textured ground for the vertex-colour disk (its whole job is the
  cheapest deterministic path; the real character/ground are exercised by the full/constrained boot
  specs). FPS recovered **5.5 → 10.6 mean**; stage1 back to a clean 1.7 min pass.

**Tree:** committed this round. | `tsc`/`eslint` PASS · `vitest` **273/273** · e2e **13/13** (serial).
**UNTESTED:** real-hardware FPS with grass — GPU-instanced blades are one draw call (cheap on a real
GPU) but unmeasured on the operator's devices; asked them to confirm smoothness before more weight.
**Still primitive (next, if it fits the nebula theme):** the Vault, optional trees, reflective water.

## Round 8 — photoreal push I: founder's staff + PBR ground texture; a live CSP bug fixed (2026-07-09)

Operator locked the direction ("match the benchmark — photoreal") and asked to give the character a
proper staff (the Round-6 idea). This round: the staff, a real ground texture, and a **real CSP bug
the stale-dist e2e had been masking**.

- **Staff** — a glowing-crystal staff, world-scale, whose position tracks the rogue's right-hand
  weapon bone (`handslotr` — GLTFLoader strips the `.`) every frame; held vertical. On-fiction.
- **Ground** — the flat vertex-colour disk → a real CC0 PBR texture set (Poly Haven "aerial_grass_rock":
  albedo + normal + packed ARM), tiled via new planar UVs, receiving shadows.

**LIVE BUG FIXED (important):** GLTFLoader loads the KayKit models' embedded textures via `blob:`
URLs and *fetches* them, but the shipped CSP `connect-src` lacked `blob:` — so on the real Cloudflare
deploy the character and pillars would render **untextured** (blob fetch refused). Dev has no CSP, so
my screenshots couldn't show it; the csp.spec's `beforeAll` only rebuilt when `dist` was missing, so
it tested a stale (model-less) build and passed falsely. Fixes: (1) `connect-src … blob:` in
`public/_headers` (blob: is app-created data, no exfiltration — BYOK posture intact); (2) csp.spec
now ALWAYS rebuilds so it can never false-green on stale dist again; (3) added `.jpg/.glb/.hdr` MIME
types to the test server.

**Also:** the heavier full-tier scene boots ~30 s on the CI software-GL renderer (≈2–3 s on a real
GPU), past Playwright's 30 s default — added a 90 s global test timeout + 120 s on the context-loss
spec. Not a product regression; software-GL is CPU rasterisation.

**Tree:** committed this round. | `tsc`/`eslint` PASS · `vitest` **273/273** · e2e **13/13** (serial).
**UNTESTED:** real-hardware FPS — the CI software-GL number keeps dropping (~5.5 fps mean now) as the
scene gets heavier; this is NOT player hardware, but I will not pile on more weight before the
operator confirms it runs smooth on their laptop/phone. **Still primitive (next):** grass (benchmark
savanna signature), trees, the Vault, reflective water.

## Round 7 — the real-asset pivot: authored CC0 geometry + HDR lighting (2026-07-09)

**Why:** the operator rejected Round 6 too — "you polished your turd but left everything else
the same, ignoring your own research and the screenshots I gave you" — and supplied five
exploreone.games benchmark shots showing **real rigged characters, PBR textures, reflective water,
HDR-lit atmosphere**. Round 6 did the post-fx + juice but kept primitive geometry. The research
verdict (`docs/research/premium-ui-direction.md`) was explicit that authored assets are required
and I'd dodged it. This round stops polishing primitives and swaps in real geometry.

**Assets can be sourced here (proven this round):** `raw.githubusercontent.com` reaches CC0 packs —
KayKit (Kay Lousberg, CC0) and Poly Haven HDRIs (CC0). Vendored, self-contained, same-origin (CSP
`default-src 'self'` holds): `public/models/rogue.glb` (KayKit hooded rogue — rigged, Idle/Walk/Run
baked), `public/models/pillar.glb` (KayKit dungeon pillar), `public/hdr/venice_sunset_1k.hdr`.

**What changed:**
- **Player** — primitive cloak → the real rigged KayKit rogue (drei useGLTF/useAnimations); gait
  (idle/walk/run) driven from the physics frame via a ref, crossfaded, no per-frame re-render.
- **Lighting** — drei `<Environment>` HDR image-based lighting (real reflections + ambient) on every
  PBR surface; a shadow-casting key light. **Real shadows** (full tier).
- **Materials** — every `meshToonMaterial` → `meshStandardMaterial` (props, monuments, islands,
  ground drum, ground disk); glows kept as emissive; crystals now low-roughness gems.
- **Shrines** — primitive cone-stacks → the real KayKit stone pillar model (`<Clone>` × 8), with the
  glowing rune band + floating glyph kept for gameplay state.
- Ground disk + props now `receiveShadow`/`castShadow`.

**Tree:** committed this round. | **Checks:**

| Check | Result | Evidence |
|---|---|---|
| `tsc` / `eslint` | PASS | zero errors |
| `vitest run` | PASS | **273/273** (no mechanic/testid/data-shape/canon touched) |
| e2e | PASS | **13/13** — full serial run |
| Visual verification | PASS (my eyes) | full + constrained tiers render a cohesive real-asset world; character animates, casts shadow; pillars/rocks are real geometry under HDR |

**Two real regressions found and fixed this round (not contention hand-waving — diagnosed):**
1. e2e flaked 4/13 under the heavier scene. Root cause proven: **each failing test passes when run
   ALONE** (full-tier boot 19 s alone; the induced context-loss cycles with 0 errors alone). Two
   heavy full-tier WebGL contexts on the CI's CPU software-GL (SwiftShader) starve each other. Fix:
   `workers: 1` (serial WebGL) in `playwright.config.ts` — all 13 green.
2. The HDR PMREM prefilter is the one boot step SwiftShader chokes on. Fix: the **automation tier
   skips the HDR** (its stated job is the cheapest, most deterministic path) and leans on brighter
   direct lights; real devices (full/constrained) keep IBL.

**UNTESTED / honest gaps (plainly):** real-hardware FPS with HDR + shadows + a skinned character —
the CI software-GL number (~8 fps mean) is NOT player hardware, but the full stack is heavier than
Round 6 and unmeasured on the operator's laptop/phone (queued). Live preview CSP under the new
same-origin assets (deploy this round; asserted only by the local csp.spec against the built dist).
**Still primitive (next pass if the direction lands):** the Vault (boxy), the little grass/tree
cones, and the ground has no PBR texture yet.

## Round 6 — aesthetic overhaul: from "MS-Paint" to a cinematic low-poly look (2026-07-09)

**Why:** the operator rejected the look three times as "MS Paint from Windows 95." The
deep-research verdict (Round 5b doc `docs/research/premium-ui-direction.md`) proved procedural
primitives have a hard ceiling — premium needs authored assets **+ a post-processing stack + juice,
combined**. The reachable authored asset (a CC0 robot) would break canon (protagonist is the cloaked
founder), so this pass took the two levers that DON'T need new geometry and don't break fiction — a
cinematic post-fx stack and code-generated textures — and rebuilt the worst-offending primitives.

**The discipline change that mattered:** I screenshotted the real game with Playwright and iterated
against my own eyes across all three render tiers, instead of shipping visuals I'd never looked at
(the root of the three prior rejections). Baseline → pass 1–4 captured each step.

**What changed (all code, zero bundled binaries):**
- **Stars** — the loudest MS-Paint tell (hard pixel squares) → soft round point sprites (code-built
  RGBA `makeSoftSprite` DataTexture), scattered across the sky dome (not a hot spiral that bloomed
  into a pale smear), additive blend, `fog:false`. The mystery "pale box" from the baseline was that
  spiral's inner arm blooming — gone.
- **A cinematic sun** — a warm disc + soft additive sprite halo, God-Rays keyed off it (full tier).
  The halo is a sprite (not a translucent sphere) so it reads on EVERY tier — the old sphere only
  looked right once full-tier Bloom blew it out; on a phone it was a fried-egg ring.
- **Post-fx** (`PostFx.tsx`, full tier only) — God Rays + selective Bloom + warm HueSaturation/
  BrightnessContrast grade + SMAA + Vignette + ACES ToneMapping. Constrained/automation still drop
  the composer entirely (the mobile-crash budget is untouched).
- **Floating islands** — brown dodecahedron blobs → grassy-capped floating islets over torn rocky
  keels with a faint violet underglow, pushed out as background.
- **Crystals** — flat pale cones → glowing teal + violet faceted gems (bloom-catching emissive).
- **Ground** — added decorrelated mossy-grass patches + more colour contrast (less mud).
- **Character** — the cloaked founder gains a glowing crystal staff + rune-lit hem (a real
  "adventurer" silhouette, on-fiction), keeping the physics capsule and all animation.
- **Mobile sky** — the cheap shader gained the golden-hour glow band (one smoothstep) so phones get
  the warm "air" too, not a cold console gradient.

**Tree:** committed this round (see git log). | **Checks:**

| Check | Result | Evidence |
|---|---|---|
| `tsc --noEmit` / `eslint .` | PASS | zero errors |
| `vitest run` | PASS | **273/273**, 11 files (no mechanic/testid/data-shape touched) |
| e2e (pre-baked chromium-1194) | PASS | **13/13**: boot · CSP-boots + WASM regression guard · plateau rim · context-loss recover · reduced-motion cut + normal dolly · **all 3 render tiers boot clean (full Bloom/GodRays/SMAA path included)** · storage-degraded · **stage-1 self-play 1.6 min keyboard-only** |
| Visual verification | PASS (my eyes) | full + constrained + automation tiers all render the new look; before/after screenshots captured; God Rays/Bloom don't blow out; no square stars on any tier |

**UNTESTED (plainly):** real-hardware FPS with the heavier full-tier stack (God Rays adds one pass) —
the operator's Windows-11 laptop previously ran Bloom+Vignette "smooth"; the added passes are modest
but unmeasured on player hardware (queued for the operator). Live preview CSP under the new build
(deploy pending). **Not a regression:** the constrained/automation composer-drop path is unchanged,
so the mobile WASM-crash fix (Round 5) is unaffected.

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
