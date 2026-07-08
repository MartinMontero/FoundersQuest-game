# 05 · Roadmap & Decision Log
*What's shipped, what's queued, and the decisions that must not be silently re-litigated. Update in the same turn as the change.*

## Shipped (as of 2026-07-05)
- **v3 "the crucible":** full question bank with progressive Socratic ladders and typed answers · Assumption Registry with kill criteria (tier derived from linked evidence) · Evidence Ledger E0–E4 · dual Truth/Action + XP (invalidation 1.5×) · three soft Act Gates with logged overrides · the Vault with solution-language detection · Ariadne's Thread sealing · loop rituals · Quest Brief + Journal exports · v2 data migration.
- **The Council:** consent, live/pasted tabs, thin-ink guard, durable follow-ups via journal snapshots, readings persisted and exported, single serializer with the compact-readings divergence.
- **PIE integration (tiers 1–3 app-side):** commitment gate (one-way feedback) · The Fellowship block · whiplash ritual in the Ledger · Reset retrospective + undefended Critique the Quest · Council cadence paragraph · Weather + trough detection (Shadow holds fire; normalizing banner) · Side Quests (404, Obituary, Fan Letter, Swap) · Dinner Card + "going wrong" leading the Brief · Family Dinner facilitator mode (rules, buckets, timer, spoke-tracking, serializer exclusion).
- **Standalone port:** storage ladder (artifact→localStorage→memory) · Council environment routing · Vite/React/Tailwind repo, build-verified (~87KB gz) · Pages Function with Fable-5 enforcement and zero body logging · security `_headers` · deploy runbook.
- **Documents:** v3 upgrade prompt · Council build prompt (incl. Mode A companion prompt + Mentor/Shadow persona prompts) · executive overview · positioning (README paragraph + cohort variant) · PIE×FQ analysis · LaunchBase Selection Kit · cookbook scaffold (README, license split, CONTRIBUTING w/ trust ladder, GOVERNANCE, templates, Ariadne's Thread example recipe, mistakes folder).

## Queued (prompts ready — feed to Claude Code)
1. **The Earned Hunch** — `cc-prompt-earned-hunch.md`. Prereq: `docs/epistemology/wisdom-intuition-knowledge-judgment-v3.md` in the repo. Hunch provenance (Earned/Adjacent/Wild/Borrowed), wicked-domain flag, seeded-guardian priority bump, calibration record ("your gut's record"), Council addendum, Guide section, cookbook recipe.
2. **i18n, 40 locales** — `cc-prompt-i18n-40-locales.md`. Prereq: wcjbt repo reachable (`src/config/i18n.mjs` verbatim). i18next namespaces, es-MX first per CDMX register norms, freshness/stamp/security-gate port, CODEOWNERS, RTL, the in-app freshness banner. **Consequential fork: ends single-file `App.jsx`; artifact becomes en-only sandbox — requires explicit approval at Phase 0.**

## Next after those (specs exist in the build docs; prompts to be crafted here)
Mentor & Shadow in-app AI (persona system prompts already written in the v3 upgrade doc) · Interview Debrief with Mom Test lint · full Story Forge (evidence-locked spine casting) · pre-mortem ritual at gates (partially covered by the Obituary quest) · Five-Whys visual chain · onboarding tour teaching tiers/gates · cookbook extraction of the full bank into recipes · Family Dinner shared-board exploration (privacy-first; must pass the confidentiality wall) · self-hosting recipe (Caddy + workerd/VPS) for the cookbook.

## Decision log (dated; re-opening any of these requires naming the entry)
- **2026-07-05 · Milestone checks don't migrate across changed criteria.** A checkmark carried onto a different claim is a fabricated fact.
- **2026-07-05 · Guardian tiers are derived, never declared.** A founder doesn't grade their own proof.
- **2026-07-05 · Hunches never move Truth.** Standing changes come as *test priority* and calibration, never as evidence weight (constitution-level; reaffirmed by the Earned Hunch spec).
- **2026-07-05 · Dinner data is excluded from all serialization.** Confidentiality is structural, not policy.
- **2026-07-05 · Readings store their journal snapshot.** Durable follow-ups over storage thrift; compact-readings divergence documented in `buildJournalMd`.
- **2026-07-05 · Download-dialog "fix" reverted.** A toast under a platform modal helps no one; the real fix is standalone deployment.
- **2026-07-05 · Production = Cloudflare Pages + Functions; not GitHub Pages (splits the architecture), not Firebase (data-maximization platform hosting a data-minimization app).** Sovereignty through portability: static output + plain fetch handler + founder-browser storage = 30-day exit plan exists on day one.
- **2026-07-05 · Fable 5 is enforced server-side only.** No model choice ships to the browser; the artifact runtime keeps its pinned model.
- **2026-07-05 · The artifact is the English-only dev sandbox after the i18n fork.** Byte-parity ends by design, announced, not drifted into.
- **2026-06 · PIE Cookbook adopted as ritual source (CC BY 4.0, attributed).** Borrow-test standing rule: every feature must increase human contact, never simulate it.
