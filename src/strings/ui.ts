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
  // ---- per-world trance controls (§2.1) — authored chrome, never canon text ----
  /** s2-th verbatim: paste five quotes, word for word; log a quote as E2 (04/02). */
  verbatim: {
    quoteLabel: (n: number): string => `Quote ${n}`,
    quoteAdd: 'Add another quote',
    logAsE2: 'Log as E2',
    sourceLabel: 'Who said it',
    logConfirm: 'Log the quote',
    logged: 'logged as E2 Word',
  },
  /** s3-l1 vault: open the Vault (unsealed at Stage 3), pick the idea that hits the root. */
  vaultPick: {
    prompt: 'Which captured idea attacks the root — not a symptom of it?',
    empty: 'The Vault holds nothing yet. Write the idea here instead.',
    fallbackLabel: 'Your answer',
    chooseLabel: (n: number): string => `Vault idea ${n}`,
  },
  /** s3-l2 ifthen: state the logic before building; register the IF as a guardian. */
  ifthen: {
    ifLabel: 'IF',
    thenLabel: 'THEN — when they meet it, we will observe',
    withinLabel: 'WITHIN (days)',
    importanceLabel: 'Importance',
    registerIf: 'Register the IF as a guardian',
    registered: 'the IF stands as a guardian',
  },
  /** s4-th seal: Ariadne's Thread — timestamped, locked, two-step confirm. */
  seal: {
    label: 'The result that makes you stop or pivot',
    seal: 'Seal it',
    confirm: 'Confirm — this locks',
    sealedCaption: "Sealed — Ariadne's Thread",
    sealedAt: (iso: string): string => `Sealed ${iso.slice(0, 10)}`,
    locked: 'Sealed and locked. It opens at the Mirror.',
  },
  /** s5-th verdict: open the seal, read it, rule yes/no before interpreting. */
  verdict: {
    sealedCaption: 'The thread you sealed:',
    noSeal: 'No thread was sealed at the Labyrinth.',
    question: 'Did the thread trigger?',
    yes: 'Yes — it triggered',
    no: 'No — it held',
  },
  /** s5-l5 registry: the funeral — mark a Stage-1 belief invalidated, take the XP. */
  funeral: {
    prompt: 'Which Stage-1 belief is now dead?',
    empty: 'No Stage-1 guardians stand to bury.',
    hold: 'Hold the funeral',
    confirm: 'Confirm the funeral',
    proven: 'Proven — this funeral pays full honors (1.5×).',
    unproven: 'Unproven funeral — no E2+ evidence stands behind it yet.',
    buried: 'buried',
  },
  /** s5-dec decision: pivot or persevere — locked until ≥1 evidence citation. */
  decision: {
    pivot: 'Pivot',
    persevere: 'Persevere',
    citePrompt: 'Cite the evidence that decides it:',
    noEvidence: 'No evidence to cite yet — log evidence, then decide.',
    cited: (n: number): string => (n === 1 ? '1 citation' : `${n} citations`),
    locked: 'Locked until you cite at least one piece of evidence.',
  },
  /** s8-th spine: the StoryBrand cast; an uncited beat renders [unproven] (A4 interim). */
  spine: {
    beatLabels: [
      'Once there was',
      'Every day',
      'Until one day',
      'Because of that',
      'Until finally',
    ] as const,
    beatPlaceholders: [
      'named customer',
      'struggle',
      'your work',
      'observed outcome',
      'transformation',
    ] as const,
    citePrompt: 'Cite the evidence your spine rests on:',
    noEvidence: 'No evidence cited — every beat casts as [unproven].',
    unproven: '[unproven]',
  },
  /** s3-joy / s8-l3 joy: name the one moment that makes them smile and tell a friend. */
  joy: {
    label: 'Name the moment',
    prompt: 'Design it on purpose.',
  },
  /** canon sequence locks — verdict-first at the Mirror (W5). */
  locks: {
    verdictFirst:
      'The Mirror will not answer until you rule on Ariadne’s Thread. Open the sealed verdict first — yes or no — before you interpret anything else.',
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
  founder: {
    /** the canon default when the player names nothing (operator ruling, 2026-07-10) */
    defaultName: 'founder',
    /** the naming card — one title for both first run and rename (operator copy, 2026-07-10) */
    namingTitle: 'Name your founder',
    namingPrompt: 'Make this quest your own! What shall we call you?',
    namingPlaceholder: 'founder',
    namingBegin: 'Begin the quest',
    namingSkip: 'Stay “founder”',
    /** the HUD identity line under/over the world banner */
    hudTitle: 'Founder',
    /** rename flow — the same card, re-opened from the HUD name (operator ask, 2026-07-10) */
    renameSave: 'Save name',
    renameCancel: 'Cancel',
    /** tooltip/label on the clickable HUD name */
    renameHint: 'Rename your founder',
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
