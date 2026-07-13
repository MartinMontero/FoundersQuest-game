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
## A4 · Confrontation + Funeral rite (2026-07-11) — CLOSED (two clean full runs; see VERIFICATION — osv note)
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

## A5 · The Ego (2026-07-11) — CLOSED (two clean full runs; see VERIFICATION — osv note)
**Shipped:** src/core/ego.ts — the Ego DERIVED at runtime from the real record (D-B: no
egoRecord key exists anywhere): shields = overridden gates carrying their logged reasons
VERBATIM · ghost summons = skipped-unheld funerals (+2 HP each; the already-live delayed
funeral removes the weapon) · HP = 6 + 2×Σ weight(untested/testing, non-firstLight) ·
founderEdge = E2+-resolved count (per-cite damage bonus, cap 2) · heavy-attack strength =
live Action−Truth divergence. **THE OUTRANKING INVARIANT is a 200-state seeded property
test — capture+resolve@E2+ never worse on ANY formula axis; the formula is tuned to the
test.** The defense-mechanism ladder: denial (only E3/E4 land — "denial can't survive
Gold") → rationalization (only sealed-criterion-linked evidence lands) → projection (no
damage; the founder's own untested beliefs thrown back — "return as test" is a REAL
untested→testing write) → sunk-cost (cut by evidence linked to an invalidated belief, or
Gold) → identity-fusion (**no citation lands; won ONLY by the integration line, written to
the wisdomCodex under sourceGuardianId 'ego'**). Capstone "Cartographer's Distance": a
permanent HUD readout of Action−Truth drift, DERIVED from that codex entry — no new schema
key, canon shapes untouched. D-F: the trough shows the pre-written delay (never the fight,
never a block). B2 holds against the Ego (hunches bounce, unconsumed); deflected coins are
NOT consumed either (anti-punitive — no soft-lock). Leaving mid-fight writes NOTHING
(byte-identical record, e2e-proven); fight progress is session-only BY DESIGN. All dialogue
pre-written in src/strings/ego.ts (D-E) — zero API. W8 Launch Threshold monolith set-piece.
**Invariants proven:** 14 unit tests + the 200-state sweep + 2 store-action tests; 2 slice
e2e (five-phase fight with reload-surviving capstone; trough delay + no-penalty exit).
Feel pack archived: docs/feel-packs/a5/ (8 shots).
**Deviations (plainly):** bias-pattern action moves (compliment projectiles, Wald shield,
control-inversion) and per-world minions deferred — the slice ships the evidence ladder,
not the bullet-hell; the capstone rides the wisdomCodex (sourceGuardianId 'ego') rather
than a new schema key — deliberate, to stay inside the Gate-0-approved canon diff.

---

# SHIP — Backlog Build-Out + Design Elevation run (2026-07-12/13) — CLOSED

Two mandates, both met: (1) the ENTIRE recorded backlog built out or parked with
operator-facing reasons — zero silent drops; (2) the design elevation — every world a
composed place, the world reacting to dramatic beats, zero default-browser chrome.
Exit rule satisfied: TWO consecutive fully-clean full runs (VERIFICATION Round 16).

## What shipped, by epic
- **Hygiene + E-0 groundwork:** capture-tier fix, panel typography (eyebrow rule
  everywhere), camera language (arena/ego framing, rite vigil rise), celebration staging
  (CelebrationFx — shatter/pillar/funeral/integration staged IN-world), weather→sky tint
  (display-only, W1 byte-pinned).
- **E-1..E-8 world elevation:** per-world earth tints + seven bespoke landmarks (W2
  fellowship rookery … W8 rocket gantry), feel-pack gate per world, archived shots.
- **Mechanics batch:** the Proving Circle in EVERY world 2–7 (one layout change — the
  core was stage-scoped by design), per-world minion register + telegraphed bias attacks
  (presentation-only; D-C untouched), validated-pillar and candle graveside honors.
