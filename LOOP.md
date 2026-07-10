# LOOP — Full 8-World Spine (Phase 3)

Protocol: build→verify cycles to a Definition of Done with executed evidence. Operator directive
"build out the rest of the worlds" (2026-07-10) is the **Gate-2 fun-check go-ahead** (human touchpoint 2,
per `docs/build/phase0-restatement.md` §"Two human touchpoints") — the operator played the World-1
preview and ruled "build the spine."

## Scope

**Deliverable (one sentence):** every one of the 8 canon worlds is walkable and fully playable end to
end — the founder traverses World 1→8, kneels at every shrine and answers it with its canon input
control, raises every flagpole, meets the three Act Gates and the canonical sequence locks, and the
world reacts through the exact `founders-quest:v3` writes (no parallel state) — building on the existing
World-1 slice without regressing it.

**In scope (this loop):**
- Stage traversal (a `currentStage` journey concept; walk the onward path / Act-Gate doors between worlds; loop toll-portals back).
- All 8 world layouts (shrines per question, 3 flagpoles per milestone, campfire waypoint) + per-world visual identity (palette/sky/set-pieces), grey-box-or-better, reusing World 1's asset pipeline.
- Every remaining trance input control (§2.1): `verbatim`, `vault`, `ifthen`, `seal`, `verdict`, `registry`, `decision`, `spine`, `joy` — each writing exact 02 keys.
- Canonical sequence locks: Vault sealed till W3 (unseals on first W3 entry); W5 Mirror verdict-first; `s5-dec` locked until ≥1 citation. (Ariadne's Thread is warn-not-block, R4.)
- Set-piece mechanics: Vault unseal (W3), Ariadne's Thread seal (W4), Mirror verdict (W5), Funerals/Graveyard (W5), Act Gates after W2/W5/W7 (pass/override+reason → `gates` + `trail`), toll-portal Loops W5→W1 / W7→W3 / W8→W1 (learning line → `trail`), spine casting + launch (W8).
- Campfire furniture: weather totem (`weather[]`, literal sky), field-notes lectern (`fieldNotes`), side-quest board (`sideQuests`), exports/journal desk (`buildJournalMd`, read-only), Dinner **Card** editor (`dinnerCard`, the founder's own — R3).
- HUD reflects the current stage; keyboard-only; reduced-motion; persistence across reload.

**Explicit non-goals (other phases / D-scope — DO NOT build here):**
- Live **Council temple** (Phase 4): browser→api.anthropic.com BYOK. The verdict "invites the Council" — we light the spur/marker but the live convening is Phase 4 (needs a player key to verify).
- **Field Mode** (Phase 5, mobile / A-101).
- Audio (Phase 6); full per-world photoreal art beyond distinct grey-box+ identities (World 1 stays as-is).
- **D-scope (forbidden, stop-items):** D2 AI-rehearsal, D5 peer layer, Earned Hunch, i18n, **Dinner UI** (`dinnerSession`/`dinnerLog` stay schema-only, never serialized), sync endpoint.

## Assumptions (judgment calls; logged, not blocking)
- **A1 — currentStage is ephemeral game state, not canon data.** The v3 model has no player-position/current-world key; the world is a pure render of the data. `currentStage` lives in a device-local UI store (like the founder name), default World 1; the journey RECORD (answers/evidence/…) is the only persistence. Reload resumes at the persisted currentStage (own key) or World 1.
- **A2 — traversal.** All worlds walkable from minute one (01). Between adjacent worlds: an "onward" path portal at each world's far edge + the Act-Gate doors at act boundaries. A map (M) with fast-travel is a nice-to-have, added if cheap.
- **A3 — OQ5 weather same-day retap — RULED (R-W, 2026-07-10): APPEND.** Every tap is recorded to `weather[]`; a second same-day tap neither replaces the entry nor locks the totem. The trough keeps its canon last-3-by-date window (same-day taps each count — accepted tradeoff). Reverses the earlier "replace" interim. (The weather totem itself is a later cycle — this only fixes its spec.)
- **A4 — OQ3 spine per-beat citations — RULED (R-S, 2026-07-10): keep the flat interim.** 02 stores one flat `citedEvidenceIds[]` per answer; beats are newline-joined in `.text`, and every inked beat renders **[unproven]** until ≥1 citation exists (warn, never block). No schema change. A per-beat→evidence map is a clean, isolated later upgrade (a 02 diff for approval). The spine control is DONE under this ruling.
- **A5 — grey-box+ art.** Each world gets a distinct palette/sky/set-pieces reusing the World-1 pipeline; not 8 bespoke photoreal worlds (that's a later art pass). World 1 unchanged.

## Gates (must exit 0)
- `npm run typecheck` → 0
- `npm run lint` → 0
- `npx vitest run` → all pass (incl. parity/serializer/guards — no canon drift, no network in UI layer)
- `npx playwright test` → all pass (serial); automation tier unchanged where gated

## Journeys (numbered; each must be executed, not inspected)
- **J1 — World 1 regression.** Boot → W1 plays exactly as before (existing `stage1.spec` green). ✅ `npx playwright test e2e/stage1.spec.ts e2e/reduced-motion.spec.ts` → 3 passed (2.0m).
- **J2 — Traversal.** Walk W1→W2→…→W8 via onward paths; HUD banner tracks the world; back portal; reload resumes. ✅ `npx playwright test e2e/traversal.spec.ts` → 1 passed (1.7m): W1→8 onward, banner lands on each world; W8→W7 back; reload resumes W7; zero console/Anthropic. (Act-Gate doors replace onward portals at act boundaries in a later cycle.)
- **J3..J10 — Each world W1–W8 playable.** Every shrine kneelable; each answers with its canon input control writing exact 02 keys; all 3 flagpoles raise (Action only). ◐ shrines answerable in every world (unbuilt input tags fall back to prose; verified s8-l4 wrote `answers.s8` in traversal.spec). Designed controls (verbatim/vault/ifthen/seal/verdict/registry/decision/spine/joy) + per-world set-pieces are the next cycles. (W1 ✅ full.)
- **J11 — Input controls.** verbatim(→E2), vault(reads vault[]), ifthen(+register guardian), seal(two-step, read-only after), verdict(shows sealed text→yes/no→unlock), registry(funeral→invalidated), decision(citation-locked), spine(per-beat [unproven]), joy. Each executed with representative + empty + invalid input. ◐ All 9 built + wired to exact 02 keys; two new store actions (`sealThread`, `invalidateAssumption`). **Logic executed** in `tests/trance-controls.spec.ts` (24) + `tests/state.spec.ts` (8: seal/funeral incl. 1.5× XP + Truth). **Live DOM+store executed** in `e2e/controls.spec.ts` (World 5: verdict reads the s4-th seal → decision citation-lock holds then releases → funeral buries a W1 guardian; keyboard-only, zero-Anthropic). Adversarially reviewed (6 dimensions × verify): 2 confirmed defects fixed (ifthen focus-strand + guardian-dedup). Remaining for ✅: e2e for the W2–4/W8 controls (logic proven; navigation via new deterministic `tabToTarget`).
- **J12 — Sequence locks.** Vault sealed till W3 & unseals on W3 entry; W5 shrines locked until verdict; `s5-dec` locked until a citation. ✅ Vault unseal via a UiRoot effect on reach/resume-into-W3+ (`unlockVault`); verdict-first lock in `TrancePanel` (non-verdict Mirror shrines render a sealed notice, no control/Inscribe, until `s5-th` records yes/no); `s5-dec` citation lock from J11. Executed: `e2e/controls.spec.ts` asserts `vaultUnlocked` flips on resume-into-W5 and `s5-dec` shows the verdict-lock until ruled.
- **J13 — Act Gates.** Walk W2/W5/W7 exit door met (pass) and unmet (override + written reason); `gates` + `trail` written; export shows it. ✅ `GatePanel` (met→clean pass, unmet→written override, Esc/"Not yet"→back out); `onPortal` opens it once per act boundary. Executed: `e2e/gate.spec.ts` → 2 passed (met-pass records `gate-pass`; unmet backs out with no record, then overrides → `gates.act1=overridden` + `gate-override` in `trail`); `traversal.spec` crosses all three gates. (Export badge = J16.)
- **J14 — Funerals.** W5 graveyard: invalidate a W1 guardian; headstone stands; 1.5× XP only when derived tier≥2 else "unproven funeral". ✅ `FuneralInput` (s5-l5) + `invalidateAssumption`; proven/unproven labelled from `tierOf≥2`; 1.5× (15 XP) derived by metrics. Executed: `tests/state.spec.ts` (proven→15 XP + Truth moves; unproven→0) + `e2e/controls.spec.ts` (buries a W1 guardian live). (Graveyard headstone visuals = a later visual pass.)
- **J15 — Loops.** Toll portals W5→W1, W7→W3, W8→W1: learning line → `trail`; The Reset adds retro + critique. ◐ All three loop toll-portals built (`loopPortalsForStage` from `NAMED_LOOPS`); `LoopPanel` demands one learning line → `trail` (type `loop`) + `lastLoop`; "Stay"/Esc backs out. Executed: `e2e/loop.spec.ts` (Reality Check W5→W1 records the learning line; "Stay" backs out). **Deferred:** The Reset's extra cycle-retro + undefended Critique the Quest (a polish add on the existing `trail.critique` field).
- **J16 — Campfire furniture.** Weather totem sets sky; field notes save; side-quest accept/complete; exports download real journal md; Dinner Card edits → leads the Brief. ⬜
- **J17 — Launch (W8).** Spine cast → rocket engraves; raise final flag → launch sequence; world continues (Reset remains). ⬜
- **J18 — Cross-cutting.** Keyboard-only full traversal; reduced-motion honored; zero console errors; zero api.anthropic.com calls anywhere in the spine. ⬜

## Quality criteria (§3, made checkable for this artifact)
- Zero errors across all gates; zero console/stderr on every tested route.
- Every shrine's input control has designed empty/invalid behavior (warn-not-block per 01; structural validation per law 7), not just "no crash".
- No TODO/placeholder/stub/dead code in shipped paths; naming/structure consistent with existing `src/game`, `src/ui`, `src/strings`.
- Every question renders verbatim from `src/strings` (parity test green); no string literals in components.
- Fresh-eyes final pass: re-walk W1→W8 as a first-time player; anything demo-embarrassing is a defect.

## Progress log (evidence: command → salient output)
- **Cycle 4 — per-world visual identity: sky/fog/background + shrine accent (2026-07-10).** Each of the
  8 worlds now wears its own sky so it reads as its own place (A5), reusing the World-1 SkyDome+fog
  pipeline — NOT 8 bespoke scenes. New `src/game/worldPalette.ts`: `WORLD_SKIES` (zenith/horizon/glow/
  aurora/fog/background/accent) with 8 moods (2 Raven cold corvid dusk · 3 Phoenix forge ember · 4
  Labyrinth cold stone-teal · 5 Mirror pale silver · 6 Sculptor warm clay · 7 Bridge hopeful dawn · 8
  Rocket bright launch). **World 1 pinned to the exact PALETTE values (sky + accent = teal) → byte-
  unchanged.** `Nebula`/`SkyDome` keyed by stage swap the sky cleanly on travel; `World` background+fog
  track the world; an unanswered shrine glows its world's `accent` (answered stays gold — "inked" reads
  the same everywhere). **Verified**: `typecheck`/`lint` 0 · `vitest` 329 · e2e `boot` + `render-tiers`
  (full/constrained/auto) + `controls` (W5's new sky) → **6 passed**, zero console errors, W1 regression
  intact. **Deferred (a per-world art pass, best with eyeball feedback — A5 "not 8 bespoke"):** the
  bespoke central set-pieces (Raven fellowship circle, forge pyre, Labyrinth maze, Mirror causeway,
  graveyard, Bridge span, launch gantry). Sky+accent is the reliable identity core; set-pieces layer on.
- **Cycle 3 — sequence locks: Vault unseal · verdict-first · Act Gates · loop toll-portals (2026-07-10).**
  The canon rules of WHEN/IN WHAT ORDER the controls may be used, on top of the 9 shrines.
  - **3a foundation** (`core/metrics.ts` + `state/store.ts`): `gateMet(act1|2|3)` (derived Act-Gate
    bars), `verdictRecorded`; four immutable/persist-first store actions — `unlockVault` (idempotent),
    `passGate`/`overrideGate` (→ `gates` + `trail`), `recordLoop` (→ `trail` + `lastLoop`).
  - **3b locks**: Vault unseals via a `UiRoot` effect on first reach / resume-into-W3+; the Mirror
    verdict-first lock in `TrancePanel` (sealed notice, no control/Inscribe until `s5-th` rules).
    New `ui` modes `gate`|`loop` + payloads (freeze the world for free via `mode !== 'roam'`).
  - **3c Act Gates**: `GatePanel` (criteria + derived met/unmet; met→pass, unmet→written override,
    "Not yet"→back out with no record); `events.onPortal` opens it once per act boundary before travel.
  - **3d loop toll-portals**: a `'loop'` portalDir + `LOOP_POSITION` + `loopPortalsForStage` from
    `NAMED_LOOPS` (W5→W1, W7→W3, W8→W1); colliders auto-apply; KEEPOUT updated; chip/arch read the
    loop's name; `LoopPanel` takes the learning line. Reset's retro+critique deferred (J15 ◐).
  - **Verified**: `typecheck`/`lint` 0 · `vitest` **329** (metrics +4 gate/verdict, state +5 actions).
    e2e serial (deterministic id nav via `tabToTarget`, retiring the FPS-flaky `tabToChip`):
    `gate.spec` 2 passed (met-pass · back-out+override), `loop.spec` 1 (Reality Check + Stay),
    `controls.spec` 1 (adds vault-unseal + verdict-lock asserts), `traversal.spec` 1 (crosses all
    three Act Gates). One failure found + fixed en route was a TEST bug (reading `.gates.act1` before
    any persist — optional-chained), not product. Zero console/Anthropic on every route.
- **Cycle 2 — the 9 per-world trance controls (2026-07-10).** Every shrine in Worlds 2–8 now
  answers with its canon mechanism, each writing the EXACT 02 Answer keys (J11). New components
  in `src/ui/inputs/`: `VerbatimInput` (5 quotes → `text`; per-quote "Log as E2" → `addEvidence`),
  `VaultPickInput` (pick a captured idea → `text`; free-text fallback if the Vault is empty),
  `IfThenInput` (`ifPart`/`thenPart`/`withinDays`; "Register the IF as a guardian"), `SealInput`
  (Ariadne's Thread — self-committing two-step confirm → `text`+`sealedAt`, read-only after),
  `VerdictInput` (reads the s4-th seal → `verdict`), `FuneralInput` (self-committing; invalidates a
  W1 guardian → 1.5× honors), `DecisionInput` (`decision`+`citedEvidenceIds`, **locked until ≥1
  citation**), `SpineInput` (5 beats → `text`+`citedEvidenceIds`; uncited beat renders `[unproven]`),
  `JoyInput` (`text`). Wired through `TrancePanel.tsx` (extended `TranceDraft` union + `initialDraft`/
  `answerFields`/`isComplete`/`draftToText` + a `ControlContext` threading store data & side effects;
  self-commit tags hide the generic Inscribe). Two new store actions (`store.ts`): `sealThread`
  (store-clock `sealedAt`) and `invalidateAssumption` (idempotent, immutable). Strings in `ui.ts`
  (9 authored groups, zero literals in components — parity still green). Dev-only `window.__fq_target`
  mirror (`interaction.ts`, stripped from prod) so e2e navigates to an EXACT shrine, immune to the
  drei `<Html>` focus-chip lag (new `tabToTarget` helper).
  - **Gates:** `typecheck` 0 · `lint` 0 · `vitest` **320 passed** (+32: 24 control round-trips proving
    exact-key fidelity + the citation lock + spine warn-not-block; 8 store-action incl. the funeral's
    1.5× XP / Truth math). `e2e/controls.spec.ts` → **1 passed (14.5s)**: World 5 verdict reads the
    sealed thread → decision citation-lock holds then releases → funeral buries a W1 guardian
    (keyboard-only, zero console/Anthropic).
  - **Adversarially reviewed** (Workflow: 6 dimensions × verify — canon-fidelity, correctness-edge,
    store-integrity, warn-not-block, no-literals/a11y, self-commit). 2 confirmed defects, both fixed:
    (1) ifthen register stranded keyboard focus on `<body>` (no `focusAfterCommit`) → added focus
    restoration to the WITHIN field; (2) editing the IF after registering could mint a duplicate
    guardian (inflating Truth's denominator) → dedup guard (`ctx.hasGuardian`) + `registered` retracts
    on IF edit. Canon-fidelity / store-integrity / warn-not-block dimensions found nothing.
  - **OQ3 (spine per-beat citations) — RULED (R-S, 2026-07-10): keep the flat interim.** Beats stored
    newline-joined in `.text`; `[unproven]` renders spine-wide while `citedEvidenceIds` is empty (the flat
    02 schema has no per-beat map). Warn-never-block: an uncited spine still inscribes. The spine control
    is DONE under this ruling; a per-beat map stays a later, isolated upgrade (a 02 diff for approval).
  - **OQ5 (weather same-day retap) — RULED (R-W, 2026-07-10): APPEND** every tap (reverses the "replace"
    interim). No code yet — the weather totem is a later cycle; the ruling only fixes its spec.
- **Cycle 1e — crash resilience (2026-07-10).** Operator hit "the world failed to hold together": `Could not load /models/rogue.glb: The operation was aborted` on a weak device (Radeon HD 3200 / Firefox, constrained tier) — a single aborted 3.6 MB model download collapsed the whole world into the app error boundary. Fix: new `AssetBoundary` (render-error boundary) + `<Suspense>` around every heavy network asset so a failed/aborted load DEGRADES instead of crashing: character → capsule (`Player.tsx`), shrine pillar → primitive (`models.tsx`), HDR/trees → dropped (`World.tsx`), ground textures → vertex-coloured disk (`props.tsx`). **Verified directly**: routing `**/models/rogue.glb` to `abort()` → app-crashed boundary NOT shown, canvas + HUD render with the capsule stand-in (screenshot `abort-fallback.png`). `typecheck`/`lint` 0 · `vitest` 288 · e2e boot + render-tiers + context-loss + traversal green (stage1 flaky→passes, known jitter). **Follow-up noted:** draco/meshopt-compress rogue.glb (3.6 MB) to shrink the download and cut abort odds on slow links.
- **Cycle 1d — gate collision + staff grasp (2026-07-10).** Operator eyeball: gates accessible + working; two fixes:
  1. **Gate walked-through.** `WorldColliders.tsx`: added solid colliders per portal — two `CylinderCollider` columns (x±1.15, same mechanism proven at shrines) + a low `CuboidCollider` base. The base footprint (x±1.8) doesn't block the normal approach (the founder reaches within the 2.75 u interact radius from the front/side, so the travel prompt still lights); head-on walking is now blocked. Off the automation tier like the ornate gate + other colliders.
  2. **Staff not grasped** (sat beside the hand — the base-pivot lean had offset the shaft off the grip). `RogueCharacter.tsx`: the staff group ORIGIN is now the hand's world position (`position.copy(HAND_WORLD)`), so the shaft passes THROUGH the grip like the blade; geometry recentred to extend below the grip to the ground and above to the crown; the hood-clearing lean now pivots at the grip. Screenshot-verified (front + right side): shaft runs through the right hand, crystal above the head, foot near the ground.
  - `typecheck`/`lint` 0 · `vitest` 288 · e2e traversal + stage1 green.
- **Cycle 1c — gate reachability fix (2026-07-10).** Operator eyeball: forward-facing + rock collision confirmed fixed; but the **back gate was off the map** — `BACK_POSITION` was `[-19,18]` = radius 26.2, beyond the plateau (r24) and rim wall (r23.5), so unreachable. Moved both portals comfortably inside the rim: onward `[0,0,-18]` (r18), back `[-8,0,16]` (r17.9); added both fixed portal spots to the props/trees KEEPOUT so scattered rocks (now all solid) can't block the approach. Verified by DRIVING the founder on foot to each: onward chip at (2,−16.7)→E→World 2; back chip at (−6.1,18)→E→World 1. `typecheck`/`lint` 0 · `vitest` 288 · e2e traversal+stage1+reduced-motion green.
- **Cycle 1b — operator live-feedback fixes (2026-07-10).** After eyeballing live traversal:
  1. **Character faced the camera while walking forward** (moonwalk). `Player.tsx`: the heading was `atan2(vx,vz)` — 180° wrong given the model's baseline −Z flip; now `atan2(−vx,−vz)`. Verified via screenshot (founder shows its back walking into the terrain).
  2. **Gates too plain + unnamed.** `Interactables.tsx` `PortalArch` rebuilt: stepped base, fluted columns with brazier gems, half-torus arch + keystone gem, layered shimmering veil, drifting runes, and an Html **carved sign naming the destination world** ("ONWARD / The Raven"). Verified via screenshot. Gated to a minimal box on the automation tier (the ornate chrome would drop CI fps and re-trip the self-play timing — same gating as trees/props).
  3. **Small rocks were walk-through.** `WorldColliders.tsx`: collide EVERY rock (threshold 0), snug radius — same collider mechanism proven by the shrine-stop test.
  - `typecheck` 0 · `lint` 0 · `vitest` **288** · `traversal` + `reduced-motion` + `render-tiers` green; `stage1` flaky→passes on retry (pre-existing registry-reopen jitter, retry-absorbed; automation gate is lighter than before so not a new regression).
- **Cycle 1 — foundation (traversal + stage-parameterized world).** New `src/state/journey.ts` (currentStage, own key). `contracts.ts` generalized: `layoutForStage`, `ALL_SPECS_BY_ID`, `milestonesForStage`, `portal` kind + onward/back portals; W1 layout unchanged + onward portal. `interaction.ts`/`Player.tsx`/`Interactables.tsx`/`Hud.tsx`/`WorldColliders.tsx` now render/track the current world; `events.ts`+`controls.ts` dispatch portals; `PortalArch` grey-box; portal chip copy in `world.ts`.
  - `npm run typecheck` → 0 · `npm run lint` → 0 · `npx vitest run` → **288 passed**.
  - `stage1.spec` + `reduced-motion.spec` → **3 passed** (W1 regression intact).
  - `traversal.spec` (NEW) → **1 passed** (W1→8→back, answers.s8 written, reload resumes).
  - Diagnosed + dismissed a false alarm: at low constrained-tier FPS the drei `<Html>` focus chip lags `focusedId` by one tab; an ad-hoc 220 ms-per-tab probe mis-timed E. Not a product bug (imperceptible at 60 fps; the 600 ms `tabToChip` helper is aligned) — verified via the proper automation-tier spec.
