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
