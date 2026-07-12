# BACKLOG — Backlog Build-Out + Design Elevation run (2026-07-11)

The full owed-work inventory, harvested by an 8-reader research pass over canon
01→06, docs/build/*, docs/research/*, the program records (SITREP/SHIP/BLOCKERS/
VERIFICATION/PLAN/AUDIT), the repo itself, and all 23 archived feel-pack shots.
Every item carries provenance. Rank: P0 security/broken · P1 correctness/UX/
canon-promised · P2 polish. Baseline at open: vitest 411/411 · e2e 31+3 skipped,
zero flaky (ground-truth run this session) · gitleaks clean tree+history ·
osv clean via offline DB (reproduced, see P0-1).

Ordering note: within rank, epics are sequenced in PLAN.md. Items marked
**PARKED** close into BLOCKERS.md with an operator-facing decision — zero
silent drops (DoD).

---

## P0 — security / broken

- [x] **P0-1 · osv-scanner inherited claim → verified.** A4/A5 closes carried
  "osv-clean" inherited from the A3-morning scan because api.osv.dev returns
  proxy 403 (VERIFICATION.md A4/A5 close tables). CLOSED this session:
  `osv-scanner scan --offline-vulnerabilities --download-offline-databases`
  succeeds through the proxy → **No issues found**; only the 4 documented
  dev-only ignores filter (osv-scanner.toml:9-24, reasons re-verified accurate
  against the advisories by the stack audit). Residual: wire offline mode into
  the local verify path (prompt rule: offline locally, online in CI — CI
  already runs online, .github/workflows/ci.yml). Acceptance: VERIFICATION
  close runs use the offline command and record real results.
- [x] **P0-2 · gitleaks over tree AND full history.** Run this session: both
  clean (`gitleaks detect --no-git` and `gitleaks detect`, no leaks found).
  CI already scans history (fetch-depth 0). Acceptance: every close run
  records both. DONE — keep in the verify loop.
- [x] **P0-3 (DONE 2026-07-11: resize:none law + guard; packs recaptured) · §3 banned outcome LIVE in product: stock textarea resize grip.**
  Feel-pack review: a3/05-trance-frame.png shows the default browser resize
  grip on the trance textarea — art-direction §3 bans default-browser
  controls; the Mission text repeats it ("zero default-browser controls
  anywhere"). This is in the shipped UI, not just the record. Acceptance:
  `resize-none` (or styled equivalent) on every textarea; feel-shot re-capture
  confirms; a static grep-style check keeps it out.
- [x] **P0-4 (DONE 2026-07-11: constrained-tier capture; all packs recaptured, rogue in frame) · Banned capsule protagonist in the archived feel record.**
  Root cause found: the capture/automation tier skips rogue.glb and renders
  the CapsuleAvatar fallback (src/game/Player.tsx:174); 10 of 23 archived
  shots show a visible-primitive protagonist → auto-fail §4.3/§4.8
  (feel-pack audit, per-shot list in AUDIT.md). Acceptance: capture path
  loads the rigged model (or masks the avatar out of frame by design, ruled
  honestly); ALL packs recaptured on the fixed tier; no primitive protagonist
  in any archived shot.

## P1 — the Field Mode epic (A-101; the largest unbuilt canon feature)

Schema keys landed (huntList/fieldJournal/momentum/fieldDay — 02:81); zero
surfaces exist. Build to docs/build/a101-field-mode-spec.md's letter:

- [ ] **F-1 · Hunt list + slot lifecycle** (§2, spec:93-127): profiles
  (never persons), cold/warm-intro slots, spawned-by-attempt evolution,
  open→attempted→hollow|filled states. Acceptance: spec §2 states round-trip
  in founders-quest:v3; unit + e2e.
- [ ] **F-2 · Field journal — attempts logged BEFORE outcome** (§3 accounting
  contract A1-A4, spec:130-143 — BINDING): `startedAt` precedes outcome
  structurally (an attempt cannot be created resolved); a rejection still
  fills the slot; tiers stay the only Truth path. Acceptance: the A1-A4
  invariants each ship as a unit test.
- [ ] **F-3 · Momentum lantern** (§6, spec:191-214): 0–7, decay tick, trough
  freeze (cadence law), NO breakable streak; desktop lantern renderer
  (game-design:37). Display chrome §14.5 is OPEN → resolve within the ruling
  or park. Acceptance: momentum never touches Truth/XP/Action (test), trough
  freezes decay (test).
- [ ] **F-4 · Field Day** (§7, spec:217-227): capture sprint, goal attempts,
  retro; no confidential class (ruling). Acceptance: spec states + log
  round-trip; e2e.
- [ ] **F-5 · Rarity ladder + Legendary funeral path** (§4, spec:147-163):
  display-only rarity (tier drives mechanics — schema comment already
  enforces). Acceptance: rarity never enters metrics (test).
- [ ] **F-6 · Encounter taxonomy, introvert-inclusive** (§5, spec:165-188).
- [ ] **F-7 · Import pipeline** (§8, spec:229-262 — BINDING): envelope,
  preview + confirm, provenance badge, append-only dedupe, the seven
  integrity rules. **F-103 derived-provenance invariant** (§12, operator-
  injected): no evidence enters by ANY import path without atomic
  fieldJournal.imports registration — ships as a test. Acceptance: all seven
  rules unit-tested; F-103 green; e2e import round-trip incl. dedupe re-import.
- [ ] **F-8 · QR beam** (§8.1, spec:263-268 + R-H §14.1): canonical path =
  phone displays QR → desktop webcam scans; vendored MIT encoder + vendored
  decoder fallback per R-H (vendoring ≠ new service; new DEPENDENCY = Rule 9
  FQ protocol → list exact packages/licenses for approval BEFORE adding).
  Acceptance: encode/decode round-trip e2e (synthetic camera frame), license
  files vendored, camera permission copy honest, Permissions-Policy already
  allows camera=(self) (public/_headers:5 — currently unused, F-8 is its
  intended consumer).
- [ ] **F-9 · PWA/A2HS + iOS ITP mitigations** (§9, spec:272-284): hand-rolled
  service worker (no new deps), A2HS prompt, transfer-first framing for
  eviction risk. Acceptance: SW registers/updates cleanly; no cache poisoning
  of index.html (documented strategy); e2e smoke.
- [ ] **F-10 · Serializer '## Field journal' section** (§11, spec:301-312;
  02:101): full + compact modes. Acceptance: serializer tests extended;
  Family-Dinner exclusion untouched (guard stays green).
- [ ] **F-11 · Responsive/mobile-usable DOM for all Field Mode surfaces**
  (spec + game-design:8,163 mobile read-only journal review): the 3D world
  stays desktop-first with a graceful small-viewport message. Acceptance:
  mobile/tablet/desktop verified in e2e viewport runs.
- [ ] **F-12 · Voice capture (opt-in, typed primary)** (§10, spec:288-297) —
  P2 within the epic; browser SpeechRecognition only if it adds no dep/service,
  else PARK.

## P1 — the Design-Elevation epic (world-by-world, feel-pack gate per world)

Binding law: art-direction §2 mandates, §3 banned outcomes, §4 shot criteria,
§5 palettes (W2-W8 "directional, tunable"). Elevation bar on top (Mission):
composed places, centrepieces, silhouette language, lighting doing emotional
work, world REACTS to dramatic beats (the feel audit's #1 systemic gap: every
celebration is currently a parchment panel over an inert backdrop).

- [x] **E-0 · Shared groundwork (2026-07-11):** DONE — capture-tier fix +
  packs recaptured (P0-4) · panel typography pass (eyebrow rule on every
  surface; a4/04 counter-contrast + a3/07 legend scroll fixed; chip edge
  clamping deferred to E-9, recorded) · camera language (arena/ego framing +
  rite vigil rise, reduced-motion cut preserved) · celebration staging
  framework (CelebrationFx: shatter/pillar/funeral/integration beats staged
  in-world) · weather→sky tint (display-only, W1 byte-pinned, unit-tested) ·
  rogue.glb 3.6MB→186KB · bundle split (app 227KB + engine shelves). DOF/post
  already tier-gated (PostFx full-tier only); finer DOF rides the world
  passes. Original scope: capture-tier fix (P0-4) · panel
  material/typography pass across every DOM surface (diegetic stone/parchment
  craft, spacing, ghost-text overlap fix a4/04, tooltip edge-clipping) ·
  camera transition language (world-gate crossing dolly, arena entry, rite
  vigil — all behind reduced-motion) · celebration staging framework so the
  WORLD reacts (light shift, particles, set-piece response) at: funeral rite,
  pillar transformation, guardian shatter, Ego phases, integration ·
  weather→sky tint (SITREP:216 — now in scope) · rogue.glb 3.6MB → <1MB
  (draco/meshopt via three's bundled loaders — no new dep; degrade path
  RETESTED) · code-split the 3.6MB single chunk (vite manualChunks; three/
  rapier/UI split; VERIFICATION Round-3 item) · DOF/post behind quality
  toggle AND reduced-motion (F12 caveat).
- [ ] **E-1 · W1 The Problem (indigo/violet nebula):** elevate existing
  composition to the new bar — ground palette to §5 (feel audit: brown vs
  mandated indigo/violet), spiral islands + Five Whys well as real
  destinations (game-design:41-46), shrine architecture "enterable, never
  lone slabs" (§2.6 — currently glow-ring pillars, feel audit), arena
  framing fix (a4 nit), graveside actually visible at the circle.
- [ ] **E-2 · W2 Research (Raven fellowship):** field-rules banner arch,
  Fellowship clearing, rookery (game-design:48-54); ≥3 landmark silhouettes;
  composed spawn sightline.
- [ ] **E-3 · W3 Prototyping (Phoenix forge):** forge path, pyre, Spark of
  Joy, Vault altar unseal moment (game-design:55-59).
- [ ] **E-4 · W4 Testing (Labyrinth):** seal stone at maze mouth, red
  floor-thread nav aid (game-design:61-65).
- [ ] **E-5 · W5 Feedback (Mirror):** verdict mirror, walking reflection,
  Graveyard, decision lectern, Reality Check portal staging (game-design:67-72).
- [ ] **E-6 · W6 Refinement (Sculptor):** marble atelier + The Unseen annex
  with four shadowed figures (game-design:74-78).
- [ ] **E-7 · W7 Implementation (Bridge):** plank-station span, cracked SPOF
  plank, mid-span Re-Build portal (game-design:80-85).
- [ ] **E-8 · W8 Launch (Rocket, night launchpad per §5):** spine-engraved
  rocket hull, floodlights/engine glow, **the launch sequence — the arrival
  moment, currently absent** (game-design:87-91; SITREP:210), Ego threshold
  elevated from "flat black slab" (feel audit a5/01), Ego world-embodiment
  during the fight phases.
- [ ] **E-9 · Chart + HUD polish:** W7/W8 label crowding fix (SITREP:70) ·
  per-world Truth/Action pips (SITREP:70-71) · legend truncation fix (a3/07)
  · chart label collision (a3/06) · HUD spacing/typography pass.
- [ ] **E-10 · First Light v2:** Raven presence upgrade ONLY within CC0 —
  audit confirmed no CC0 rigged raven exists (D36) → stylized in-engine
  build or sigil evolution · Chart unfurl animation (reduced-motion gated).
- [ ] **E-11 · Attribution page** (game-design:215): in-game credits for CC0/
  KayKit assets; per-pack license verification where marked VERIFY-ONLINE.

Per-world gate: feel pack captured on the FIXED tier, self-audited vs §4 +
elevation criteria; a failing world is not done. ≥30fps on modest hardware
honored via the existing render tiers (real-hardware FPS remains operator-
verified — recorded honestly as UNTESTED in-container, VERIFICATION Rounds 6-12).

## P1 — Audio (game-design §7, entirely unbuilt)

- [ ] **A-1 · CC0 ambient beds per world + UI cues** (shrine chime, tier ding,
  celebration sting, funeral bell): silence is the default until the player
  opts in; independent sliders (settings store, own key); never autoplay loud.
  Assets must be CC0 with license notes in the attribution page; asset FILES
  are not new dependencies, but any audio LIBRARY would be → none planned
  (three's AudioListener/Audio suffices). Acceptance: sliders persist;
  reduced-motion unaffected; a11y — no audio-only signals.

## P1 — Mechanics backlog

- [ ] **M-1 · Proving Circle action-feel variety:** telegraphed bias-attack
  patterns from the research catalog (compliment projectiles, cherry-pick
  shield, escalation doubling, etc. — antagonist research §4:117-125) as
  PRESENTATION-layer rhythm in the press phase. **D-C invariant unchanged:
  windows still auto-open; skill accelerates, never gates** (the invariant
  suite must stay green). Addresses the "stagger is labor" nit (SITREP:66).
- [ ] **M-2 · Confrontations beyond W1 (W2-W7):** arena per world (D-A:
  confrontations are per-world encounters), same argument-state core, same
  invariants, minion THEMING per research §minions (W2 politeness golems …
  W7 unit-economics leviathans, catalog at antagonist research:127-135).
  One feel-pack per world. Acceptance: arenaChallenger already scopes by
  stage (core is ready); per-world specs; invariant suite green.
- [ ] **M-3 · Funeral per-stage grants — METRIC-UNTOUCHED ONLY:** research
  grants (research:86). Anything touching Truth/XP/Action formulas is a
  canon diff → **STOP**. Buildable subset: presentation-layer only (e.g.,
  arena poise/window pacing eases per held funeral of that stage — poise is
  session presentation, not a metric). If even that reads metric-adjacent
  during build: PARK to BLOCKERS.
- [ ] **M-4 · Ego divergence-scaled heavy attacks:** derived divergence is
  computed but unused in the fight (src/core/ego.ts:93 note) — surface it as
  the heavy-attack presentation in phases (pre-written lines scale). No
  formula change.
- [ ] **M-5 · Funeral map change — lift the dead guardian's "fog"** (research:87):
  presentation-layer world response; pairs with E-0 celebration staging.
- [ ] **M-6 · Validated pillar persistent on the map** (D-D; research:71):
  standing pillar rendered in the guardian's origin world after validation
  (combat-ally behavior stays deferred per D-D).

## P1 — Council temple (gated epic)

- [ ] **C-1 · Temple surface + key UI + consent/cost + fallback readings.**
  B-4 is OPEN at reach-time (BLOCKERS.md:5-13) → per the run charter: build
  the temple surface, key-entry UI with visible remove control (key under its
  own storage key, never serialized — keyManager exists and is guard-tested),
  consent flow with the cost line ("about a journal in, a page out"),
  pre-written fallback readings; **live calls stay dark**; log in BLOCKERS.
  The transport (browser→api.anthropic.com direct, fable-5 pinned, sonnet-4-6
  fallback-on-acceptance persisted, council[].model labeling) is already
  built and unit-tested (src/transport/council.ts). Family-Dinner exclusion
  is structural in the serializer (guard-tested) — re-assert in e2e.
  Acceptance: full flow e2e against the existing stubs; zero live traffic;
  key never in any serialization (sk-ant- scan green); consent precedes any
  send affordance.
- [ ] **C-2 · Live Council** — **PARKED on B-4 + operator key**: first live
  reading enters the Operator Verification Queue, marked UNTESTED until the
  operator verifies. Cannot close in-container.

## P1 — a11y fixes (from the security/a11y audit; file:line in AUDIT.md)

- [ ] **X-1 · FounderNaming:** focus trap + focus restoration; document-level
  Esc; accessible name on the input (label, not placeholder); drop the
  outline-none suppression (src/ui/FounderNaming.tsx:51-83).
- [ ] **X-2 · OpeningOverlay Invitation:** focus trap + Esc handling
  (src/ui/OpeningOverlay.tsx:109-148) — Esc should mean "skip for now"
  semantics or safe close, honestly chosen.
- [ ] **X-3 · CSP tightening:** document or remove `blob:` in connect-src
  (public/_headers:6 — used by the export download flow? verify; guard test
  only checks containment) — tighten to the documented policy or document
  why blob: stays. Keep camera=(self) with an honest comment pointing at F-8.

## P2 — polish / recorded nits

- [ ] **Z-1 · Chart nested tooltips** one-more-level cap (SHIP A3 deviation).
- [ ] **Z-2 · Cold-open camera dolly** — standard rig upgrade (SHIP A3
  deviation; pairs with E-0 camera language).
- [ ] **Z-3 · Raven re-entry perch at shrines** (F11 deferred; cheap-v1
  shipped — src/state/firstlight.ts:5). Pairs with E-10.
- [ ] **Z-4 · Reflective water** in one world (VERIFICATION Round 11) —
  candidate W5 Mirror causeway (E-5).
- [ ] **Z-5 · THREE.Clock deprecation note** (Round 2) — verify against
  three 0.185 and fix or record.
- [ ] **Z-6 · Kill-plane respawn + error-boundary fault injection** —
  UNTESTED items (Round 2): add e2e/fault hooks where cheap; else keep the
  honest label.
- [ ] **Z-7 · Colliders e2e coverage** (Round 14).
- [ ] **Z-8 · Stage1 registry-reopen FPS-jitter flake** — pre-existing,
  retry-absorbed; investigate once during the verify loop; do not chase
  (anti-thrash) if unreproducible.
- [ ] **Z-9 · @types/node 26 vs Node 22 runtime** — align types to the
  runtime (dev-only version change, no new dep).
- [ ] **Z-10 · e2e helper TAB_CYCLE_LIMIT audit** — W1 cycle has grown
  (arena added); verify limits are safely above interactable counts.
- [ ] **Z-11 · README + CHANGELOG** current (DoD: setup/build/deploy/controls;
  program-state → this run's deltas). "No server env exists" documented where
  .env.example would live.
- [ ] **Z-12 · Stale-alias hygiene:** unsuffixed Pages alias serves an
  A3-era build (verified by asset hash, commit 16c1322). Document the live
  alias everywhere; no deletion (Rule 9) — note for the operator.

## PARKED → BLOCKERS.md (operator-facing; zero silent drops)

- **K-1 · Reset-loop retro + undefended-critique prompts:** canon question
  text **DOES NOT EXIST in 03** (verified: only the section-header
  parenthetical at 03:95). Wiring them means authoring canon copy → canon
  diff → STOP. Needs: operator supplies the verbatim prompts (or approves a
  drafted 03 diff).
- **K-2 · B-4 Council provenance block** (standing since A1) — needs
  cc-prompt-earned-hunch.md upload or approval of a posted draft.
- **K-3 · i18n 40 locales** (05:13) — D-scope STOP item by CLAUDE.md; also
  prereq (wcjbt repo) unreachable.
- **K-4 · Mentor & Shadow in-app AI · Interview Debrief · Story Forge ·
  pre-mortem ritual · Five-Whys visual chain · onboarding tour · cookbook ·
  dinner shared-board · self-hosting recipe** (05:17 "next after" list) —
  recorded queued features whose prompts "are to be crafted here" per canon;
  each needs an operator ruling/prompt before build (several touch D-scope
  or new canon content). Parked individually with that reason.
- **K-5 · Whiplash ritual** — still source-blocked (R-K; game-design:193,277).
- **K-6 · OQ4 id-constants cross-check** — blocked on the operator's v3
  source upload (game-design:277).
- **K-7 · Session-draft retention (F3) wording** — needs the one-line
  operator ruling (VERIFICATION Round 2).
- **K-8 · Per-beat spine→evidence map** (OQ3/R-S, 05:22) — deferred by
  operator ruling; taking it requires the drafted 02 diff approval.
- **K-9 · GitHub default-branch flip to main** — operator action (AUDIT:10).
- **K-10 · Real-hardware FPS + live-render verification** — structurally
  operator-side; every in-container claim stays labeled.
- **K-11 · phase0-canon-diff.md stale rider-queue section** — factual doc
  correction, but it lives under the "canon is law" umbrella → proposed diff
  for operator approval rather than a silent edit.
- **K-12 · WIKJ v3 UNVERIFIED closure list** (§12) — research debt; verify
  what primary sources allow, keep honest labels on the rest.
- **K-13 · Vite 5 EOL constraint** — canon pin vs upstream support ended
  (2026 CVEs fixed only in 6.4+; dev-only exposure, ignores documented).
  Operator decision whether the pin ever moves; until then the ignore list
  is the policy.
