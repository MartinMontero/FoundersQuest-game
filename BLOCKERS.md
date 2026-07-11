# BLOCKERS — Program Addendum A "Mind & Myth" · Gate 0 (2026-07-11)

Per Addendum §10, these halt the program at Gate 0. No inference fills a gap.

## B-4 · Council provenance-reading block: no verbatim source (OPEN — severable)
The A0-2 diff's 04/council.ts change has two halves. The REPLACE sentence was fully specified
and is APPLIED (A1 canon commit, parity green). The APPEND block ("the provenance-reading
block") has no verbatim text anywhere on hand: `wikj-v3-content-package.md` grounds the content
(§3.3 blocks 1, 5, 6) but contains no Council-prompt text, and `cc-prompt-earned-hunch.md` is
not in the repo. Authoring Council canon from a summary = inference filling a gap — declined.
**Severable:** nothing in A2 depends on it (the Council convenes in Phase 4; BYOK program adds
no API surface). **Needed:** operator uploads `cc-prompt-earned-hunch.md` (or the block text),
or approves a draft I post on request. Until then 04's queued-addenda entry records the split.

## B-1 · Six required research inputs MISSING (STOP condition, Addendum §1)
None of the required files exist in `docs/research/` (verified byte-level 2026-07-11; uploads
dir holds only the prompt itself):
1. `antagonist-combat-architecture.md`
2. `antagonist-combat-architecture-audit.md`
3. `first-light-opening-orientation.md`
4. `first-light-opening-orientation-audit.md`
5. `wikj-v2.md`  ← Phase A1's assembly base — A1 cannot start without it
6. `wikj-v3-content-package.md`  ← holds the 8 str_replace edits + §3.1–§3.4 + the Council block

**Needed:** operator uploads all six to `docs/research/` (or provides them for me to commit).

## B-2 · Phase 2b art-direction / world-feel addendum not in `docs/build/` (Addendum §1)
The addendum requires it as law for the A3/A4 feel checkpoints; "no such file committed" is a
named BLOCKER. Candidate on hand: `docs/research/premium-ui-direction.md` (the premium-UI
research the Phase 2b reskin was built from). **Needed:** operator ruling — (a) that file IS the
art addendum (I move/anchor it under `docs/build/` as such), or (b) the real addendum still
needs to land.

## B-3 · Gate-2 re-pass status: go-ahead recorded, formal PASS not (Addendum A0-1)
LOOP.md records the operator's 2026-07-10 "build out the rest of the worlds" as the Gate-2
fun-check go-ahead after the Phase 2b reskin eyeballs. No entry says "Gate 2 re-pass: PASSED"
in those words. Until confirmed, **A3–A5 are hard-blocked** (A1–A2 are not — A2 is explicitly
"may run before Gate-2 re-pass"). **Needed:** one-word confirmation (or the operator's full-game
QA playthrough per SITREP.md serves as the re-judgment).

## Resolution log
- **2026-07-11 · B-1 RESOLVED.** Operator landed all six research files on `main` (`6b64fed`);
  merged into the working branch; byte-nonempty verified (32.4K/23.6K/39.7K/26.0K/44.2K/37.8K).
- **2026-07-11 · B-2 RESOLVED.** Operator ruling: `premium-ui-direction.md` is NOT the addendum.
  The binding art document is `docs/build/art-direction.md` (landed on `main` @ `3d544f6`,
  merged) — law for all feel checkpoints.
- **2026-07-11 · B-3 PARTIALLY RESOLVED.** Gate-2 re-pass: PENDING — operator will play before
  A3 opens. **A3–A5 remain hard-blocked**; A1–A2 authorized and proceeding.
- **2026-07-11 (later) · B-3 SUPERSEDED — A3–A5 UNBLOCKED by operator directive.** Operator
  (verbatim): "follow the master prompt and the loop until you build out the full game … I will
  do the eye ball then by playing the whole game myself and then make my full human QA report …
  Unless there is a massive problem or conflict or danger, keep going." The per-phase play
  gates (Gate-2 re-pass before A3; operator-plays-between-phases, addendum §9) are consolidated
  by the operator into ONE end-of-build playthrough. Feel-checkpoint screenshot packs are still
  produced and archived per phase against docs/build/art-direction.md; the human verdict lands
  once, at the end, via the consolidated SITREP + QA report.
- **2026-07-11 · D-blocks.** All defaults ratified, no exceptions (operator, verbatim: "all
  defaults ratified").

---

# Backlog run parks (2026-07-11) — operator-facing decisions, zero silent drops

- **K-1 · Reset-loop retro + undefended-critique prompts.** Canon question text
  does NOT exist in 03 (only the header parenthetical, 03:95). Wiring = authoring
  canon by inference → STOP honored. NEEDS: verbatim prompts from the operator,
  or approval of a drafted 03 diff.
- **K-2 · B-4 Council provenance block** — standing; needs cc-prompt-earned-hunch.md
  or approval of a posted draft.
- **K-3 · i18n 40 locales** (05:13) — D-scope STOP per CLAUDE.md; prereq repo
  unreachable.
- **K-4 · 05:17 "next after" features** (Mentor/Shadow AI · Interview Debrief ·
  Story Forge · pre-mortem ritual · Five-Whys chain · onboarding tour · cookbook ·
  dinner shared-board · self-hosting recipe) — each needs its operator prompt/ruling
  before build; several touch D-scope or new canon content.
- **K-5 · Whiplash ritual** — source-blocked (R-K; game-design:193,277).
- **K-6 · OQ4 id-constants cross-check** — blocked on the v3 source upload.
- **K-7 · Session-draft retention (F3) wording** — needs the one-line ruling
  (VERIFICATION Round 2).
- **K-8 · Per-beat spine→evidence map** — deferred by ruling (05:22); requires the
  drafted 02 diff approval to take.
- **K-9 · GitHub default-branch flip to main** — operator console action.
- **K-10 · Real-hardware FPS + live-render eyes-on** — structurally operator-side;
  in-container claims stay labeled UNTESTED.
- **K-11 · phase0-canon-diff.md stale rider-queue section** — all 5 riders are
  applied in canon (02:36,43,81 · 05:13,21) but the doc still reads "Queued… not
  yet posted". PROPOSED DIFF (needs approval, canon-umbrella file): replace that
  section's status line with "All 5 riders applied to canon 2026-07-08–11; see
  02/05." No other change.
- **K-12 · WIKJ v3 §12 UNVERIFIED closure list** — research debt; will verify what
  primary sources allow during this run; the rest keeps honest labels.
- **K-13 · Vite 5 EOL** — upstream support ended (2026 dev-server CVEs fixed in
  6.4+ only; dev-only exposure). Canon pins Vite 5; the documented osv ignore list
  is the standing policy. Operator owns any future pin change.
- **F-8 deps-review table (R-H, pre-ruled):** QR encoder/decoder to be vendored
  per the recorded R-H ruling; exact name/version/license verified online and
  listed here before the files land. Candidates: nayuki qrcodegen (MIT, single
  file) for encode; decoder pick pending license verification (jsQR is
  Apache-2.0, NOT MIT — R-H says MIT; qr-scanner (MIT) bundles a jsQR fork —
  license lineage must be verified before vendoring). If no clean MIT decoder
  verifies, fallback = BarcodeDetector + file/paste only, logged here.
