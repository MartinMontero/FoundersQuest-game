# 02 · Architecture
*Current technical state. Update this file whenever a Claude Code task changes any of it.*

## Environments
| | claude.ai artifact | Standalone (production) |
|---|---|---|
| Role | English-only dev sandbox | The product, on Cloudflare Pages + custom domain |
| Source | `founders-quest-v3.jsx` (single file) | Repo: greenfield 3D game (Vite/TS/R3F). Code parity with the artifact ended by the 2026-07-08 game-build decision (05); the artifact remains the schema/content reference — data model, metrics, serializer, and Council prompt stay shared canon |
| Storage | `window.storage` | `localStorage` (probed in try/catch) → in-memory fallback + honest banner |
| Council | Direct `api.anthropic.com`, runtime-pinned `claude-sonnet-4-6`, no key | Direct `api.anthropic.com` from the browser with the **player's own key** (BYOK; CORS opt-in header), `claude-fable-5` pinned in client code (`claude-sonnet-4-6` labeled fallback on model-access failure, per 05); key device-side (localStorage w/ consent, removable), never serialized |
| Downloads | Platform interstitial (accepted; sandbox only) | Plain browser downloads |

## Stack
Vite 5 · React 18 + React Three Fiber + drei + @react-three/rapier + Zustand (framework-free TS data core keeps the model swappable) · Tailwind 3.4 core + injected `QuestStyles` · lucide · TypeScript strict throughout. Constraints: no `<form>` tags; no `localStorage` outside the `makeStore` ladder; all copy in one strings module; runtime deps beyond this ruled stack require deps-review at the phase gate. Build size recorded per phase (grey-box 60fps target noted with hardware context).

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
            journal /*snapshot read*/, model /*producing model id*/, source:'live|pasted' }],
  councilConsent, weather: [{ id, date, value:1-5 }],
  sideQuests: { [id]: { text, startedAt, completedAt } },
  dinnerCard: { text, updatedAt },
  dinnerSession: { date, cards:[{id,name,text,bucket,match,spoke}], timer } | null,
  dinnerLog: [{ date, cards, spoke, matches }],
  huntList: { profiles: [{ id, label /*a profile, never a person*/, fromQid:'s1-l1',
              createdAt, retiredAt? }],
              slots: [{ id, profileId, kind:'cold|warm-intro', spawnedByAttemptId?,
              state:'open|attempted|hollow|filled', createdAt, attemptedAt?,
              resolvedAt?, attemptId? }] },
  fieldJournal: { attempts: [{ id, slotId, channel:'in-person|call|video|live-chat',
              startedAt /*logged before outcome*/, outcome?:'quote|declined|no-show|no-story',
              resolvedAt?, evidenceIds[], rarity?:'common|rare|epic|legendary' /*display only*/,
              evolution?:{spawnedSlotId,note?}, fieldDayId?, origin:'local|import',
              importedAt?, beamId?, beamedAt? }],
              imports: [{ beamId, importedAt, via:'qr|file|paste', counts,
              evidenceIds[] /*ledger provenance badge is derived from here*/ }] },
  momentum: { value:0-7, lastAttemptDate, lastTickDate },  // cadence only; never Truth, XP,
                                                           // or the Action formula; the single
                                                           // stored source — the lantern
                                                           // renders this value
  fieldDay: { current: { id, date, goalAttempts, attemptIds[], startedAt, endedAt?,
              retro? } | null,
              log: [{ id, date, goalAttempts, attemptCount, filled, hollow, retro? }] }
}
```
Migration rule: v2 reflections → fieldNotes; v2 milestone *checks* do **not** migrate (changed criteria; a carried checkmark is a fabricated fact). New keys default in via `{ ...EMPTY_DATA, ...loaded }`. A-101 keys (`huntList`, `fieldJournal`, `momentum`, `fieldDay`) default in the same way.

## Computed metrics (exact)
- `tierOf(a)` = max tier of evidence linked to assumption `a`, else 0.
- **Truth** = Σ weight(resolved with tier≥2) / Σ weight; weights dies=3, wobbles=2, shrugs=1; `null` when no assumptions.
- **XP** = per assumption with tier≥2: invalidated +15, validated +10; plus +5 per completed Side Quest.
- **Riskiest guardian** = max weight × (4 − tier) among untested/testing. (Earned-hunch priority bump lands with the queued Earned Hunch task.)
- **Trough** = mean of last ≤3 weather values ≤ 2. Suppresses the Shadow; shows the normalizing banner; surfaces Side Quests.
- **Field-attempt tally** = derived count of `fieldJournal.attempts` (with 7-day trailing figure), displayed with Action; the Action formula itself is unchanged.

## Serialization
`buildJournalMd(data, mode)` is the **single serializer** for the Journal download and the Council's input. One documented divergence: `mode:'compact'` (Council input) includes only the last 3 prior readings, truncated to 600 chars, so readings never recursively bloat successors; `'full'` carries everything including follow-ups and commitments. **Family Dinner data is excluded from all serialization** — export exists only as the facilitator's explicit act inside the panel. Brief leads with `dinnerCard.text` ("Going wrong right now") when present. `buildJournalMd` adds a `## Field journal` section (compact = totals + momentum only); hollow attempts are Action-side tallies only; evidence from filled slots lives in `evidence[]` under existing rules; imported records are append-only, deduped by id, provenance rendered from `fieldJournal.imports`. Dinner exclusion unchanged.

## Council mechanics
BYOK key entry (once, device-side, visible remove control) → consent (once, stored) → live-record or pasted-journal tab → thin-ink guard (<3 answers + empty ledger) → reading saved with its journal snapshot (snapshot = the compact journal exactly as sent; durable follow-ups replay what the Council saw) → **commitment gate**: one required "thing I'll change" line before the follow-up box opens. Copy strings (key, consent, commitment, error, key-failure, caption, thin) are canon — see `04-council.md`.

## Council call contract (BYOK direct — supersedes the Pages Function per the 2026-07-08 decision; target state until the BYOK Council port ships, queued in `05`)
Browser `POST https://api.anthropic.com/v1/messages` with the player's key and the `anthropic-dangerous-direct-browser-access: true` CORS opt-in header. `model: claude-fable-5` (pinned in client code; no model choice ships in the UI), `max_tokens: 1000`. Guards client-side: JSON shape, 400KB input cap, thin-ink guard; 401/credit failures surface as the canonical key-failure string (player-fixable — check key or credit), network/5xx as the "not in session" string; model-access failures surface the canonical model-access offer — one-tap fallback to `claude-sonnet-4-6`, acceptance persisted, readings record their model (05, 2026-07-08). **Key storage:** its own storage key via the same storage ladder — never inside `founders-quest:v3`, never in `buildJournalMd`, never in any export; visible remove control. CSP `connect-src` allows exactly `'self'` + `https://api.anthropic.com`. **No server in the Council path — zero logging is structural, not policy.**
