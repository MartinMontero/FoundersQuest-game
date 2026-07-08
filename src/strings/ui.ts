// src/strings/ui.ts — UI chrome copy for the grey-box Stage 1 slice (Phase 2).
// ALL player-facing copy lives in src/strings; components import from here and
// render — no copy literals in components. Canon text stays in questions.ts
// (03 verbatim) and council.ts (04 byte-for-byte) — nothing here restates a
// question. Chrome below is authored UI copy; canon sources are cited where a
// line follows one.

import type { AssumptionStatus, EvidenceTier, Importance } from '../core/schema'
import type { Stage } from './questions'

// ---- Evidence tiers (canon 01: tier codes NEVER translate; tier names may) ----

export const TIER_CODES: Readonly<Record<EvidenceTier, string>> = {
  0: 'E0',
  1: 'E1',
  2: 'E2',
  3: 'E3',
  4: 'E4',
}

/** 01's mythic skin: Whisper / Rumor / Word / Deed / Gold. */
export const TIER_METALS: Readonly<Record<EvidenceTier, string>> = {
  0: 'Whisper',
  1: 'Rumor',
  2: 'Word',
  3: 'Deed',
  4: 'Gold',
}

/** e.g. "E2 Word" — the literal code first (never translates), its metal beside it. */
export function tierLabel(tier: EvidenceTier): string {
  return `${TIER_CODES[tier]} ${TIER_METALS[tier]}`
}

// ---- Canon vocabulary (02/03 words rendered as-is) ----

export const IMPORTANCE_ORDER: readonly Importance[] = ['dies', 'wobbles', 'shrugs']

export const IMPORTANCE_LABELS: Readonly<Record<Importance, string>> = {
  dies: 'dies',
  wobbles: 'wobbles',
  shrugs: 'shrugs',
}

export const STATUS_LABELS: Readonly<Record<AssumptionStatus, string>> = {
  untested: 'untested',
  testing: 'testing',
  validated: 'validated',
  invalidated: 'invalidated',
}

/** The 03 Stage 1 rule's solution words — the Vault nudge trigger list. */
export const VAULT_SOLUTION_WORDS: readonly string[] = [
  'app',
  'platform',
  'feature',
  'AI',
  'build',
  'tool',
  'SaaS',
]

// ---- Composition helpers (here so components hold zero copy literals) ----

/** e.g. "World 1 · The Problem — Swirling Nebula" (names verbatim from 03 via STAGES). */
export function stageBanner(stage: Stage): string {
  return `World ${stage.stage} · ${stage.name} — ${stage.world}`
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`
}

/** coin tally suffix, e.g. "×3" */
export function coinCount(count: number): string {
  return `×${count}`
}

// ---- Chrome copy ----

export const UI = {
  hud: {
    /** Truth LEADS the HUD (game-design §4) */
    truthLabel: 'Truth',
    /** shown while truth() is null — no guardians registered yet (02) */
    truthUnlit: 'unlit',
    /** shown while an unresolved guardian holds derived tier ≥ 2 — the meter
     * is waiting on a verdict, not broken (only resolution moves Truth, 02) */
    truthBanked: 'evidence banked — the verdict comes at the Mirror',
    actionLabel: 'Action',
    coinsLabel: 'Evidence coins',
  },
  trance: {
    answerLabel: 'Your answer',
    keysHint: 'Enter — newline · Ctrl+Enter — inscribe · Esc — stand up (draft kept)',
    inscribe: 'Inscribe',
    nameLabel: (n: number): string => `Name ${n}`,
    namesAdd: 'Add another name',
    whyLabel: (n: number): string => `Why ${n}`,
    whyRootLabel: (n: number): string => `Why ${n} — the root`,
    rootCaption: 'The root:',
    numberValueLabel: 'Number',
    numberUnitLabel: 'Unit',
    numberContextLabel: 'Context',
    /** warn, never block (gates warn, canon 01): the ink is still the founder's */
    numberCaution: "that doesn't read as a number — it can still be inscribed",
    listItemLabel: (n: number): string => `Line ${n}`,
    listAdd: 'Add a line',
    listRemoveLabel: (n: number): string => `Remove line ${n}`,
    quickaddEntryLabel: 'Something you know from direct observation',
    quickaddAdd: 'Add',
    quickaddRemoveLabel: (n: number): string => `Remove entry ${n}`,
    quickaddAffordance: 'This only works if ___',
    quickaddStatementPrefix: 'This only works if ',
    quickaddBlankLabel: 'this only works if…',
    importanceLabel: 'Importance',
    killCriterionLabel: 'Kill criterion',
    registerGuardian: 'Register as guardian',
    guardianRegistered: 'guardian registered',
  },
  vault: {
    /** gentle, dismissible, never blocks saving (03 Stage 1 rule; law 10) */
    nudgeText: 'That reads like a solution. The Vault can hold it while you stay with the problem.',
    nudgeCapture: 'Capture to the Vault',
    nudgeConfirm: 'Seal it in',
    nudgeDismiss: 'Keep writing',
    nudgeCaptured: 'Captured — sealed in the Vault. Your answer here is untouched.',
    panelTitle: 'The Vault',
    /** echoes canon 01: "captured, visible, and sealed" — unseals at Stage 3 */
    sealedLine: 'Captured, visible, and sealed until Stage 3. Capture always works; opening does not.',
    captureLabel: 'Capture an idea — no justification needed',
    countLabel: (n: number): string => (n === 1 ? '1 idea captured' : `${n} ideas captured`),
  },
  registry: {
    panelTitle: 'Assumption Registry',
    empty: 'No guardians stand yet.',
    riskiestBadge: 'Riskiest',
    killCriterionCaption: 'Kill criterion:',
    killCriterionEmpty: 'none written yet',
    createLegend: 'Register a guardian',
    statementLabel: 'Statement',
    importanceLabel: 'Importance',
    killCriterionLabel: 'Kill criterion',
    createButton: 'Register guardian',
    linkEvidenceToggle: 'Link E2 evidence',
    evidenceTextLabel: 'What was said',
    evidenceSourceLabel: 'Source',
    evidenceAdd: 'Log as E2',
  },
  shadow: {
    title: 'The Shadow',
    /** the exactly-one low-friction action: deep-link to the riskiest guardian */
    action: 'Face the riskiest guardian',
    dismiss: 'Not now',
  },
  banner: {
    /** the honest banner for the 02 storage-ladder memory fallback (wording authored here) */
    degraded:
      'Storage is unavailable on this device — this session lives in memory only, and nothing will survive a reload.',
  },
  onboarding: {
    movement: 'Move — WASD or arrow keys · Tab — cycle what is near · E or Enter — interact',
    interact: 'Walk to a shrine, press E.',
  },
  common: {
    close: 'Close',
    cancel: 'Cancel',
    metaSeparator: ' · ',
  },
} as const
