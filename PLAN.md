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
- **A2 The Earned Hunch** — provenance tagging, wicked rune, priority bump, calibration record;
  invariants unit-tested; e2e flow. (This entry is updated at phase close.)
- **A3 First Light** ⛔ gated on Gate-2 re-pass (operator plays before A3 opens — B-3).
- **A4 Confrontation + Funeral rite** ⛔ gated on Gate-2 re-pass.
- **A5 The Ego** ⛔ gated on A2–A4 complete.
