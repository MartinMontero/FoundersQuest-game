# 02 · Architecture
*Current technical state. Update this file whenever a Claude Code task changes any of it.*

## Environments
| | claude.ai artifact | Standalone (production) |
|---|---|---|
| Role | English-only dev sandbox | The product, on Cloudflare Pages + custom domain |
| Source | `founders-quest-v3.jsx` (single file) | Repo: `src/App.jsx` (byte-identical to the artifact **until the i18n fork**, which ends single-file parity) |
| Storage | `window.storage` | `localStorage` (probed in try/catch) → in-memory fallback + honest banner |
| Council | Direct `api.anthropic.com`, runtime-pinned `claude-sonnet-4-6`, no key | `POST /api/council` → Pages Function holds the key as a secret, **enforces `claude-fable-5` server-side**, logs no bodies |
| Downloads | Platform interstitial (accepted; sandbox only) | Plain browser downloads |

## Stack
Vite 5 · React 18 · Tailwind 3.4 (core utilities + injected `QuestStyles` CSS: `text-2xs`=11px, z-layers, vault blur, reduced-motion) · lucide-react 0.383 · zero other runtime deps. Build verified: ~87KB gzipped JS. Constraints: no `<form>` tags; no `localStorage` outside the `makeStore` ladder; single default export; parity check = `npx esbuild src/App.jsx --loader:.jsx=jsx` + `npm run build`, both green after every change.

## Data model (`founders-quest:v3`; legacy v2 key read-only for migration)
```
{
  milestones: { [id]: bool },                    // Action bar; self-reported
  answers: { [stageId]: { [qid]: { text?, whys[]?, ifPart?, thenPart?, withinDays?,
             sealedAt?, verdict?, decision?, citedEvidenceIds[] } } },
  fieldNotes: { [stageId]: string },             // v2 reflections migrated here
  assumptions: [{ id, statement, originStageId, importance:'dies|wobbles|shrugs',
                  status:'untested|testing|validated|invalidated', killCriterion,
                  createdAt, resolvedAt }],       // tier is DERIVED, never stored
  evidence: [{ id, tier:0-4, text, source, linkedAssumptionIds[], stageId, date }],
  vault: [{ id, text, date }],  vaultUnlocked: bool,
  trail: [{ type:'loop|gate-pass|gate-override', name, fromId?, toId?, learning?,
            critique?, date }],
  gates: { act1|act2|act3: { status:'passed|overridden', reason?, date } },
  lastLoop, council: [{ id, date, reading, commitment?, followups:[{q,a}],
            journal /*snapshot read*/, source:'live|pasted' }],
  councilConsent, weather: [{ id, date, value:1-5 }],
  sideQuests: { [id]: { text, startedAt, completedAt } },
  dinnerCard: { text, updatedAt },
  dinnerSession: { date, cards:[{id,name,text,bucket,match,spoke}], timer } | null,
  dinnerLog: [{ date, cards, spoke, matches }]
}
```
Migration rule: v2 reflections → fieldNotes; v2 milestone *checks* do **not** migrate (changed criteria; a carried checkmark is a fabricated fact). New keys default in via `{ ...EMPTY_DATA, ...loaded }`.

## Computed metrics (exact)
- `tierOf(a)` = max tier of evidence linked to assumption `a`, else 0.
- **Truth** = Σ weight(resolved with tier≥2) / Σ weight; weights dies=3, wobbles=2, shrugs=1; `null` when no assumptions.
- **XP** = per assumption with tier≥2: invalidated +15, validated +10; plus +5 per completed Side Quest.
- **Riskiest guardian** = max weight × (4 − tier) among untested/testing. (Earned-hunch priority bump lands with the queued Earned Hunch task.)
- **Trough** = mean of last ≤3 weather values ≤ 2. Suppresses the Shadow; shows the normalizing banner; surfaces Side Quests.

## Serialization
`buildJournalMd(data, mode)` is the **single serializer** for the Journal download and the Council's input. One documented divergence: `mode:'compact'` (Council input) includes only the last 3 prior readings, truncated to 600 chars, so readings never recursively bloat successors; `'full'` carries everything including follow-ups and commitments. **Family Dinner data is excluded from all serialization** — export exists only as the facilitator's explicit act inside the panel. Brief leads with `dinnerCard.text` ("Going wrong right now") when present.

## Council mechanics
Consent (once, stored) → live-record or pasted-journal tab → thin-ink guard (<3 answers + empty ledger) → reading saved with its journal snapshot (durable follow-ups replay full history) → **commitment gate**: one required "thing I'll change" line before the follow-up box opens. Copy strings (consent, error, caption, thin) are canon — see `04-council.md`.

## Pages Function contract (`functions/api/council.js`)
`POST { system, messages[] }` → `{ text }` | `{ error }`. Guards: JSON shape, 400KB message-size cap, 502 passthrough. Env: `ANTHROPIC_API_KEY` (secret, production-scoped), `COUNCIL_MODEL` (default `claude-fable-5`). **No request-body logging — design choice, not oversight.** GH-Pages variant: static build + external Worker + `window.COUNCIL_URL` + CORS.
