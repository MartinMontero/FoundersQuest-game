# Phase 0 — mission restatement, repo layout, CI plan
*Rulings-pack document. Canon order: 01-constitution > docs/canon > this document. Companion to `docs/build/game-design.md`. Nothing here is code; the operator reviews this before any code exists. Where canon and the kickoff brief are both silent, the item is marked OPEN QUESTION, not invented (§7).*

---

## 1 · Restatement

**The mission:** greenfield build of Founder's Quest — a playable 3D validation-journey game — from the merged canon (docs/canon/01–06) to a beta-deployable, pure-static product on Cloudflare Pages. No prior source exists in this repo; the `founders-quest-v3.jsx` artifact is a schema/content reference, not a code base (its absence is tracked as game-design OPEN QUESTION 4). The greenfield 3D build ends artifact CODE parity — the Phase 0 canon diff therefore carries a 02 Environments amendment plus a named 05 entry re-opening the 2026-07-05 artifact-sandbox/byte-parity decision (announced, not drifted). The artifact remains the schema/content reference.

### The BYOK constitutional core (decision log, 2026-07-08)
- **One transport file.** Exactly one module in the entire codebase talks to Anthropic: browser `POST https://api.anthropic.com/v1/messages` with the player's own key and the `anthropic-dangerous-direct-browser-access: true` CORS opt-in header. `max_tokens: 1000`.
- **Model pin + ruled fallback.** `claude-fable-5` pinned in client code; no model choice ships in the UI. On a model-access failure (the player's key cannot see fable-5), the game offers `claude-sonnet-4-6` as a fallback the player explicitly accepts; the accepted choice persists; every saved reading carries its model label. The fallback extends the 2026-07-08 BYOK entry and further narrows 2026-07-05 "Fable 5 is enforced server-side only" (already superseded). Boundary in one line: no free model choice; a single ruled, labeled, player-accepted fallback on model-access failure only. The offer string (04), the decision-log entry (05), and the `council[].model` schema field (02) are not yet in canon — they ride the Phase 0 canon diff (human touchpoint 1; see AUDIT.md canon-status gaps and game-design OPEN QUESTION 2).
- **Key manager.** The player's key lives device-side under its own storage key via the storage ladder — never inside `founders-quest:v3`, never in `buildJournalMd`, never in any export or QR payload. Persisting it is consent-gated; a session-only mode keeps it in memory and writes nothing. Visible remove and replace controls. 04's key/consent/key-failure copy verbatim.
- **Three canonical error classes, each with a rendered state:**
  1. network/5xx → "The Council is not in session. Your journal is untouched; try again soon." (04)
  2. 401/credit → "Anthropic didn't accept your key. Check it or add credit, then try again — you can remove or replace it here." (04)
  3. model-access failure → the sonnet-4-6 fallback offer state (string pending the canon diff; routing amendment to 02 pending the same diff).
- **CSP as key-theft defense.** `public/_headers` ships `default-src 'self'` with `connect-src 'self' https://api.anthropic.com` — a compromised dependency or injected script has nowhere to exfiltrate a key or a journal. Verified live per runbook 06 §5.
- **No server anywhere.** No Pages Function, no relay, no sync endpoint, no server-side `ANTHROPIC_API_KEY` (owner, dev, or prod). Zero logging of bodies and keys is structural, not policy.

### Two human touchpoints
1. **Canon-diff approval (Phase 0).** The operator approves every canon amendment this build requires (fallback ruling into 04/05, `council[].model` and third-error-class routing into 02, 02 stack-section amendment, 02 Environments amendment + a named 05 entry re-opening the 2026-07-05 artifact-sandbox/byte-parity decision — the greenfield 3D build ends artifact code parity, announced, not drifted) before Phase 1 code.
2. **Gate 2 fun-check (Phase 2).** The operator plays the grey-box Stage 1 slice on a preview URL and rules on fun before the full spine is built.

### QA boundary
- The agent never sees, holds, or uses a real Anthropic key. No key exists in this environment by design (AUDIT.md).
- All Anthropic traffic in tests is Playwright route-intercepted stubs — both models (fable-5 and sonnet-4-6 responses) and all three error classes.
- Playwright self-play drives the game as a player would (keyboard-first).
- Anything only a real key can prove — first live reading, live fallback offer on a fable-5-blind key — goes to the **Operator Verification Queue**, checked off by the operator, never claimed by the agent. UNTESTED is marked plainly until then.

---

## 2 · Repo layout (proposed)

```
/
├── CLAUDE.md                    agent operating rules (exists)
├── AUDIT.md                     Gate 0 recon record (exists)
├── index.html · vite.config.ts · tsconfig.json · package.json    Vite 5 root
├── docs/
│   ├── canon/                   01–06: the law; copies update in the same commit as any change they describe
│   └── build/                   Phase 0 rulings pack, canon diff, phase reports (this file lives here)
├── public/
│   └── _headers                 CSP default-src 'self'; connect-src 'self' https://api.anthropic.com + security headers — deploys with every build
├── src/
│   ├── core/                    framework-free TS data core: schema (EMPTY_DATA, v3 types), metrics (tierOf, Truth, XP, riskiest, trough), serializer (buildJournalMd), migration (v2→v3), storage ladder — ZERO React imports, lint-enforced (§3)
│   ├── transport/               the ONE file that talks to Anthropic: request build, header, model pin, fallback negotiation, error classification into the three canonical classes
│   ├── key/                     key manager: own storage key, consent-gated write, session-only mode, remove/replace, never serialized
│   ├── strings/                 ALL copy in the product: question bank + hints verbatim from 03, Council copy byte-for-byte from 04, gate warnings, error text — no string literals in components
│   ├── game/                    R3F worlds, shrines, gates, portals, flagpoles, HUD — a pure render of the store; owns no state of record
│   └── ui/                      DOM panels: trance inputs (every 03 answer type), journal, registry, ledger, key/consent screens, exports, Field Kit
├── tests/                       vitest: core purity, metrics math, serializer (incl. Dinner exclusion + compact divergence), migration, transport classification, key manager, 03/04 string parity, key-scan proof
├── e2e/                         Playwright: self-play specs + network stubs (both models, all three error classes); no real key can exist here
├── scripts/                     session-bootstrap.sh + doctor-remote.sh (exist); future repo-guard scripts
└── .github/
    └── workflows/ci.yml         every-push pipeline (§3)
```

Rationale for the hard seams:
- **src/core has zero React imports, enforced** — the data model outlives any renderer (the 30-day exit plan applies to code too), and every metric/serializer rule from 02 is testable without a DOM.
- **src/transport is one file** — the whole product rides one risky header (AUDIT risk 1); if Anthropic policy shifts, a relay slots into one file with no canon churn elsewhere. A repo-guard test asserts `api.anthropic.com` appears in no other module.
- **src/key is separate from src/core** — the key must be structurally unable to enter the serialized world; separate module, separate storage key, no import path from serializer to key store.
- **src/strings is the single copy source** — 03 verbatim and 04 byte-for-byte are testable only if copy has one home. Parity fixtures in tests/ diff strings against the canon files.
- **No functions/ directory exists, ever** — its absence is asserted in CI (§3).

---

## 3 · CI plan

`.github/workflows/ci.yml`, triggered on **every push** (all branches; Cloudflare Pages handles preview deploys separately per 06 §6). Runner: ubuntu-latest, Node 22 pinned (matches the Pages `NODE_VERSION` pin).

| Step | Command (indicative) | Notes |
|---|---|---|
| Install | `npm ci` | lockfile-exact |
| Lint | `eslint .` | includes the core-purity rule: `no-restricted-imports` banning `react`, `react-dom`, `@react-three/*`, `zustand` inside `src/core/**` |
| Typecheck | `tsc --noEmit` | strict |
| Unit tests | `vitest run` | includes string-parity, serializer-exclusion, key-scan-proof, repo-guard (no `functions/`, no `ANTHROPIC_API_KEY`, `api.anthropic.com` only in src/transport) |
| Build | `npm run build` | must end `✓ built`; `dist/` is the product |
| Vulnerabilities | `osv-scanner scan source .` | **online mode in CI** — GitHub's network reaches api.osv.dev. Local runs in the remote container must use `--offline-vulnerabilities --download-offline-databases` (egress proxy denies api.osv.dev; see scripts/session-bootstrap.sh) |
| Secrets | `gitleaks git` over full history | `fetch-depth: 0`; caveat from AUDIT: default config allowlists AWS EXAMPLE keys, so planted-key tests use non-allowlisted fabricated keys |

Never Trivy. No telemetry of any kind — no coverage uploaders, no third-party reporting actions; scanners install from pinned official releases (GitHub's network allows release downloads that the local container's proxy blocks).

**Proposed addition beyond the brief's enumerated list:** a second job running the Playwright e2e suite (Chromium, stubs only) on every push — it is the mechanism behind most of §4. Flagged as OPEN QUESTION 1 rather than assumed.

### Deps-review table (required in every phase report)

| name | version | license | steward |
|---|---|---|---|
| *(example)* react | 18.x | MIT | React Foundation (Linux Foundation, since Feb 2026 — operator correction; judged on MIT) |
| *(example)* @react-three/fiber | 8.x | MIT | Poimandres |

Rules: every runtime and build dependency appears; licenses must be AGPL-3.0-compatible (MIT/BSD/Apache-2.0/ISC pass; anything proprietary, SSPL, or non-commercial fails); **no Meta/OpenAI/xAI services or models** anywhere in the chain — dependencies, CI actions, or asset pipelines. Sanctioned services only: Anthropic API, Cloudflare Pages, GitHub(+Actions).

---

## 4 · Canonical flow list → test map

Legend: **V** = vitest (tests/) · **P** = Playwright + network stubs (e2e/) · **OPERATOR-ONLY** = Operator Verification Queue or scheduled human check. Every P spec runs keyboard-first unless noted.

| Flow | Test | Notes |
|---|---|---|
| Onboarding | P `onboarding.spec` | first-run through to first shrine |
| Key entry + consent, persistent | P `key.spec` | reload → key survives under its own storage key, never in `founders-quest:v3` |
| Key entry, session-only mode | P `key.spec` | reload → key gone, game intact |
| Key remove/replace | P `key.spec` | visible control; storage key cleared |
| Consent precedes store and send | P `key.spec` + `council.spec` | `key.spec`: no storage write before consent; `council.spec`: no request before consent; negative spec: decline consent → zero requests to `api.anthropic.com`, key absent from storage |
| Every answer-type input once | P `answer-types.spec` + V write-shape per type | all 17 controls from game-design §2.1: untagged, story, names, fivewhys, number, list, quickadd, falsify, verbatim, vault, ifthen, seal, verdict, registry, decision, spine, joy — each inscribed once, exact 02 keys asserted |
| Guardian create→link→resolve (validated) | P `guardian.spec` + V metrics | tier derived via `tierOf`, +10 XP |
| Guardian create→link→resolve (invalidated) + funeral | P `guardian.spec` + V metrics | headstone renders; +15 XP (the 1.5×) |
| Vault capture + Stage-3 unseal | P `vault.spec` | nudge on solution words; capture always works; opens on first W3 entry |
| Gate pass | P `gates.spec` | criteria met → pass logged to `gates` + `trail` |
| Gate override-with-reason | P `gates.spec` + V export assertion | written reason required, logged, appears in exports |
| Thread seal → verdict → decision-with-citation | P `thread.spec` | two-step seal; sealed text shown at verdict; decision locked until ≥1 citation |
| Weather + trough | V trough math + P `weather.spec` | totem tap; sky changes; trough → Shadow silent, banner, quest board lit |
| Shadow summons | P `shadow.spec` | Action>>Truth summons the Shadow quoting only the founder's own journal; zero network asserted; suppressed in trough |
| Milestone flagpoles | P `milestones.spec` | flagpole raise/lower moves Action only, never Truth |
| Loop toll | P `loops.spec` | learning line demanded; `trail` push; Reset adds retro + critique |
| One side quest | P `sidequest.spec` | accept → complete → +5 XP |
| Council full flow, stubbed | P `council.spec` | consent → convene → stubbed fable-5 reading → commitment gate → follow-up; snapshot + model label persisted |
| Thin-ink refusal | V guard + P `council.spec` | <3 answers + empty ledger → 04's "needs more ink" string |
| Error 1: network/5xx state | P `council-errors.spec` (route abort/500) | canonical string rendered; journal untouched |
| Error 2: 401/credit key-failure state | P `council-errors.spec` (stub 401) | canonical string; remove/replace offered |
| Error 3: model-access + fallback offer-and-accept | P `council-errors.spec` (stub model-access failure) | offer rendered → accept → stubbed sonnet-4-6 reading labeled `claude-sonnet-4-6` → choice persisted across reload |
| Field: hunt list | P `field.spec` (mobile viewport) | per A-101 §12 (`docs/build/a101-field-mode-spec.md` — landed; OPEN QUESTION 3 closed) |
| Field: attempt→hollow | P `field.spec` | per A-101 §12 |
| Field: quote→filled | P `field.spec` | per A-101 §12 |
| Field: QR beam — phone displays → desktop webcam scans | V payload codec (terminal records only — resolved attempts, hollow/filled slots, evidence, Field Day closures; `beamedAt` and local-only fields stripped, A-101 §8/R6) + P two-context handoff | real webcam scan on physical hardware: OPERATOR-ONLY |
| Field: JSON round-trip | V | export → import → deep-equal on terminal records (`beamedAt` stripped); same payload re-imported → zero new records (idempotence, A-101 §12) |
| Field: import idempotence | V | same beam twice → zero new records, correct `skippedExistingIds` (A-101 §12) |
| Field: import conflict | V | existing id, differing content → `conflict` counted, nothing overwritten (A-101 §12) |
| Field: import rejection | V | unknown keys, Dinner-named keys, tier outside 2–4, oversize → named errors before any write (A-101 §12) |
| Field: fence-neutralization | V | imported quote with backtick-fence sequences cannot alter journal structure, either serializer mode (A-101 §12) |
| Exports (Brief + Journal) | P download + V serializer | single serializer; compact divergence; `dinnerSession`/`dinnerLog` structurally absent, both modes tested; Brief leads with `dinnerCard.text` when present (02; R3) |
| Key-scan proof on all outputs | V + gitleaks over e2e artifacts | plant an `sk-ant-`-shaped fabricated (non-allowlisted) key in the key store; assert absent from every export, journal build, QR payload, and `founders-quest:v3`; AND grep all outputs — exports, `buildJournalMd` both modes, QR payloads, e2e artifacts, storage dump — for the `sk-ant-` prefix pattern |
| Storage-degraded banner | P (localStorage-disabled context) | in-memory fallback + honest banner per 02 |
| Reduced-motion | P (emulate `prefers-reduced-motion`) | crossfades not dollies; no shake; particles static/off |
| Keyboard-only full session | P (zero mouse events) | full journey: shrines, gates, portal, funeral, flag, temple, export |
| Attribution page | P `attribution.spec` + V string-parity fixture | in-game page reached; PIE CC BY 4.0 line byte-matched to 01 |
| Preview-URL smoke | scripted: `curl -I` headers + P against the preview URL | persists on reload; CSP `connect-src` exactly `'self'` + `https://api.anthropic.com` (06 §5) |
| First live Council reading (real key) | OPERATOR-ONLY | Verification Queue; UNTESTED until checked |
| Live fallback offer on a fable-5-blind key | OPERATOR-ONLY | Verification Queue |
| Gate 2 fun-check | OPERATOR-ONLY | human touchpoint 2 |

---

## 5 · Definition of done (restated; verification method per item)

Restated from the kickoff brief and canon — see OPEN QUESTION 2 for the verbatim-wording caveat.

- [ ] **All eight worlds playable grey-box first** — Playwright full-journey self-play spec green; no asset pack on the critical path.
- [ ] **Every flow in §4 green** — automated rows pass in CI; OPERATOR-ONLY rows checked off in the Verification Queue.
- [ ] **BYOK transport contract holds** — vitest on src/transport (URL, header, `max_tokens: 1000`, fable-5 pin, fallback negotiation, error classification); repo-guard test proves `api.anthropic.com` appears in exactly one module.
- [ ] **Key manager guarantees hold** — key-scan proof vitest green; Playwright persistent/session-only/remove/replace specs green.
- [ ] **No `sk-ant-` in any output** (kickoff, verbatim) — the key-scan proof plants an `sk-ant-`-shaped fabricated key AND greps all outputs — exports, `buildJournalMd` both modes, QR payloads, e2e artifacts, storage dump — for the `sk-ant-` prefix pattern.
- [ ] **Consent precedes store and send** — `key.spec` asserts no storage write before consent; `council.spec` asserts no request before consent; negative Playwright spec: decline consent → zero requests to `api.anthropic.com`, key absent from storage.
- [ ] **Three error classes each render their canonical state** — stubbed e2e green; strings byte-matched to 04 (third string pending canon diff).
- [ ] **Fallback is offered, accepted, persisted, and labeled** — stubbed e2e green; live confirmation in Operator Verification Queue.
- [ ] **CSP live in production** — `curl -I` per 06 §5 shows `connect-src 'self' https://api.anthropic.com` and the security headers.
- [ ] **No server anywhere** — CI repo-guard: no `functions/` directory, no `ANTHROPIC_API_KEY` string, no fetch outside src/transport; 06's "nothing that could log a body or a key" stands.
- [ ] **String parity** — vitest fixtures: 03 question text verbatim, 04 Council copy byte-for-byte, `COUNCIL_SYSTEM_PROMPT` byte-parity (fixture lands when the constant first exists, per AUDIT).
- [ ] **Data-model fidelity** — vitest: exact 02 keys, derived-never-stored tiers, migration rule (v2 reflections in, milestone checks out), Dinner exclusion from all serialization.
- [ ] **Scans clean on the ship commit** — osv-scanner and gitleaks green in CI.
- [ ] **Deps-review table complete and compliant** — table in the final phase report; AGPL-compatible licenses; no Meta/OpenAI/xAI services or models; operator reviews at each phase gate.
- [ ] **Canon copies updated in the same commits as the changes they describe** — verified at operator review of each phase's diff (not machine-checkable).
- [ ] **Both human touchpoints passed** — canon-diff approval and Gate 2 fun-check recorded with dates.
- [ ] **Accessibility floor** — keyboard-only full session and reduced-motion Playwright specs green.
- [ ] **Attribution** — in-game attribution page present; PIE CC BY 4.0 line byte-matched to 01; Playwright spec reaches the page + string-parity fixture.
- [ ] **No telemetry** — dependency review + repo-guard grep; CSP makes it structural.
- [ ] **Deployed** — Pages preview URLs on every branch; production per runbook 06; preview-URL smoke green; SHIP.md written (final-phase deliverable).

---

## 6 · Non-goals (D-scope — named, excluded, stop-items if touched)

| Item | Status |
|---|---|
| **D2 — AI rehearsal** | excluded. No AI simulates a customer or interview; the human-contact test (01) stands. |
| **D5 — peer layer** | excluded. No peer-to-peer, no shared boards, no multiplayer of any kind. |
| **Earned Hunch** | excluded. Queued in 05 with its own prompt and prereq doc; the 04 Council addendum does NOT apply; "hunches never move Truth" stands as shipped. |
| **i18n build-out** | excluded. English only; the 40-locale fork (05 queue item 2) requires its own explicit Phase 0 approval and ends single-file parity — not this build. |
| **Dinner UI** | excluded — for the Family-Dinner-confidential keys. `dinnerSession` and `dinnerLog` exist in `EMPTY_DATA` defaults only — no world, no UI, never serialized, both serializer modes tested. `dinnerCard` is the founder's own card, not Dinner-confidential (02: "Brief leads with `dinnerCard.text` when present") — it stays in scope with a minimal in-app editor and its Brief-lead behavior, per canon 02 unchanged (R3; the split is flagged as an operator ruling in the Phase 0 report — recommendation: accept, zero canon change needed). |
| **Any relay/sync endpoint** | excluded. No server sits in any path; BYOK is browser→api.anthropic.com direct, full stop. |

Touching any of these mid-build is a stop-and-ask, per CLAUDE.md.

---

## 7 · OPEN QUESTIONS (this document's own; game-design.md's six remain open in parallel)

1. **Playwright in CI.** **RULED (R-D, 2026-07-08): yes** — an e2e job (Chromium, stubs only) runs on every push alongside the brief's six steps.
2. **DoD verbatim source.** Not disputed at canon-diff review (2026-07-08); §5 stands. If any future divergence from the kickoff's wording surfaces, the kickoff wins.
3. **A-101 not in repo — CLOSED.** A-101 landed in the same batch (`docs/build/a101-field-mode-spec.md`); the Field rows in §4 now point at A-101 §12's tests. The QR row runs phone displays → desktop webcam scans; the OPERATOR-ONLY item is the real webcam scan on physical hardware.
4. **TypeScript beyond the core.** **RULED (via canon item 7b, applied `530cfb0`):** TypeScript strict throughout; 02's amended Stack section carries it.

Dependencies (not new questions, tracked elsewhere): the fallback offer string, 05 decision entry, `council[].model` field, and third-error-class routing in 02 all ride the Phase 0 canon diff — §1 and §4 reference them but nothing here can byte-match those strings until the diff is approved.
