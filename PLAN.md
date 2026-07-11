# PLAN — Phase 2: Grey-box Stage 1 slice (2026-07-08)

Phase 1 core is green (VERIFICATION round 1; CI run 4). This phase builds the playable Swirling Nebula slice and ends at **Gate 2 — the operator's fun-check** (human touchpoint 2). The bar: the work feels heavier than a form, not lighter. Spec source: `docs/build/game-design.md` (§1 World 1, §2 trance + inputs, §3 controls/camera, §4 mechanic→write map).

## Ordered work

1. **Deps (deps-review at report):** three + @react-three/fiber@^8 (React-18 line) + drei@^9 + @react-three/rapier@^1 + zustand + tailwindcss@3.4 (+postcss, autoprefixer) + lucide-react. Lockfile rescanned (osv offline local, online CI).
2. **State binding (`src/state/`):** zustand wrapping `loadQuestData`/`saveQuestData` — actions are thin writers over core; `founders-quest:v3` stays the ONLY state of record (no parallel state; every action round-trips through core save).
3. **World (`src/game/`):** canvas + Swirling Nebula grey-box terrain, third-person keyboard controller (WASD/arrows + E, no mouse required), camera rig, interactable system (ground-ring on walk-up AND on Tab focus — a11y parity), `prefers-reduced-motion` variants (crossfade not dolly, no shake, static particles).
4. **HUD (`src/ui/`):** Truth leads / Action follows, tier coin tallies, stage banner — reads metrics only.
5. **Shrine trance:** world freeze → camera push-in → focused writing panel (canon copy from `src/strings`; Enter=newline, Ctrl+Enter=inscribe, Esc=stand up draft-kept; no `<form>`). Target all 8 Stage-1 shrines; **floor: ≥3 incl. `s1-l2` (fivewhys ×5 chained to visible root) and `s1-fp` (quickadd + inline "This only works if ___" → guardian)**. Every answer writes exact `answers['s1'][qid]` fields per 02; milestones flagpoles for Stage 1's three (Action only).
6. **Vault:** sealed monument, visible count; solution-language nudge (03's trigger words), two-tap capture, zero justification (law 10) — answer saves unchanged regardless.
7. **Registry in-world:** guardian figures scaled by importance weight, tinted by derived tier, riskiest highlighted (metrics.riskiest); panel: create (incl. via s1-fp inline), link evidence, view; resolve lands Phase 3 (funerals are Phase 3).
8. **Stubbed Shadow:** derived divergence check with R-F tunable constants (`SHADOW_DIVERGENCE_PP = 40`, `SHADOW_MIN_ASSUMPTIONS = 3`, never in trough — constants file, no canon numbers); quotes only the founder's own local text; pairs exactly one low-friction action; dismissable; zero network (guard-tested already).
9. **e2e self-play (`e2e/stage1.spec.ts`):** full slice keyboard-only — boot → onboard → walk to shrine → answer story/names/fivewhys/number/list/falsify → s1-fp quickadd→guardian appears in registry → vault nudge + capture → flagpole raise → HUD moves (Action yes, Truth only via linked E2+) → reload persistence. Screenshots at each beat. Reduced-motion spec. Storage-degraded banner spec.
10. **Preview pipeline (Option B, ruled):** once — `npx wrangler pages project create founders-quest-game --production-branch=main`; then build + `npx wrangler pages deploy dist --branch=claude/dev-environment-setup-tsp3tv`; `curl -I` the preview → CSP + security headers verified live (06 §5). Post the URL.
11. **VERIFICATION round 2** + Gate 2 report (screenshots, preview URL, Operator Verification Queue, deps table). **STOP for the fun-check verdict; while awaiting: framework-free core work only.**

## Acceptance criteria

- All e2e specs green locally AND in CI (stubs only; zero Anthropic calls in the slice).
- Every inscribed answer asserted to land in exact 02 keys; toggling milestones moves Action never Truth (already unit-locked; now asserted end-to-end).
- Keyboard-only full slice; visible focus everywhere; reduced-motion honored.
- Grey-box frame rate measured and recorded honestly with hardware context (headless container ≠ player hardware; noted as such).
- Preview URL live; CSP `connect-src 'self' https://api.anthropic.com` verified on the deployed response headers.
- Zero console errors in any e2e run; async triad (loading/error/empty) on every async surface in scope (storage probe, deploy-time asset load).
- gitleaks + osv clean (per osv-scanner.toml documented ignores).

## Non-goals (Phase 2)

Stages 2–8, gates, loops, side quests, weather totem, funerals (Phase 3) · Council temple/UI (Phase 4; transport stays unit-tested only) · Field Mode, PWA, QR (Phase 5) · exports UI, audio, onboarding polish (Phase 6) · non-grey-box assets (allowed: Kenney prototype textures if trivially embeddable; nothing on the critical path).

---

# Program Addendum A — "Mind & Myth" (merged 2026-07-11)

The operator's addendum prompt (uploads/ccpromptfqgamemindmythintegration.md) merges here
alongside the phase program. Gate 0 ran 2026-07-11: recon in AUDIT.md, consolidated canon diff
in docs/build/mindmyth-canon-diff.md (RATIFIED, all defaults), blockers in BLOCKERS.md.

- **A0 Gate 0** ✅ — three artifacts produced; operator ratified all D-blocks at defaults;
  research files landed on main and merged; art law = docs/build/art-direction.md.
- **A1 docs landing** ✅ — WIKJ v3 assembled at docs/epistemology/ (8 edits by intent, deviations
  logged); canon commit applied (schema delta, council sentence swap, 5 riders, keybind
  reservation, glossary). Council provenance-block: BLOCKERS B-4 (severable, awaiting source).
- **A2 The Earned Hunch** ✅ CLOSED (2026-07-11) — provenance tagging, wicked rune, priority
  bump, calibration record; 15 invariant tests + full e2e flow; two consecutive clean full runs
  (vitest 351 ×2 · e2e 23 ×2 · scanners clean). 05 moved Queued→Shipped.
- **A3 First Light** — UNBLOCKED by the 2026-07-11 operator directive (one consolidated
  end-of-build playthrough; BLOCKERS B-3 superseded-entry). Shipped: D-G carve-out in metrics
  (denominator exclusion + fixed XP), opening store actions, the Cartographer's Chart (M) +
  Legend (L) panels + HUD affordances, the 11-beat induction (real artifacts: vault capture,
  D-I firstLight guardian + sealed kill criterion, verbatim E2 quote, the real first kill),
  courtesy skip + one-time re-entry prompt + campfire replay, accessibility (no timed reading,
  instant-complete typewriter, reduced-motion, ARIA live region). e2e: full induction + skip
  path. Feel pack: docs/feel-packs/a3/ (FEEL_PACK=1 run).
- **A4 Confrontation + Funeral rite** — BUILT (2026-07-11); in two-clean-run close. All 8 plan
  steps landed in the law's order (core → store → citation UI → finisher → rite → wrapper LAST
  → world → e2e/feel). 39 unit invariants + 4 slice e2e green first run; feel pack a4 archived.
