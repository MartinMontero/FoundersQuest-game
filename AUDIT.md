# AUDIT — Gate 0 recon (2026-07-08)

Every claim below traces to a tool result from this session. UNTESTED items are marked.

## Repo state
- `main` created at `41cafe3` via GitHub API (Gate-0 merge, pre-authorized; ethos review of `0ad3b6e` + `41cafe3` passed 2026-07-08). Verified post-merge: all six canon files present on `origin/main`; `05-roadmap-decisions.md` carries the dated 2026-07-08 BYOK entry naming both superseded rulings.
- Greenfield confirmed: no `src/` exists. Canon language implying built software is target-state specification (05 queue item 3 says so explicitly).
- Working branch: `claude/dev-environment-setup-tsp3tv` (branch-bound; merges to main are operator PRs from here on).
- F-205 audited permission deny list applied and pushed (`7f02fe1`) — filename-based Bash denies close the read-only-builtin bypass of `Read()` denies; force-push denies now match flag-after-remote forms.
- **Operator action needed:** GitHub default branch still points at the dev branch; flip to `main` (Settings → Branches). The MCP toolset cannot change repo settings.

## Toolchain (verified versions)
- Node v22.22.2 · git 2.43.0 · Claude Code 2.1.204
- osv-scanner 2.4.0, gitleaks 8.30.1 — reinstalled per session by `scripts/session-bootstrap.sh` (container is ephemeral; GitHub release downloads proxy-blocked; both build from source via proxy.golang.org, verified working).
- Playwright: pre-baked Chromium at `/opt/pw-browsers` (`chromium-1194`, headless shell 1194, ffmpeg-1011). **Pin evidence:** playwright-core 1.56.1 `browsers.json` expects chromium revision **1194** (exact match); 1.61.1 expects 1228 (absent, and browser CDNs are egress-blocked — 403). Project pins `@playwright/test@~1.56.1`; `playwright install` must never run here.
- Chromium launch verified this session: headless screenshot rendered (1280×720 PNG) via `npx playwright screenshot`.

## Security scans (Gate 0 baseline)
- gitleaks git (full history, post-merge): no leaks found.
- gitleaks dir (tree): no leaks found.
- Detection sanity: gitleaks default config allowlists AWS's well-known EXAMPLE credentials — smoke tests must plant non-allowlisted fabricated keys (verified: such a key triggers exit 1).
- osv-scanner: nothing to scan yet (no lockfile). **Local runs need `--offline-vulnerabilities --download-offline-databases`** — the egress proxy denies `api.osv.dev` (403 on CONNECT, verified) but allows `storage.googleapis.com` (offline DB found all 6 known lodash 4.17.15 vulns in a fixture, verified). CI on GitHub Actions uses default online mode.

## Egress reality (this container)
Allowed direct: registry.npmjs.org, proxy.golang.org, pypi, crates. Blocked (403 via proxy, verified): GitHub release assets, `api.osv.dev`, Playwright browser CDNs. `api.anthropic.com` is on the noProxy list (`anthropic.com` wildcard) — relevant only to stubs; QA never uses a real key.

## Credentials in scope
- `CLOUDFLARE_API_TOKEN` present in env (presence-checked only; not read). Sanctioned: Pages project creation + preview deploys. Production deploys operator-gated.
- Git push via authenticated local proxy (verified by pushes). Workflow-file pushes verified allowed (probe pushed and reverted pre-merge: `89fe05f`/`84ef4e7`).
- No Anthropic key exists anywhere in this environment, by design (BYOK). QA boundary: all Anthropic calls in tests are Playwright route-intercepted stubs.

## Canon status
- Six canon files read in full this session, post-merge state. Known gaps the Phase 0 canon diff addresses: model-access offer string (04), fallback decision entry (05), third-error-class routing (02), consent cost-transparency line (04), `council[].model` field (02), untagged-question header clause (03 — verified absent).
- Byte-parity obligation noted: `COUNCIL_SYSTEM_PROMPT` in code must match 04's blockquote byte-for-byte (tested in CI from Phase 1... test lands Phase 4 with the temple; parity fixture created when the constant first exists).

## Risks (ranked)
1. **Anthropic browser-access policy** — the whole product rides `anthropic-dangerous-direct-browser-access`. Mitigation: ONE transport file; a relay could slot in without canon churn. UNTESTED against a real key by design; first live reading sits in the Operator Verification Queue.
2. **Model access variance on player keys** — some keys won't see `claude-fable-5`. Mitigated by the ruled sonnet-4-6 fallback (offer, persist, label). Live fallback UNTESTED until an operator key exercises it.
3. **localStorage eviction (iOS Safari 7-day)** — mitigated by A2HS onboarding + transfer-first + eviction warning (A-101). Also covers the stored key (self-healing: re-enter).
4. **Playwright/Chromium version drift** — if the environment image updates its pre-baked browser, the 1.56.x pin must move with it; doctor-remote.sh checks the cache dir, CI runs its own browsers.
5. **CC0 asset availability** — shortlist needs license verification at download time (Phase 2); grey-box first means no asset blocks the critical path.

