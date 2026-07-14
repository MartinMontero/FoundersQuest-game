# Claude Code Task: The Earned Hunch
### Fine-tuning how Founder's Quest values intuition — grounded in the v3 epistemology map

**Repo:** the Founder's Quest standalone repo (`src/App.jsx` is the app; the claude.ai artifact is the dev sandbox for the same file — keep them byte-identical this task).

---

## REQUIRED READING — do this before anything else

1. `docs/epistemology/wisdom-intuition-knowledge-judgment-v3.md` — the fully sourced, QA-verified multidisciplinary map (Wisdom, Intuition, Knowledge, and Judgment, v3.0). **It is the spec's source of truth. If this file is not in the repo, STOP and ask Martin to add it. Do not proceed from summary alone, and do not substitute your own literature review.**
2. `src/App.jsx` in full — especially `TIERS`, the Evidence Ledger, the Assumption Registry (`riskiestGuardian`, `computeTruth`, `computeXP`), `COUNCIL_SYSTEM_PROMPT`, `buildJournalMd`, and the Guide.

## WHY THIS TASK EXISTS (the finding you are implementing)

The v3 map's central architectural verdict about the Builder OS Triad transfers to this app exactly: **Founder's Quest as built is a knowledge-and-judgment engine that strands the wisdom/intuition axis.** E0 "Hunch" is worth nothing toward Truth, and the Council prompt calls an argument built on hunches "a hunch with better posture." That is half right. The map's thesis is that wisdom/intuition and knowledge/judgment are **different families but interdependent, not substitutes** — and the Kahneman–Klein result gives precise boundary conditions for when a gut is signal:

- Intuition is trustworthy when **(a)** the environment offers valid, regular cues (a *kind* / high-validity environment) and **(b)** the person has had prolonged practice there **with rapid, clear feedback** (Kahneman & Klein 2009, the "failure to disagree" paper).
- Where those conditions fail (wicked environments: market timing, fundraising climate, long-horizon prediction), confident intuition is the **illusion of validity** (Kahneman, *Thinking, Fast and Slow*, 2011 — note the attribution: the illusion-of-validity discussion sources to the 2011 book, **not** the 2009 paper).
- "Intuition is nothing more and nothing less than recognition" is **Herbert Simon**, not Kahneman. These attributions were corrected across three QA passes on the v3 doc; do not reintroduce the errors in any copy you write.
- Design pattern from the same work: **Intuition Intake** — capture the muddy, pre-verbal leap *before* Socratic hardening, so intuition survives contact with reality instead of being pre-empted. The founder is the intuition organ; the app augments (Engelbart), never replaces, and never sneers.
- Damasio's somatic markers: the feeling is **information about salience**, not a verdict.
- Hogarth's kind/wicked environments: the app itself must be a **kind learning environment for the founder's intuition** — which means closing the feedback loop on every hunch.

## DESIGN LAWS (binding)

1. **Truth stays falsificationist.** No hunch, of any provenance, ever moves the Truth bar. What changes is how hunches are *valued as hypothesis generators* and how the founder's intuition gets *educated*.
2. **Provenance over confidence.** A hunch's standing derives from where it comes from (the two Kahneman–Klein conditions), never from how certain it feels.
3. **Capture before hardening.** Recording a hunch must cost two taps and zero justification. Justification comes later, as a test.
4. **Close the loop.** Every hunch-linked assumption that resolves updates a personal calibration record. This is the Loop E analog: the Quest becomes the rapid-clear-feedback environment most founders never get.
5. **Humility about domain validity.** Even an earned gut gets flagged when it's aimed at a wicked domain.

## FEATURE SPEC

### A. Hunch Provenance (Evidence Ledger, tier 0)
When E0 is selected in the Add Evidence modal, three quick inputs appear (all one-tap; no free text required):
- **Whose gut?** `mine` / `someone else's` → someone else's = **Borrowed**, regardless of the rest.
- **Hands-on time in the domain this comes from:** `none` / `some` / `years lived in it`.
- **Did that experience give fast, clear feedback when you were wrong?** `yes` / `slow or murky`.

Derived grade: **Earned** (mine + years + fast feedback) · **Adjacent** (mine + some + fast, or mine + years + murky) · **Wild** (mine + none) · **Borrowed** (not mine). Optional extras: a **wicked-domain flag** ("Is this about a domain where feedback is rare or years-delayed — markets, funding climate, timing?") and a one-word **feel** field ("pull, dread, itch — what does the body say?" — Damasio; salience data, optional, never required).

Data: evidence entries gain `{ provenance, wicked?: boolean, feel?: string }` (tier-0 only). TierBadge for E0 shows the grade (e.g., `E0 Hunch · Earned`). Storage stays backward-compatible: old E0 entries render as ungraded with a one-tap "grade this hunch" affordance.

### B. Registry integration — test the earned gut first
- Assumptions gain optional `seededByEvidenceId`. Quick-add affordances near hunches: "Make this a guardian" links automatically.
- `riskiestGuardian` scoring: an untested assumption seeded by an **Earned** (non-wicked) hunch gets a modest priority bump (e.g., +2 on the existing `weight × (4 − tier)` score; Adjacent +1; Wild/Borrowed/wicked +0). Rationale in a code comment: *earned intuition is the likeliest to survive its test (Kahneman–Klein), so testing it first is the cheapest path to raising Truth.* The bump affects **which guardian faces the founder next** — never Truth, never tier.

