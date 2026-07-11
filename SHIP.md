# SHIP — Program Addendum A "Mind & Myth"

Per-phase summary: what shipped, invariants proven, canon commits, deviations (plainly).
Verification detail lives in VERIFICATION.md; blockers in BLOCKERS.md.

## A0 · Gate 0 (2026-07-11) — CLOSED
**Shipped:** recon (AUDIT.md), consolidated canon diff (docs/build/mindmyth-canon-diff.md),
decision blocks presented verbatim. **Operator:** all D-blocks ratified at defaults; research
files landed on main (6b64fed) + art law `docs/build/art-direction.md` (3d544f6); Gate-2
re-pass PENDING (operator plays before A3) → A3–A5 hard-blocked.
**Deviations:** none.

## A1 · Docs landing (2026-07-11) — CLOSED
**Shipped:** `docs/epistemology/wisdom-intuition-knowledge-judgment-v3.md` (commit 15bf502) —
v2 base + the content package's edits, §4.4 replaced, four new sections, both correction logs,
every UNVERIFIED label preserved. Canon commit 3a183a3 — schema delta (02 + schema.ts with
per-field hydration guards), 04+council.ts sentence swap (parity green), 05 rulings + all five
riders, M/L keybind reservation, D-B glossary.
**Deviations (plainly):** (1) the package's str_replace FIND anchors were written against a
compacted v2 variant — 1 matched exactly, 1 was a no-op (base already correct; blind
application would have duplicated author names), 6 applied by unambiguous intent; every
deviation itemized in commit 15bf502. (2) The Council provenance-block has no verbatim source
anywhere on hand — the REPLACE half is applied, the APPEND half stays queued (BLOCKERS B-4,
severable; not authored by inference). (3) HUD M/L help strings ship with the A3 surfaces, not
before (02 documents the reservation; no dead keys documented in-game).

## A2 · The Earned Hunch (2026-07-11) — CLOSED (two consecutive clean full runs; see VERIFICATION)
**Shipped:** hunch capture (E0 Whisper; one field, zero justification — D-M) · provenance
tagging Earned/Adjacent/Wild/Borrowed (optional, post-capture, editable; plain one-line
definitions in the picker) · the wicked-domain rune on every hunch (standing, unobtrusive,
plain hover text; never blocks, never nags) · seeded-guardian priority bump
(`EARNED_HUNCH_BUMP` in src/state/tunables.ts; ordering only) · the Calibration Record
"your gut's record" (per-rung hit-rates; resolves only when the seeded guardian resolves at
derived tier ≥ 2; no shaming states — the page says why it exists) · funeral resolution wiring
(`invalidateAssumption` stamps linked tagged hunches 'broke' at E2+).
**Invariants proven (tests/earned-hunch.spec.ts, 15 tests):** provenance unreadable by
tierOf/Truth/XP (STATIC source assertion + MUTATION sweep producing zero metric delta) ·
E0-linking never raises tierOf · capture is one commit with no provenance prompt · calibration
rows never alter any metric · the bump reorders ONLY the priority queue (and only for
'earned') · key store never touched. e2e: the full capture→tag→seed→bump→E2→funeral→record
flow through the real world (W1→W5→W1 via the product's reload-resume path).
**Canon:** Earned Hunch moved Queued → Shipped in 05 (same turn).
**Deviations:** the Council-addendum item remains split per B-4 (severable; zero API surface
in this program either way).

## A3 · First Light — BLOCKED (Gate-2 re-pass pending; operator plays first)
## A4 · Confrontation + Funeral rite — BLOCKED (same gate)
## A5 · The Ego — BLOCKED (gated on A2–A4)
