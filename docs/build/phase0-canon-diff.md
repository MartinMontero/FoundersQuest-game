# Phase 0 canon diff — APPLIED (operator approval, 2026-07-08)

*Approved verbatim: items 1–8 plus the R-C clarifying line (snapshot = the compact journal as sent, in 02's Council mechanics). Applied in the same commit that marks this doc APPLIED. The i18n-queue coherence rider was NOT applied — queued for the next canon commit per the operator's approve-the-posted-text rule. Original proposed text below, preserved as the approval record.*

---

## Item 1 — `04-council.md`: the model-access offer string (new canonical copy)

Insert after the **Key failure** line:

```
- **Model access (offer):** "Your key works, but it doesn't have access to the Council's model. A fallback sage can read instead — same rite, a different voice. Each reading names the sage who spoke."
```

## Item 2 — `05-roadmap-decisions.md`: the fallback decision entry

Insert at the top of the decision log (above the 2026-07-08 BYOK entry):

```
- **2026-07-08 · Council model: `claude-fable-5` pinned primary; `claude-sonnet-4-6` fallback on model-access failure — player-accepted, readings labeled.** Extends the 2026-07-08 BYOK entry; further narrows "Fable 5 is enforced server-side only" (2026-07-05, already superseded). Some player keys cannot access the pinned model; a hard pin would dead-end them. On a model-access failure the game makes a one-tap offer of the fallback sage; the player's acceptance persists; every reading records and displays the model that produced it. No free model choice ships in the UI — this single ruled, labeled, player-accepted fallback is the only fork.
```

## Item 3 — `02-architecture.md`: routing for the third error class

Current (call-contract guards sentence):
> Guards client-side: JSON shape, 400KB input cap, thin-ink guard; 401/credit failures surface as the canonical key-failure string (player-fixable — check key or credit), network/5xx as the "not in session" string.

Proposed:
> Guards client-side: JSON shape, 400KB input cap, thin-ink guard; 401/credit failures surface as the canonical key-failure string (player-fixable — check key or credit), network/5xx as the "not in session" string; model-access failures surface the canonical model-access offer — one-tap fallback to `claude-sonnet-4-6`, acceptance persisted, readings record their model (05, 2026-07-08).

And the Environments-table Council row gains the fallback clause — current:
> …`claude-fable-5` pinned in client code; key device-side (localStorage w/ consent, removable), never serialized |

Proposed:
> …`claude-fable-5` pinned in client code (`claude-sonnet-4-6` labeled fallback on model-access failure, per 05); key device-side (localStorage w/ consent, removable), never serialized |

## Item 4 — `04-council.md`: cost transparency appended to the consent copy

Current:
> …Your journal may contain names and quotes from real people; that is worth knowing before it travels."

Proposed:
> …Your journal may contain names and quotes from real people; that is worth knowing before it travels. Each reading spends a little of your key's credit — about a journal in, a page out."

## Item 5 — `02-architecture.md`: `council[]` entries record their producer

Current (data model):
```
  lastLoop, council: [{ id, date, reading, commitment?, followups:[{q,a}],
            journal /*snapshot read*/, source:'live|pasted' }],
```
Proposed:
```
  lastLoop, council: [{ id, date, reading, commitment?, followups:[{q,a}],
            journal /*snapshot read*/, model /*producing model id*/, source:'live|pasted' }],
```

## Item 6 — `03-content-canon.md`: untagged-question header clause

Current header line ends:
> …hints omitted for budget; hints live in code and follow law 3.*

Proposed:
> …hints omitted for budget; hints live in code and follow law 3. No answer-type tag = plain prose input.*

## Item 7 — the greenfield 3D build ends artifact code parity (02 + named 05 entry)

**Why:** 02's Environments table says the standalone source is "byte-identical to the artifact until the i18n fork," and 05 rules the parity end must be "announced, not drifted into." A 3D R3F game cannot be byte-identical to a single-file JSX artifact. Re-opening requires naming the entry — this item does.

**7a — `02-architecture.md` Environments table, Source row.** Current:
> | Source | `founders-quest-v3.jsx` (single file) | Repo: `src/App.jsx` (byte-identical to the artifact **until the i18n fork**, which ends single-file parity) |

Proposed:
> | Source | `founders-quest-v3.jsx` (single file) | Repo: greenfield 3D game (Vite/TS/R3F). Code parity with the artifact ended by the 2026-07-08 game-build decision (05); the artifact remains the schema/content reference — data model, metrics, serializer, and Council prompt stay shared canon |

**7b — `02-architecture.md` Stack section.** Current:
> Vite 5 · React 18 · Tailwind 3.4 (core utilities + injected `QuestStyles` CSS: `text-2xs`=11px, z-layers, vault blur, reduced-motion) · lucide-react 0.383 · zero other runtime deps. Build verified: ~87KB gzipped JS. Constraints: no `<form>` tags; no `localStorage` outside the `makeStore` ladder; single default export; parity check = `npx esbuild src/App.jsx --loader:.jsx=jsx` + `npm run build`, both green after every change.

Proposed:
> Vite 5 · React 18 + React Three Fiber + drei + @react-three/rapier + Zustand (framework-free TS data core keeps the model swappable) · Tailwind 3.4 core + injected `QuestStyles` · lucide · TypeScript strict throughout. Constraints: no `<form>` tags; no `localStorage` outside the `makeStore` ladder; all copy in one strings module; runtime deps beyond this ruled stack require deps-review at the phase gate. Build size recorded per phase (grey-box 60fps target noted with hardware context).

**7c — `05-roadmap-decisions.md`, new decision entry** (below the two 2026-07-08 entries above, still newest-first):
```
- **2026-07-08 · The game build ends artifact code parity — announced, not drifted.** Re-opens, by name: "The artifact is the English-only dev sandbox after the i18n fork" (2026-07-05). The greenfield 3D game (Vite/TS/R3F per 02's amended stack) replaces `src/App.jsx`; byte-parity with `founders-quest-v3.jsx` ends now rather than at the i18n fork. The artifact stays the English-only sandbox and the schema/content reference: `founders-quest:v3`, the metrics, `buildJournalMd`, and `COUNCIL_SYSTEM_PROMPT` remain shared canon, byte-parity-tested where they exist in code.
```

## Item 8 — A-101 schema addendum to `02-architecture.md` (rides this same approval)

Exact diff and companion sentences per `docs/build/a101-field-mode-spec.md` §13: four new top-level keys (`huntList`, `fieldJournal`, `momentum`, `fieldDay`) appended to the data model block; one migration-note sentence; one Serialization sentence (Field journal section; Dinner exclusion unchanged); one Computed-metrics sentence (field-attempt tally displayed with Action; Action formula unchanged). Guardian-tier derivation untouched.

---

*Approval of this document authorizes one canon commit applying items 1–8 verbatim, with this file updated in the same commit to mark them APPLIED.*

---

## Queued for the NEXT canon commit (not yet posted for approval)

1. **i18n-queue coherence rider (05):** queue item 2's consequence line ("ends single-file `App.jsx`; artifact becomes en-only sandbox — requires explicit approval at Phase 0") is stale now that the 2026-07-08 parity-ending entry already did both; the rider re-words it to reference that entry.
2. **Settings-storage wording (02):** one sentence naming the pattern — settings (fallback acceptance, audio, future toggles) persist under their own storage key via the `makeStore` ladder, following the BYOK key precedent (game-design OQ 6; `founders-quest:settings` exists in code since Phase 1).
3. **Trail override reason (02):** the trail model line gains `reason?` — 01 already requires override reasons "logged to the trail" and the code/serializer render them; 02's data-model line should name the field (Phase 1 review finding).
4. **dinnerCard nullability (02):** `dinnerCard: { text, updatedAt } | null` — one-token amendment; null = no card yet (Phase 1 review finding).
5. **Scanner-endpoint ratification (05, decision-log note):** osv-scanner's own endpoints (api.osv.dev in CI; storage.googleapis.com offline DB locally) recorded as covered by the standing "osv-scanner and gitleaks" scanning sanction (Phase 1 review, operator ratification item).