- **A5 The Ego** — IN BUILD (opened 2026-07-11, A2–A4 gate met).

## A5 build plan (addendum §8; egoRecord derived, NEVER stored — D-B)

1. **Pure core** `src/core/ego.ts` — the Ego assembled at runtime from the real record:
   shields = overridden gates (each carries its logged reason verbatim; absorb one landed
   cite each) · ghosts = skipped-unheld funerals (+2 HP each; a delayed funeral removes the
   weapon — mechanic already live) · HP = 6 + 2×Σ weight(untested|testing, non-firstLight)
   · founderEdge = count of E2+-resolved assumptions (per-cite damage bonus, capped +2) ·
   heavy-attack strength = live Action−Truth divergence. **The outranking invariant ships
   as a PROPERTY TEST across seeded-random states: capture+resolve@E2+ is never worse than
   not capturing, on every axis the formula has (hp ≤, edge ≥, damage ≥, shields/ghosts =).
   The formula is tuned to the test, never the reverse.**
2. **Phase ladder** (deterministic, session-state only — no canon key exists for fight
   progress, so a re-entry re-forms the Ego, thematically honest): denial (only E3/E4
   land; hp full→2/3) → rationalization (only evidence linked to a SEALED-criterion
   guardian lands; →1/3) → projection (no damage: the founder's own untested assumptions
   thrown back; "return as test" flips untested→testing — a real write; ≤3 in the slice)
   → sunk-cost (chains; cut by E2+ linked to an invalidated guardian OR any E4; →0) →
   identity-fusion (**cannot be won by damage**: the integration — one deliberate typed
   line, written to the wisdomCodex with sourceGuardianId 'ego' — the capstone unlock
   derives from that entry; NO new schema key, canon shapes untouched).
