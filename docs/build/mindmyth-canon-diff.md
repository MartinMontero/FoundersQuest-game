# Program Addendum A "Mind & Myth" — Consolidated Canon Diff (A0-2)

**Status: RATIFIED (all defaults, operator 2026-07-11) · APPLIED in the A1 canon commit, with
two recorded exceptions:** (1) the Council provenance-reading block's verbatim text never
arrived — the REPLACE sentence is applied, the APPEND half stays queued (BLOCKERS B-4, severable);
(2) the HUD M/L help strings ship with the Chart/Legend surfaces at A3, not before (02 documents
the reservation now; no dead keys documented in-game). Original ratified text below.
`openingCompletedAt?`/`openingSkippedAt?` implemented as `string | null` (the repo's established
hydration idiom for may-be-absent keys — same semantic, whitelist-copy-safe).

---

## 1 · `docs/canon/02-architecture.md` + `src/core/schema.ts` (same commit — schema delta)

All new keys default in via the existing `withDefaults` whitelist-copy (the `{...EMPTY_DATA,
...loaded}` pattern); a pre-addendum record hydrates cleanly. **Before:** none of these keys
exist (verified 2026-07-11). **After — additions only, no existing key changes:**

### Opening (First Light)
```
openingCompletedAt?: string        // ISO; set once the 11-beat induction completes
openingSkippedAt?: string          // ISO; set if "skip for now" taken (courtesy — never override-logged)
invitationSeen: boolean            // default false
chartUnlocked: boolean             // default false; flips on Chart handoff (or on skip)
firstLightArtifactIds: string[]    // ids of artifacts created during the opening
openingBeatProgress: { beat: number; ts: string } | null   // resume marker; null = not in opening
```

### Earned Hunch
```
evidence[].provenance?: 'earned' | 'adjacent' | 'wild' | 'borrowed'
  // VALID ONLY on tier-0 entries; optional, post-capture, editable (D-M)
calibration: { hunchEvidenceId: string; taggedAt: string; resolvedAt?: string;
               outcome?: 'held' | 'broke' }[]              // default []
```

### Combat (Confrontation / Funeral / Codex)
```
confrontations: { guardianId: string; startedAt: string; resolvedAt?: string;
                  outcome?: 'invalidated' | 'validated'; citations: string[] }[]   // default []
funerals: { guardianId: string; heldAt?: string; skippedAt?: string; epitaph?: string }[]  // default []
wisdomCodex: { id: string; text: string; sourceGuardianId: string; date: string }[]        // default []
```
**`egoRecord` is DERIVED at runtime** from trail/gates/funerals — never stored (confirmed
derived-not-stored, mirroring the tier-derivation precedent). No schema key.

### Tutorial tag (D-G)
```
assumptions[].firstLight?: boolean   // set only by the opening's D-I elicitation
```
Guards: `withDefaults` gains per-field sanitizers for every new array/enum (matching the
existing pattern: unknown provenance → tag dropped; malformed rows → dropped).

### Computed-metrics section (02)
Add one line documenting the **seeded-guardian priority bump** (A2 item 3): a tunable constant
in `src/state/tunables.ts`, applied ONLY to riskiest-guardian ordering; weight/Truth math
untouched. Add the **D-G carve-out** (if ratified): `firstLight`-tagged assumptions are excluded
from the Truth denominator and pay fixed First-Light XP — an explicit, named canon carve-out.

---

## 2 · `docs/canon/04-council.md` + `src/strings/council.ts` (byte-for-byte, same commit)

**REPLACE** (04 line 11 · council.ts line 18) —
before:
> An argument built on hunches is a hunch with better posture.

after:
> An argument built on ungraded or borrowed hunches is a hunch with better posture; an earned
> hunch is a hypothesis wearing work clothes — send it to the test bench first.

**APPEND** the provenance-reading block (per 04's queued entry: Earned hunches = compressed
pattern recognition awaiting a test — Simon; wicked-domain illusion-of-validity flag;
calibration-record weighting). **Exact block text: PENDING-UPLOAD** (`wikj-v3-content-package.md`
/ `cc-prompt-earned-hunch.md`). The 04 "Queued addenda" entry is then marked applied.
`tests/parity.spec.ts` re-derives; the prompt hash test updates in the same commit.

---

## 3 · `docs/canon/05-roadmap-decisions.md`

- Move **Earned Hunch** Queued → Shipped **on A2 completion** (not before).
- Log every Gate 0 ruling (D-A…D-M + blockers resolution) as dated decision entries.
- Update the Earned Hunch prereq line to point at
  `docs/epistemology/wisdom-intuition-knowledge-judgment-v3.md` (lands in A1).

## 4 · Ratify the 5-rider queue (held in `docs/build/phase0-canon-diff.md`, same commit)
1. i18n-queue coherence rider (05). 2. Settings-storage wording (02). 3. Trail `reason?` field
named in 02's model line. 4. `dinnerCard … | null` (02). 5. Scanner-endpoint ratification (05).

## 5 · Keybinds (02 + HUD help strings, same turn)
`M` = Quest Map · `L` = Legend · `Tab` (cycle-what-is-near) unchanged. Verified free: no
`KeyM`/`KeyL` handler exists in `src/game/controls.ts`.

## 6 · Glossary lines (01 or 02, per D-B ruling)
- The roaming **world-Shadow** and the Council's **Shadow voice** are distinct entities.
- The **Ego** is the boss-form of the roaming Shadow only; the Council's Shadow voice never
  fights and is never conflated with it.

---

*Constitutional check: nothing above touches tier derivation, Truth/XP formulas (beyond the
explicitly named D-G carve-out), BYOK, or serialization exclusions. Provenance/calibration are
structurally unreadable by `tierOf`/Truth/XP paths — shipped as tested invariants in A2.*