### C. Calibration record — "your gut's record" (Loop E)
- `data.calibration = { earned: {hits, misses}, adjacent: {...}, wild: {...}, borrowed: {...} }`.
- When an assumption with `seededByEvidenceId` resolves with E2+ evidence: `validated` → hit for that hunch's grade; `invalidated` → miss. Reopen decrements what it added (idempotent — track a `calibrated` flag per assumption to prevent double counting).
- Surface: one quiet line in the Registry header area — *"Your gut's record: Earned 4/5 · Adjacent 2/3 · Wild 1/6."* Empty state: nothing shown until the first resolution.
- Serializer: `## The Gut's Record` section in the Journal (both modes); one line in the Brief when any grade has ≥3 resolutions.

### D. Council prompt addendum — append this block verbatim to `COUNCIL_SYSTEM_PROMPT`
> On hunches: the ledger grades E0 entries by provenance. Treat an Earned hunch — years of lived, fast-feedback experience in the domain it comes from — as compressed pattern recognition awaiting its test (Simon: intuition is recognition), and say so; it deserves a designed experiment, not dismissal. Treat Wild and Borrowed hunches presented as conclusions with the old sting. When a hunch aims at a wicked domain — rare or delayed feedback, markets, timing — name the illusion of validity gently, whatever its provenance. Use the founder's calibration record when weighing their unverified claims: a gut that has gone four for five has standing; a gut that has gone one for six needs a test before a hearing. Never let any hunch, however earned, substitute for the test itself.

And **replace** the existing line "An argument built on hunches is a hunch with better posture." with: "An argument built on ungraded or borrowed hunches is a hunch with better posture; an earned hunch is a hypothesis wearing work clothes — send it to the test bench first."

### E. Copy changes (exact)
- Ledger subtitle: "Whisper → Rumor → Word → Deed → Gold. Only E2+ moves the Truth bar — and a well-graded hunch is where the next test comes from."
- Guide: new section **"The Earned Hunch"** (place after Evidence Tiers): explain the two conditions in plain language, the four grades, the wicked-domain flag, and the calibration record; close with: *"The Quest doesn't distrust your gut. It gives your gut what most founders never get — fast, honest feedback — until you both know exactly when to trust it."* Attribute the framework in the Guide's existing attribution footer: add "hunch provenance adapted from Kahneman & Klein (2009), Simon, Hogarth, and Damasio via the Builder OS epistemology map v3."

### F. Cookbook recipe
Add `recipes/core/the-earned-hunch.md` to the cookbook repo (if present in the workspace; otherwise emit it to `docs/` and flag): full recipe-template format; Origin cites the v3 map and its three QA passes; Sources list Kahneman & Klein 2009, Kahneman 2011, Simon, Hogarth *Educating Intuition*, Damasio; status `tested` only after Martin confirms first real use — until then `hypothesis`.

## HARD CONSTRAINTS
- Truth math untouched by anything in this task. XP untouched. Gates untouched.
- Zero new dependencies. Single-file `src/App.jsx` discipline holds. Works fully offline (all features except the Council addendum are API-independent).
- Storage backward-compatible via the existing `{ ...EMPTY_DATA, ...loaded }` pattern; add `calibration` to `EMPTY_DATA`.
- Artifact parity: the same file must still pass `esbuild --loader:.jsx=jsx` and contain no `localStorage` references outside the guarded `makeStore` ladder, no `<form>` tags.
- Attribution correctness is an acceptance criterion, not a nicety.

## PROCESS (the established workflow — deep research first, then propose, then build)
1. **Phase 0 — Recon, no changes:** read the v3 doc and `App.jsx`; report back (a) the doc's sections you're anchoring on, (b) every code location you'll touch, (c) the provenance-grade derivation table, (d) any tension you see between this spec and the doc. **STOP for approval.**
2. **Phase 1 — Implement** in small commits per feature (A→F), running `npm run build` and the esbuild parity check after each.
3. **Phase 2 — Self-QA** against the checklist below; report deviations plainly. No marketing language anywhere. If anything is ambiguous, STOP and ask — never guess.

## ACCEPTANCE CHECKLIST
- [ ] E0 entries carry provenance in ≤ two taps beyond tier selection; old entries gradeable retroactively.
- [ ] No provenance grade changes Truth, XP, or gate criteria — verified by grepping the three computations.
- [ ] Earned-seeded untested guardians surface first; the bump is visible in "Guardian at the gate" ordering and nowhere else.
- [ ] Calibration updates on resolve, reverses on reopen, never double-counts.
- [ ] Council prompt contains the addendum verbatim and the replaced line; Simon/Kahneman attributions correct in all copy.
- [ ] Journal + Brief sections render; empty states clean.
- [ ] Guide section present with attribution footer updated.
- [ ] Build green; esbuild parity green; no new deps in the lockfile.
- [ ] Cookbook recipe emitted with `status: hypothesis`.

*One sentence to hold while building: the Quest's old posture was "prove it or it's decoration"; the new posture is "tell me where this came from, and I'll tell you how fast it deserves a test."*