## Environment adaptations already in repo
`scripts/session-bootstrap.sh` (scanner reinstall), `scripts/doctor-remote.sh` (remote-adapted doctor; ALL CLEAR as of Gate 0).

---

# AUDIT — Program Addendum A "Mind & Myth" · Gate 0 recon (2026-07-11)

Every claim traces to a tool result from this session (A0-1).

## Repo / branch state
- Branch `claude/dev-environment-setup-tsp3tv` @ `eac95ea`, clean tree, HEAD == origin.
- Phase 3 (8-world spine) functionally complete: traversal, 9 trance controls, sequence locks
  (Vault unseal W3 · verdict-first W5 · s5-dec citation lock · Act Gates · loop tolls),
  per-world sky identity, campfire hub (weather/notes/side quests/export/Dinner Card).
- SITREP.md delivered 2026-07-10; operator full-game QA playthrough PENDING.

## Phase 2b / Gate 2 re-verdict status
- LOOP.md line 4 records the operator's "build out the rest of the worlds" (2026-07-10) as the
  **Gate-2 fun-check go-ahead** (human touchpoint 2) after the Phase 2b reskin + several live
  eyeball rounds ("the UI is now in decent shape").
- **No formal "Gate 2 re-pass: PASSED" ruling is recorded as such.** Per Addendum A0-1, until the
  operator confirms it, **phases A3–A5 are hard-blocked**; A1–A2 (docs + framework layer) are not.
  → Confirmation requested in the Gate 0 decision round.

## Research-file manifest check — **BLOCKER (stop condition met)**
Required byte-nonempty in `docs/research/`; found NONE of the six:
| file | status |
|---|---|
| antagonist-combat-architecture.md | MISSING |
| antagonist-combat-architecture-audit.md | MISSING |
| first-light-opening-orientation.md | MISSING |
| first-light-opening-orientation-audit.md | MISSING |
| wikj-v2.md | MISSING |
| wikj-v3-content-package.md | MISSING |

`docs/research/` holds only `premium-ui-direction.md`. Uploads dir holds only the prompt itself.

## Phase 2b art-direction addendum — **BLOCKER**
Required in `docs/build/` ("if no such file is committed, that is a BLOCKER"). Not present.
`docs/build/`: a101-field-mode-spec, constitution-review, game-design, license-proposal,
phase0-canon-diff, phase0-restatement — none is the art-direction/world-feel addendum.
Candidate: `docs/research/premium-ui-direction.md` (cited by code comments as the premium-UI
research) — operator to rule whether it IS the addendum or the real one still needs to land.

## Test-count baseline
- Unit (vitest): **334 passed** (13 files). e2e (Playwright ~1.56.1, chromium-1194): **14 spec
  files / 22 tests — all passed** in the 2026-07-10 serial run (9.0m).
- Keybinds M / L: **free** — no `KeyM`/`KeyL` handling anywhere in `src/game/controls.ts`.
- 5-rider queue confirmed present in `docs/build/phase0-canon-diff.md` (5 items, verbatim).
- 04-council.md already carries the queued Earned-Hunch addendum entry whose replacement sentence
  matches Addendum A §A0-2 byte-for-byte; `src/strings/council.ts:18` holds the current sentence.

---

# AUDIT — Backlog Build-Out + Design Elevation · Phase 1 (2026-07-11)

8-reader research pass (canon, build docs, research docs, program records, repo
map, security/a11y code audit, feel-pack image review, stack verification) —
every claim below traces to a file read, an image viewed, a command run, or a
cited primary source. Full inventory with acceptance criteria: BACKLOG.md.

## Ground truth at open
- vitest 411/411 (17 files) · e2e 31 passed + 3 skipped-by-design (feel-gated),
  zero flaky — fresh run this session (scratchpad ground-truth log).
- gitleaks: clean over working tree AND full history (both run this session).
- osv: **clean, verified via offline DB** — `osv-scanner scan
  --offline-vulnerabilities --download-offline-databases -L package-lock.json`
  → "No issues found", 4 documented dev-only filters (accuracy of each ignore
  reason re-verified against the advisories). Closes the A4/A5 inherited
  claim. Note: this exact offline flag guidance was already in the Gate-0
  audit (this file, "Security scans" §) — the A4/A5 closes missed it; the
  verify-loop command now uses it.

## P0/P1 findings (new this pass)
1. **P0 · Stock textarea resize grip visible in the trance panel** —
   docs/feel-packs/a3/05-trance-frame.png shows the default browser resize
   control; art-direction §3 bans default-browser controls. In-product, not
   just archival. Fix: resize-none across textareas.
2. **P0 · Archived feel packs show the banned capsule protagonist** — the
   capture/automation render tier skips rogue.glb and draws CapsuleAvatar
   (src/game/Player.tsx:174 region); 10/23 shots auto-fail §4.3/§4.8
   (per-shot list: a3/02,03,04,05 · a4/01,05,08 · a5/01,02 + root cause).
   Fix capture tier, recapture all packs.
