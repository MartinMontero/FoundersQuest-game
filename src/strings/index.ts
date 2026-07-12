// src/strings — ALL player-facing copy lives here; no string literals in components.
// questions.ts is verbatim from docs/canon/03-content-canon.md; council.ts is byte-for-byte
// from docs/canon/04-council.md (plus canon 01's never-translate invariants).
// tests/parity.spec.ts byte-compares both against the in-repo canon and fails on any drift.

export type { Question, QuestionTag, Stage, StageSection, ActGate, NamedLoop, SideQuest } from './questions'
export {
  STAGES,
  ACT_GATES,
  NAMED_LOOPS,
  NAMED_LOOPS_RULE,
  SIDE_QUESTS,
  SIDE_QUESTS_RULE,
  FAMILY_DINNER_ANNOTATION,
  FAMILY_DINNER_RULES,
  WEATHER_ANNOTATION,
  WEATHER_LABELS,
  WEATHER_TROUGH_RULE,
  HINTS,
} from './questions'
export { WORLD_COPY } from './world'
export { FIRST_LIGHT } from './firstlight'
export { CONFRONTATION, RITE } from './confrontation'
export { EGO } from './ego'
export { FIELD } from './field'
export { TEMPLE } from './temple'
export { AUDIO } from './audio'
// ui.ts is DOM-UI chrome only (Phase 2): tier metal skin, canon vocabulary labels,
// and authored panel/HUD copy — never question or Council text.
export {
  UI,
  TIER_CODES,
  TIER_METALS,
  tierLabel,
  IMPORTANCE_ORDER,
  IMPORTANCE_LABELS,
  STATUS_LABELS,
  VAULT_SOLUTION_WORDS,
  stageBanner,
  formatPercent,
  coinCount,
} from './ui'
export {
  COUNCIL_SYSTEM_PROMPT,
  KEY_COPY,
  CONSENT_COPY,
  COMMITMENT_GATE_COPY,
  STANDING_CAPTION,
  ERROR_NETWORK,
  ERROR_KEY_FAILURE,
  MODEL_ACCESS_OFFER,
  THIN_INK,
  COUNCIL_FAILURE_COPY,
  NEVER_TRANSLATE,
} from './council'
