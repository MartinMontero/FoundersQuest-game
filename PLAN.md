# PLAN — Phase 1: Core (2026-07-08)

Canon commit `530cfb0` applied; all Phase 1 blockers cleared. No server components exist to build.

## Ordered work

1. **Scaffold** — package.json (Vite 5, React 18, TS strict — the ruled 02 stack, Phase-1 subset), vite/tsconfig/eslint/vitest configs, minimal boot shell, `public/_headers` (CSP verbatim from 02), `.gitignore` additions. ESLint carries the structural rules: core purity (`no-restricted-imports` in `src/core/**`), no `<form>` JSX anywhere.
2. **src/core/schema.ts + store.ts + migration.ts** — `founders-quest:v3` types + `EMPTY_DATA` exactly per amended 02 (incl. `council[].model`, A-101 keys); `makeStore` ladder (localStorage probed → memory + degraded flag); v2 legacy read-only migration (reflections → fieldNotes; milestone checks never migrate; `{ ...EMPTY_DATA, ...loaded }` defaulting).
3. **src/core/metrics.ts** — `tierOf`, Truth (3/2/1 weights, null when empty), XP (+15/+10/+5), riskiest (max weight × (4 − tier)), trough (last-≤3 mean ≤ 2), field-attempt tally (7-day trailing; Action formula untouched). Exact 02 formulas.
4. **src/core/serializer.ts** — `buildJournalMd(data, mode)`: single serializer; compact = last 3 readings @ 600 chars; `## Field journal` section (compact = totals + momentum only); Dinner exclusion (all three keys absent from output; Brief-lead is a separate Phase 6 export); fence-neutralization for quoted text; readings carry their model label.
5. **src/transport/council.ts** — THE one file: `https://api.anthropic.com/v1/messages`, `anthropic-dangerous-direct-browser-access: true`, `max_tokens: 1000`, timeout via AbortController, error classification into the three canonical classes + model-access detection, model logic (fable-5 pinned; offer → accepted fallback `claude-sonnet-4-6` persisted via injected setting store; result carries producing model).
6. **src/key/keyManager.ts** — own storage key; consent-gated persist; session-only in-memory mode; remove/replace; no import path from serializer to key store.
7. **src/strings/** — question bank verbatim from 03 (57 ids + tags + milestones + gates + loops + side quests + weather); 04 copy byte-for-byte (key, consent+cost, commitment, caption, error, key-failure, model-access offer, thin-ink); `COUNCIL_SYSTEM_PROMPT` byte-exact to 04's blockquote; never-translate constants. Hints: placeholder empty (authored Phase 3 per kickoff).
8. **tests/** (vitest, node env) — metrics exactness incl. the 15/10 ratio; serializer modes/exclusions/fence/truncation; migration; key manager (consent order, session-only, remove); transport (classification table, pin, offer trigger, fallback persistence, labeling, header/endpoint/max_tokens); string parity byte-match vs docs/canon (03 questions, 04 copy, system prompt); key-scan proof (`sk-ant-` planted → absent from every serializer output); repo-guards (no `functions/`, `api.anthropic.com` in exactly one module).
9. **e2e/ scaffold** — Playwright config pinned `@playwright/test@1.56.x` (pre-baked chromium-1194), stub-fixtures module for both models + three error classes, boot smoke spec. Full game flows land Phase 2+.
10. **CI** — `.github/workflows/ci.yml`: npm ci · eslint · tsc · vitest · build · osv-scanner (online, CI network) · gitleaks (fetch-depth 0) · e2e job (R-D). Never Trivy; no telemetry.
11. **VERIFICATION.md** — first round with real command outputs; fix loop until green.

## Acceptance criteria

- `npm ci && npm run build` green; `tsc --noEmit` zero errors; eslint zero errors; `vitest run` all green locally.
- Parity fixtures byte-match in-repo canon (03/04) — any drift fails the suite.
- Key-scan proof green: planted `sk-ant-` key present in key store → absent from `buildJournalMd` both modes and all outputs.
- Transport unit-proves: exactly one endpoint constant; three error classes classified; fallback only on model-access; acceptance persists; every result labeled with its model.
- osv-scanner (offline flags locally) + gitleaks clean on the tree.
- CI workflow pushed; first GitHub Actions run checked via MCP and reported honestly (green or diagnosed).
- Deps-review table in the phase report.

## Non-goals (Phase 1)

No 3D/R3F, no Tailwind, no shrine inputs, no Council UI, no PWA/service worker, no QR vendoring, no assets, no game e2e flows — Phases 2–6 own those. No canon edits (queue holds two riders for the next canon commit). Transport is unit/stub-tested only; no real key exists anywhere (QA boundary).