3. **Capstone** "Cartographer's Distance": once integrated (derived from the codex), the
   HUD shows the live Truth-vs-Action divergence readout permanently.
4. **Store actions** — markTesting (projection's return-as-test), integrateEgo (write-once
   codex line). Zero API anywhere (D-E: all dialogue pre-written).
5. **Surfaces** — src/strings/ego.ts (phase lines, per-mechanic feedback, integration
   exchange, trough-delay line) · EgoOverlay over the live world (phase banner, shields
   with verbatim reasons, ghosts named, Ledger reuse, fusion finale) · W8 'ego' gate
   set-piece (the pad's threshold; spawn-clear position) · D-F: in the trough the gate
   opens to the pre-written DELAY offer, never the fight, never a block.
6. **Close** — e2e (full five-phase fight on a seeded rich record; trough delay; leave-
   without-penalty; capstone persistence across reload), feel pack a5, two clean runs,
   SHIP/VERIFICATION, deploy. Then the consolidated SITREP for the operator's playthrough.

## A4 build plan (order is law — addendum §7)

1. **Pure core** `src/core/confrontation.ts` — argument state derived, never stored:
   `argumentStateFrom(importance, citedTiers)` replays the confrontation's citations[]
   (order-preserving) so a reload restores the exact argument-HP; live composure/poise is
   session state. Numbers (code constants, R-F style): HP dies 12 / wobbles 8 / shrugs 5;
   composure shield 4 / 2 / 1; damage E0/E1 **0 (bounce — state returned unchanged,
   reference-equal)**, E2 = 2 (soaks composure first), E3 = 4, E4 = 6 + shatters the whole
   shield with overflow to core. `hp === 0` = the argument is SPENT — it never resolves the
   guardian (B3 no-inverse-HP: only the verdict does). Finisher predicate is pure and
   deterministic: outcome recorded && not yet resolved (never RNG). Funeral queue derived:
   invalidated + non-firstLight + no funerals[] record; the rite offer further gates on
   !trough (queues, never in the trough). Invariant tests per item.
2. **Store actions** — `startConfrontation` (idempotent; untested→testing),
   `citeInConfrontation` (real Ledger ids only — synthetic ammunition impossible; E0/E1
   writes NOTHING (bounce = pure feedback); E2+ appends to citations[] once and links the
   evidence to the guardian), `recordConfrontationVerdict` (verdict before interpretation;
   write-once), `resolveConfrontation` (finisher: stamps resolvedAt, flips guardian status,
   resolves calibration held/broke at derived tier≥2; XP stays derived by metrics — 1.5×
   already lives there), `holdFuneral` (heldAt + epitaph; wisdom line → codex; laying a
   skipped ghost to rest KEEPS skippedAt honestly), `skipFuneral` (write-once skippedAt).
3. **Citation UI** `src/ui/ConfrontationOverlay.tsx` over the live world (no modal-over-
   darkness): guardian statement + HP/composure readout, the real Ledger list (cited coins
   spend once), bounce line teaches "this can't move Truth" — nothing more.
4. **Finisher** — the sealed kill criterion renders as the golden thread; recording the
   real-world verdict ignites it; the strike stays persistently available until used.
   Both outcomes authored equal: shatter + funeral vs standing-pillar transformation (D-D).
5. **Funeral rite** `src/ui/FuneralRiteOverlay.tsx` — Vigil (named plainly) → Eulogy (the
   REAL evidence, verbatim from the Ledger) → Committal (one deliberate input; tombstone;
   wisdom line) → XP. Skip = single warning + logged; ghost is narrative-only; delayed
   funeral lays it to rest. Trough queues the rite (HUD ember chip offers it later).
6. **Action wrapper LAST** — press/window rhythm: Space-strikes chip poise and open the
   citation window EARLY; an idle timer opens it regardless (D-C invariant e2e: cite with
   zero successful strikes). Reduced-motion: no shake, static cues. Citation and the
   finisher are never skill-locked.
7. **World** — arena circle set-piece in W1 at [16, 0, 6] (clear of shrines/rim); the
   manifested guardian reuses the Registry's cel-shaded menhir language scaled by
   importance (visible primitives stay banned); tombstones + ghost markers by the arena
   from funerals[]. New interactable kind 'arena' + onArenaEnter event.
8. **Close** — slice e2e (invalidation branch incl. rite + skip/lay-to-rest; validation
   branch incl. pillar), feel pack a4 (a rite over a void fails the phase), two clean full
   runs, SHIP/VERIFICATION, deploy.
