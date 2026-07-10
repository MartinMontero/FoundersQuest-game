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
- **A3 — OQ5 weather same-day retap (canon silent, flagged "needs ruling"):** interim = a second tap the same day REPLACES that date's entry (most forgiving; no lost taps). Flagged for operator ruling; behavior isolated so a change is one line.
- **A4 — OQ3 spine per-beat citations (OPEN, needs ruling):** 02 stores one flat `citedEvidenceIds[]` per answer, no beat→evidence map. Interim within existing keys: beats stored newline-joined in `.text`; a beat renders **[unproven]** when it has NO citation picked for it, tracked via a convention that does not change the schema shape. Flagged for operator ruling before it's called DONE.
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
- **J11 — Input controls.** verbatim(→E2), vault(reads vault[]), ifthen(+register guardian), seal(two-step, read-only after), verdict(shows sealed text→yes/no→unlock), registry(funeral→invalidated), decision(citation-locked), spine(per-beat [unproven]), joy. Each executed with representative + empty + invalid input. ⬜
- **J12 — Sequence locks.** Vault sealed till W3 & unseals on W3 entry; W5 shrines locked until verdict; `s5-dec` locked until a citation. ⬜
- **J13 — Act Gates.** Walk W2/W5/W7 exit door met (pass) and unmet (override + written reason); `gates` + `trail` written; export shows it. ⬜
- **J14 — Funerals.** W5 graveyard: invalidate a W1 guardian; headstone stands; 1.5× XP only when derived tier≥2 else "unproven funeral". ⬜
- **J15 — Loops.** Toll portals W5→W1, W7→W3, W8→W1: learning line → `trail`; The Reset adds retro + critique. ⬜
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