3. **P1 · Systemic elevation gap: the world never reacts to dramatic beats.**
   Every celebration/boss beat (shatter, funeral, all Ego phases, integration)
   is a parchment panel over a pixel-identical backdrop — the "form over a
   void" pattern with nicer panels (feel review, all three packs). This is
   the design-elevation epic's spine (BACKLOG E-0/E-8).
4. **P1 · Shrines/thresholds read as lone slabs** — §2.6 "enterable
   architecture, never lone slabs" fails at shrines (glow-ring pillars) and
   the W8 threshold (flat monolith). W8 palette also off-spec (§5 night
   launchpad vs generic dawn); W1 ground brown vs indigo/violet.
5. **P1 · a11y: two dialogs built outside DialogShell lack its guarantees** —
   FounderNaming (no focus trap/restoration, Esc only from the input, input
   named by placeholder only, outline-none suppressing :focus-visible —
   src/ui/FounderNaming.tsx:51-83) and the OpeningOverlay Invitation (no trap,
   no Esc — src/ui/OpeningOverlay.tsx:109-148).
6. **P1 · Council surfaces are dead code** — keyManager + transport are built
   and guard-tested but no key-entry UI or temple surface exists
   (src/key/keyManager.ts:74 note). BACKLOG C-1 (B-4 keeps live calls dark).

## Verified clean (evidence in the audit returns)
- Zero dangerous sinks in src/ (eval/new Function/dangerouslySetInnerHTML/
  innerHTML/document.write — only hit is the guard test that bans them,
  tests/guards.spec.ts:59-73). No inline JS in index.html.
- All user text renders through React text nodes; the one constructed URL is
  a revoked Blob download; the serializer fence-neutralizes every
  interpolated field (src/core/serializer.ts:26-69).
- Key handling: bare key under its own storage key only; never in any JSON
  envelope; serializer cannot import keyManager (guard); fetch banned outside
  the transport module (guards.spec.ts:31-41); no ANTHROPIC_API_KEY anywhere
  in src/; no functions/ directory exists.
- No timed reading anywhere (typewriter completes on input; the only gameplay
  timer OPENS a window). Reduced-motion coverage comprehensive (negative-
  lookahead grep found no ungated animation).
- Async surfaces: storage ladder + degraded banner, boot status line, error
  boundary with reload, per-asset Suspense fallbacks.

## CSP notes (public/_headers:5-6)
- connect-src carries `blob:` beyond 'self' + api.anthropic.com (BACKLOG X-3:
  verify consumer or tighten); Permissions-Policy camera=(self) is currently
  unused — its intended consumer is the Field-Mode QR scanner (F-8);
  style-src 'unsafe-inline' + script-src 'wasm-unsafe-eval' are the two
  documented relaxations (Tailwind inline styles / rapier WASM).

## Stack verification (primary sources cited in the research return)
- **Vite 5.4.21 is out of upstream support** — 2026 dev-server CVEs fixed
  only in 6.4.x+; canon pins Vite 5, so the dev-only ignore list is the
  standing policy (BLOCKERS K-13, operator-facing). esbuild 0.21.5 CORS
  advisory (moderate, dev-only) unfixable under the pin — documented filter.
- eslint 9 on the upstream maintenance tag (limited support ends ~2026-08-06,
  derived; exact page proxy-blocked → UNTESTED). fiber-8/drei-9/rapier-1
  lines frozen upstream (React-19-only successors) but newest-of-line,
  advisory-free, internally consistent. React 18.3.1 covered by React's
  security-backport policy. Playwright 1.56.1: no known advisories; 5 minors
  behind, no backport channel (canon + chromium-1194 environment pin).
  vitest 3.2.7 = live v3 maintenance tag; tailwind 3.4.19 = upstream v3-lts
  tag. Deprecated-pattern greps for every pinned major: clean (verified by
  grep, not assumed). @types/node 26 vs Node 22 runtime — dev-only mismatch
  (BACKLOG Z-9).
- No major upgrades proposed — canon pins are constraints, not defects.

## Repo map deltas worth holding
- Bundle: single 3,645,900-byte JS chunk (measured, dist hash matches live
  deploy); rogue.glb 3,597,652 B; public/ total ~11.7MB (trees' bark normal
  map alone 2.3MB). No manualChunks configured (vite.config.ts:5-11).
  BACKLOG E-0 perf items.
- Canon-text gap CONFIRMED: Reset-loop retro/critique prompts have NO
  canonical question text in 03 (only the header parenthetical at 03:95) —
  wiring them would mean authoring canon by inference → PARKED K-1, STOP
  honored.
- Stale doc: phase0-canon-diff.md rider-queue section says "Queued… not yet
  posted" while all 5 riders are applied in canon (02:36,43,81 · 05:13,21) —
  correction is itself a canon-umbrella edit → PARKED K-11 as a proposed diff.
- The unsuffixed Pages alias serves an A3-era bundle (hash-verified,
  commit 16c1322); live alias is -sp4q. Z-12 documents; no deletion (Rule 9).
