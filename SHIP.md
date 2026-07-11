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

## A3 · First Light (2026-07-11) — CLOSED (two clean full runs; see VERIFICATION)
**Shipped:** the invitation (plain value-prop; findable never-hidden skip, override-exempt) ·
the 11-beat induction over the live world (typewriter, instant-complete, never timed; ARIA
live region; reduced-motion) · REAL artifacts every beat (vault capture · D-I firstLight
guardian with sealed kill criterion · verbatim E2 quote · the honest first kill, both branches)
· the D-G carve-out live in metrics · the Cartographer's Chart (M) + Legend (L) with HUD
affordances, trough-dip road (D-K), archways, tombstones, the D-H consent line · skip path +
one-time re-entry + campfire replay (write-once) · feel pack archived (docs/feel-packs/a3/).
**Deviations (plainly):** per-world Truth/Action pips deferred (tombstones shipped); nested
tooltips = one "more" level; the cold-open camera dolly is the standard rig (letterbox + text
carry the register) — all logged for the art pass. Chart label crowding at W7/W8 = known QA nit.
## A4 · Confrontation + Funeral rite (2026-07-11) — vertical slice, W1 (close pending two runs)
**Shipped (build order followed to the letter — evidence layer first):**
argument core (src/core/confrontation.ts — HP/composure DERIVED by replaying
confrontations[].citations against the real Ledger; dies 12/4 · wobbles 8/2 · shrugs 5/1;
E2=2 soak-first · E3=4 · E4=6 shatters the whole shield with overflow) · citation UI over the
live world (each coin spends once; **E0/E1 bounce = reference-equal no-op — never strengthens
the guardian, never penalizes the founder (B2)**; citing links the coin so derived tier/Truth/
XP stay honest) · the golden thread (sealed criterion verbatim; **verdict before
interpretation, write-once; the finishing strike persists until used — never RNG — proven
across a mid-fight RELOAD in e2e**) · the action wrapper LAST (Space-strikes chip poise and
break the window open early; **the idle auto-window guarantees evidence access with ZERO
successful strikes — D-C, e2e-proven**; pre-written bias counters; hp 0 = argument SPENT,
narrates, resolves nothing — B3) · both outcomes equally authored (shatter + 1.5× honors +
rite vs the standing pillar, D-D; unproven resolutions say so honestly) · the Funeral rite
(Vigil → Eulogy verbatim-from-Ledger → Committal one-input epitaph → wisdomCodex line +
inheritance; **skip = ONE warning, logged, ghost wisp narrative-only; delayed funeral lays it
to rest keeping the skip history**; the trough QUEUES the offer — HUD funeral ember only in
roam + clear skies) · the W1 Proving Circle set-piece (challenger menhir scaled by importance,
evidence-state translucency, thread torus; graveside tombstones + ghost wisps) ·
arenaChallenger (resume-first, else riskiest of THIS world, same bump as the crown).
**Invariants proven:** 39 unit tests (tests/confrontation.spec.ts + -store) + 4 slice e2e
(invalidation, validation-with-zero-strikes, skip→ghost→lay-to-rest, trough-queue +
empty-circle). Feel pack archived: docs/feel-packs/a4/ (8 shots).
**Deviations (plainly):** the stagger is poise-chips (labor), not timing-skill — the
wrapper stays deliberately light in the slice; per-stage funeral buffs (research "grant")
deferred with the art pass; the set-piece feel shot catches the circle at frame edge
(camera faces spawn) — operator sees it in-world.

## A5 · The Ego — NEXT (gated on A2–A4: A2 ✅ A3 ✅ A4 closing)