- **Audio (A-1, honest swap):** CC0 downloads are egress-blocked in the container, so the
  beds + cues are PROCEDURAL WebAudio patches — license-free, zero deps. Silence-default
  master, three campfire sliders (own settings key), unlock-on-gesture, cues duplicate
  visual feedback (never audio-only).
- **Council temple (C-1):** consent room first (canon copy verbatim), key room (BYOK —
  consent precedes storage, visible remove, key never in v3), live rite honestly DARK
  (B-4 unresolved — no fabricated Council text), pasted-reading path with provenance.
- **Field Mode (F-1..F-11):** the complete A-101 layer — Hunt List (profiles never
  persons), the Lantern (cap 7, trough-frozen), Field Days, the beam (copy/paste + file +
  QR): vendored MIT encoder (deps-review in BLOCKERS — jsqr/qr-scanner REJECTED on
  license), FQB1 frame chunking, native-BarcodeDetector scan fallback, all seven import
  rules as tests, F-103 atomic audit provenance (via records the true transport — a
  hardcoded-'paste' bug was caught and fixed), 390px mobile e2e.
- **PWA (F-9):** hand-rolled sw.js (R-J — navigations network-first so a stale shell can
  never poison the app; non-GET/cross-origin NEVER intercepted, guard-tested down to
  "sw.js may not name the Council host"), manifest + reproducible code-generated icons,
  campfire "This device" card (A2HS, storage.persist(), transfer-first honesty).
- **Chart + First Light v2 + credits (E-9/E-10/E-11):** two-line staggered waypoint
  labels (W7/W8 crowding fixed), per-world Truth/Action pips (derived exactly as Truth
  is), chip viewport clamp; the Cartographer's raven PHYSICALLY present through the
  induction (in-engine, CC0-clean) + chart parchment unfurl (motion-gated); in-game
  attribution page mirroring CREDITS.md/VENDORED.md.
- **P2 sweep:** legend "deeper" folds (canon-cited, structurally capped), cold-open
  establishing drift, raven re-entry perch, W5 reflective water (tier-split, honest),
  fault e2e (kill-plane + rim wall), README/CHANGELOG/.env.example (no-server-env BY
  DESIGN), Clock-deprecation + tab-limit audits recorded.

## Canon-accuracy catches (the review working as intended)
1. The induction and legend taught "only Deed and Gold move the Truth bar" — canon and
   the shipped truth() say E2-or-better, which INCLUDES Word. Copy corrected everywhere.
2. The First Light invitation could offer itself outside World 1 in seed-only states —
   now stage-gated (verification run 1's catch; f3f5358).
3. An import confirmed from a file was audited as 'paste' — provenance now truthful.

## Parked (BLOCKERS.md, operator-facing)
K-1..K-13 standing + **K-14 NEW:** F-12 voice capture parked on constitutional grounds —
browser SpeechRecognition ships audio to vendor servers (unsanctioned service, outside
the consent architecture). Typed capture stays primary.

## Deploy
Canonical play URL (2026-07-13): **https://play.foundersquest.ca** — custom
domain on the founders-quest-game Pages project's PRODUCTION deployment
(operator-approved; domain active, Google-CA certificate issued, CNAME added by
the operator — the environment's API token has no zone-level rights, verified
and documented). Production origin hash-verified: founders-quest-game.pages.dev
serves assets/index-DbQCWvgT.js with the canon CSP; sw/manifest/icons 200.
End-to-end fetch of the subdomain itself is UNTESTED from this container (the
egress allowlist 403s the new hostname) — every layer beneath it is verified;
the operator's first click is the final check. Branch-preview alias (the QA
link) remains: https://claude-dev-environment-setup.founders-quest-game.pages.dev
— hash-verified at deploy time (assets/index-BKrVXuwQ.js). Also staged, dormant:
the foundersquest.ca/play PATH mount (worker fq-play-proxy uploaded, /play-based
build on the `play` branch) — one Worker-route click activates it if ever wanted.
The unsuffixed founders-quest-game.pages.dev alias still serves an A3-era build — no
deletion attempted (Rule 9; operator console action). Hash-verify recorded below the
deploy in VERIFICATION/SITREP.
