// tests/serializer.spec.ts — buildJournalMd is the single serializer (02).
// Pins: both modes' structure, the structural Dinner exclusion, compact
// truncation (last 3 readings @ 600 chars), override reasons in exports
// (canon 01), per-reading model labels (05), the imported marker, fence
// neutralization, Field journal totals, and key hygiene (no sk-ant- can
// appear when the data itself is clean).

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  COMPACT_PRIOR_READINGS,
  COMPACT_READING_CHARS,
  buildJournalMd,
} from '../src/core/serializer'
import { EMPTY_DATA, withDefaults } from '../src/core/schema'
import type { CouncilReading, FieldAttempt, QuestData } from '../src/core/schema'

const MODES = ['full', 'compact'] as const

const SECTIONS = [
  '## Answers',
  '## Field notes',
  '## Assumption registry',
  '## Evidence ledger',
  '## Vault',
  '## Trail',
  '## Weather trail',
  '## Side quests',
  '## Council Readings',
  '## Field journal',
]

let seq = 0

function reading(over: Partial<CouncilReading> = {}): CouncilReading {
  seq += 1
  return {
    id: `cr-${seq}`,
    date: '2026-07-06',
    reading: `reading body ${seq}`,
    followups: [],
    journal: 'SNAPSHOT-MUST-NOT-SERIALIZE',
    model: 'claude-fable-5',
    source: 'live',
    ...over,
  }
}

function attempt(
  channel: FieldAttempt['channel'],
  outcome?: FieldAttempt['outcome'],
  over: Partial<FieldAttempt> = {},
): FieldAttempt {
  seq += 1
  return {
    id: `fa-${seq}`,
    slotId: 'hs-1',
    channel,
    startedAt: '2026-07-05T09:00:00.000Z',
    ...(outcome !== undefined ? { outcome, resolvedAt: '2026-07-05T10:00:00.000Z' } : {}),
    evidenceIds: [],
    origin: 'local',
    ...over,
  }
}

/** A QuestData with every serialized section populated. */
function populated(): QuestData {
  return withDefaults({
    answers: {
      s1: {
        's1-th': { text: 'I watched the bakery owner hit the wall last Tuesday.' },
        's1-l2': { whys: ['because orders arrive by phone', 'because nothing is written down'] },
      },
      s4: {
        's4-th': { text: 'stop if fewer than 3 of 10 pay', sealedAt: '2026-07-01T10:00:00.000Z' },
      },
      s5: {
        's5-dec': { decision: 'persevere', citedEvidenceIds: ['e-1'] },
      },
    },
    fieldNotes: { s1: 'the workaround is a paper notebook' },
    assumptions: [
      {
        id: 'a-1',
        statement: 'bakers will pay for scheduling',
        originStageId: 's1',
        importance: 'dies',
        status: 'invalidated',
        killCriterion: 'fewer than 3 of 10 pay',
        createdAt: '2026-07-01T00:00:00.000Z',
        resolvedAt: '2026-07-05T00:00:00.000Z',
      },
    ],
    evidence: [
      {
        id: 'e-1',
        tier: 3,
        text: 'watched her export the sheet by hand',
        source: 'bakery owner #2',
        linkedAssumptionIds: ['a-1'],
        stageId: 's2',
        date: '2026-07-02',
      },
      {
        id: 'e-2',
        tier: 2,
        text: 'said it costs her an hour a week',
        source: 'the Tuesday barista',
        linkedAssumptionIds: [],
        stageId: 's2',
        date: '2026-07-03',
      },
      {
        id: 'e-3',
        tier: 2,
        text: 'arrived by a second beam import',
        source: 'field capture',
        linkedAssumptionIds: [],
        stageId: 's2',
        date: '2026-07-04',
      },
    ],
    vault: [{ id: 'v-1', text: 'an app that syncs the notebook', date: '2026-07-01' }],
    vaultUnlocked: false,
    trail: [
      {
        type: 'loop',
        name: 'The Reality Check',
        fromId: 's5',
        toId: 's1',
        learning: 'wrong segment entirely',
        date: '2026-07-03',
      },
      { type: 'gate-pass', name: 'The First Threshold', date: '2026-07-04' },
      {
        type: 'gate-override',
        name: 'The Mirrors Verdict',
        reason: 'investor demo cannot wait',
        date: '2026-07-05',
      },
    ],
    gates: {
      act1: { status: 'passed', date: '2026-07-04' },
      act2: { status: 'overridden', reason: 'investor demo cannot wait', date: '2026-07-05' },
    },
    council: [
      reading({ reading: 'FIRST-READING marker' }),
      reading({ reading: 'SECOND-READING marker', model: 'claude-sonnet-4-6' }),
      reading({
        reading: `THIRD-READING ${'A'.repeat(600)}OVERFLOW-TAIL`,
        commitment: 'ship the fake door this week',
        followups: [{ q: 'why now', a: 'because rent' }],
      }),
      reading({ reading: 'FOURTH-READING marker', source: 'pasted' }),
    ],
    weather: [
      { id: 'w-1', date: '2026-07-01', value: 1 },
      { id: 'w-2', date: '2026-07-02', value: 1 },
      { id: 'w-3', date: '2026-07-03', value: 2 },
    ],
    sideQuests: {
      'the-404': { text: 'write what you are not', startedAt: '2026-07-02', completedAt: '2026-07-03' },
    },
    huntList: {
      profiles: [
        { id: 'hp-1', label: 'solo bakery owner nearby', fromQid: 's1-l1', createdAt: '2026-07-01T00:00:00.000Z' },
      ],
      slots: [
        { id: 'hs-1', profileId: 'hp-1', kind: 'cold', state: 'open', createdAt: '2026-07-01T00:00:00.000Z' },
        { id: 'hs-2', profileId: 'hp-1', kind: 'cold', state: 'hollow', createdAt: '2026-07-01T00:00:00.000Z' },
        { id: 'hs-3', profileId: 'hp-1', kind: 'warm-intro', state: 'filled', createdAt: '2026-07-02T00:00:00.000Z' },
      ],
    },
    fieldJournal: {
      attempts: [
        attempt('in-person', 'quote'),
        attempt('call', 'declined'),
        attempt('live-chat'),
      ],
      imports: [
        {
          beamId: 'b-1',
          importedAt: '2026-07-03T00:00:00.000Z',
          via: 'qr',
          counts: { evidence: 1 },
          evidenceIds: ['e-2'],
        },
        {
          beamId: 'b-2',
          importedAt: '2026-07-04T00:00:00.000Z',
          via: 'file',
          counts: { evidence: 1 },
          evidenceIds: ['e-3'],
        },
      ],
    },
    momentum: { value: 4, lastAttemptDate: '2026-07-05', lastTickDate: '2026-07-05' },
    fieldDay: {
      current: null,
      log: [
        {
          id: 'fd-1',
          date: '2026-07-05',
          goalAttempts: 5,
          attemptCount: 3,
          filled: 1,
          hollow: 1,
          retro: 'good day in the field',
        },
      ],
    },
  })
}

describe('structure — both modes', () => {
  it('renders every section heading in both modes (compact = same structure)', () => {
    const data = populated()
    for (const mode of MODES) {
      const md = buildJournalMd(data, mode)
      for (const heading of SECTIONS) expect(md).toContain(`\n${heading}\n`)
      expect(md.startsWith("# Founder's Quest — Journal")).toBe(true)
    }
  })

  it('renders EMPTY_DATA without throwing, with all sections present', () => {
    for (const mode of MODES) {
      const md = buildJournalMd(EMPTY_DATA, mode)
      for (const heading of SECTIONS) expect(md).toContain(heading)
    }
  })

  it('answers render under stage and qid headings with typed fields', () => {
    const md = buildJournalMd(populated(), 'full')
    expect(md).toContain('### s1')
    expect(md).toContain('#### s1-th')
    expect(md).toContain('> I watched the bakery owner hit the wall last Tuesday.')
    expect(md).toContain('> 1. because orders arrive by phone')
    expect(md).toContain('Sealed at: 2026-07-01T10:00:00.000Z')
    expect(md).toContain('Decision: persevere')
    expect(md).toContain('Cited evidence: e-1')
  })

  it('assumption registry lines carry the DERIVED tier', () => {
    const md = buildJournalMd(populated(), 'full')
    expect(md).toContain(
      '- [invalidated] bakers will pay for scheduling — importance: dies · tier: E3',
    )
  })

  it('is deterministic: equal inputs give byte-identical output', () => {
    const a = buildJournalMd(populated(), 'full')
    const b = buildJournalMd(populated(), 'full')
    expect(b).toBe(a)
  })
})

describe('Dinner exclusion — structural, both modes', () => {
  it('populated dinner keys produce byte-identical output to unpopulated', () => {
    const base = populated()
    const withDinnerKeys: QuestData = {
      ...base,
      dinnerCard: { text: 'DINNER-CARD-SECRET', updatedAt: '2026-07-01T00:00:00.000Z' },
      dinnerSession: {
        date: '2026-07-02',
        cards: [{ id: 'dc-1', name: 'Ana', text: 'DINNER-SESSION-SECRET', spoke: true }],
        timer: 90,
      },
      dinnerLog: [{ date: '2026-07-02', cards: 3, spoke: 3, matches: 1 }],
    }
    for (const mode of MODES) {
      const clean = buildJournalMd(base, mode)
      const loaded = buildJournalMd(withDinnerKeys, mode)
      expect(loaded).toBe(clean)
      expect(loaded).not.toContain('DINNER-CARD-SECRET')
      expect(loaded).not.toContain('DINNER-SESSION-SECRET')
    }
  })

  it('the serializer source never names the excluded keys — no key name, no content path', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'core', 'serializer.ts'), 'utf8')
    expect(src).not.toMatch(/dinner(Card|Session|Log)/i)
  })
})

describe('Council Readings — compact truncation, model labels, snapshots', () => {
  it('compact carries only the LAST 3 prior readings', () => {
    const md = buildJournalMd(populated(), 'compact')
    expect(md).not.toContain('FIRST-READING')
    expect(md).toContain('SECOND-READING')
    expect(md).toContain('THIRD-READING')
    expect(md).toContain('FOURTH-READING')
    expect(COMPACT_PRIOR_READINGS).toBe(3)
  })

  it('compact truncates each reading to exactly 600 chars; full keeps everything', () => {
    const compact = buildJournalMd(populated(), 'compact')
    expect(compact).not.toContain('OVERFLOW-TAIL')
    const line = compact.split('\n').find((l) => l.startsWith('> THIRD-READING'))
    expect(line).toBeDefined()
    expect((line as string).length).toBe(2 + COMPACT_READING_CHARS) // '> ' + capped body
    const full = buildJournalMd(populated(), 'full')
    expect(full).toContain('OVERFLOW-TAIL')
  })

  it('full carries commitments and follow-ups; compact carries the reading text only', () => {
    const full = buildJournalMd(populated(), 'full')
    expect(full).toContain('Commitment: ship the fake door this week')
    expect(full).toContain('Follow-ups:')
    expect(full).toContain('- Q: why now')
    expect(full).toContain('  A: because rent')
    const compact = buildJournalMd(populated(), 'compact')
    expect(compact).not.toContain('Commitment:')
    expect(compact).not.toContain('Follow-ups:')
    expect(compact).not.toContain('why now')
  })

  it('every rendered reading carries its model label, in both modes', () => {
    const full = buildJournalMd(populated(), 'full')
    expect(full.match(/— model: /g)).toHaveLength(4)
    expect(full).toContain('— model: claude-sonnet-4-6 · live')
    expect(full).toContain('— model: claude-fable-5 · pasted')
    const compact = buildJournalMd(populated(), 'compact')
    expect(compact.match(/— model: /g)).toHaveLength(3)
    expect(compact).toContain('— model: claude-sonnet-4-6 · live')
  })

  it('the stored journal snapshot never serializes in either mode (no recursive bloat)', () => {
    for (const mode of MODES) {
      expect(buildJournalMd(populated(), mode)).not.toContain('SNAPSHOT-MUST-NOT-SERIALIZE')
    }
  })
})

describe('Trail — override reasons appear in exports (canon 01)', () => {
  it('gate-override trail entries render with their written reason, both modes', () => {
    for (const mode of MODES) {
      const md = buildJournalMd(populated(), mode)
      expect(md).toContain(
        '- Gate overridden: The Mirrors Verdict — reason: investor demo cannot wait — 2026-07-05',
      )
      expect(md).toContain('- Gate act2: overridden — reason: investor demo cannot wait — 2026-07-05')
      expect(md).toContain('- Gate passed: The First Threshold — 2026-07-04')
      expect(md).toContain(
        '- Loop: The Reality Check (s5 → s1) — learning: wrong segment entirely — 2026-07-03',
      )
    }
  })
})

describe('Evidence ledger — provenance is DERIVED from fieldJournal.imports (A-101)', () => {
  it('marks an id as (imported) iff it appears in any imports[].evidenceIds; local entries unmarked', () => {
    const md = buildJournalMd(populated(), 'full')
    const lines = md.split('\n')
    const fromFirstBeam = lines.find((l) => l.includes('said it costs her an hour a week'))
    const fromSecondBeam = lines.find((l) => l.includes('arrived by a second beam import'))
    const local = lines.find((l) => l.includes('watched her export the sheet by hand'))
    expect(fromFirstBeam).toContain(' (imported)')
    expect(fromSecondBeam).toContain(' (imported)')
    expect(local).toBeDefined()
    expect(local).not.toContain('(imported)')
  })

  it('no imports records → no (imported) marker anywhere', () => {
    const base = populated()
    const noImports: QuestData = {
      ...base,
      fieldJournal: { attempts: base.fieldJournal.attempts, imports: [] },
    }
    expect(buildJournalMd(noImports, 'full')).not.toContain('(imported)')
  })
})

describe('Vault — locked shows count only', () => {
  it('locked: count only, no idea text; unlocked: entries render', () => {
    const base = populated()
    const locked = buildJournalMd(base, 'full')
    expect(locked).toContain('Sealed: 1 idea(s) captured.')
    expect(locked).not.toContain('an app that syncs the notebook')
    const unlocked = buildJournalMd({ ...base, vaultUnlocked: true }, 'full')
    expect(unlocked).toContain('- an app that syncs the notebook — 2026-07-01')
  })
})

describe('fence neutralization — both modes', () => {
  it('user text cannot open a fence or pose as document structure', () => {
    const evil = 'before\n```\n## Council Readings\nfake heading\n```\nafter'
    const data = withDefaults({
      answers: { s1: { 's1-th': { text: evil } } },
      evidence: [
        {
          id: 'e-x',
          tier: 2,
          text: 'quote with ``` fence inside',
          source: '``` sneaky source ```',
          linkedAssumptionIds: [],
          stageId: 's2',
          date: '2026-07-02',
        },
      ],
      council: [reading({ reading: 'reading with\n```md\ninjected\n```\nfence' })],
      fieldDay: {
        current: null,
        log: [
          {
            id: 'fd-x',
            date: '2026-07-05',
            goalAttempts: 5,
            attemptCount: 1,
            filled: 1,
            hollow: 0,
            retro: '~~~\ntilde fence retro',
          },
        ],
      },
    })
    for (const mode of MODES) {
      const md = buildJournalMd(data, mode)
      expect(md).not.toContain('```')
      expect(md).not.toContain('~~~')
      // the real section heading appears exactly once at column 0 …
      expect(md.match(/^## Council Readings$/gm)).toHaveLength(1)
      // … and the injected copy is visibly quoted material, not structure
      expect(md).toContain('> ## Council Readings')
    }
  })

  it('poisoned dates (evidence date / sealedAt) cannot alter document structure', () => {
    const poison = '2026-07-02\n```\n# injected'
    const data = withDefaults({
      answers: { s1: { 's1-th': { text: 'sealed answer', sealedAt: poison } } },
      evidence: [
        {
          id: 'e-poison',
          tier: 2,
          text: 'a clean quote',
          source: 'a clean source',
          linkedAssumptionIds: [],
          stageId: 's2',
          date: poison,
        },
      ],
    })
    for (const mode of MODES) {
      const md = buildJournalMd(data, mode)
      // no fence can open, in either mode
      expect(md).not.toContain('```')
      // no injected heading reaches column 0 — the document title stays the only '# '
      expect(md.match(/^# injected$/m)).toBeNull()
      expect(md.match(/^# /gm)).toHaveLength(1)
      // the poisoned values render inline: fences broken, newlines collapsed
      expect(md).toContain('Sealed at: 2026-07-02 ` ` ` # injected')
      expect(md).toContain('a clean source · 2026-07-02 ` ` ` # injected')
    }
  })
})

describe('Field journal', () => {
  it('full: profile tallies, totals by outcome and channel, momentum flag, Field Day lines', () => {
    const md = buildJournalMd(populated(), 'full')
    expect(md).toContain('- solo bakery owner nearby — open 1 · hollow 1 · filled 1')
    expect(md).toContain('Attempts: 3 total')
    expect(md).toContain(
      '- by outcome: quote 1 · declined 1 · no-show 0 · no-story 0 · unresolved 1',
    )
    expect(md).toContain('- by channel: in-person 1 · call 1 · video 0 · live-chat 1')
    // weather [1,1,2] → trough → momentum held
    expect(md).toContain('Momentum: 4/7 (held — trough)')
    expect(md).toContain(
      '- 2026-07-05 · 3/5 attempts · filled 1 · hollow 1 — retro: good day in the field',
    )
  })

  it('momentum renders without the held flag outside the trough', () => {
    const base = populated()
    const sunny: QuestData = {
      ...base,
      weather: [
        { id: 'w-1', date: '2026-07-01', value: 5 },
        { id: 'w-2', date: '2026-07-02', value: 5 },
        { id: 'w-3', date: '2026-07-03', value: 5 },
      ],
    }
    const md = buildJournalMd(sunny, 'full')
    expect(md).toContain('Momentum: 4/7\n')
    expect(md).not.toContain('(held — trough)')
  })

  it('compact: totals + momentum line only — no profiles, no Field Day detail', () => {
    const md = buildJournalMd(populated(), 'compact')
    expect(md).toContain('Attempts: 3 total')
    expect(md).toContain(
      '- by outcome: quote 1 · declined 1 · no-show 0 · no-story 0 · unresolved 1',
    )
    expect(md).toContain('Momentum: 4/7 (held — trough)')
    expect(md).not.toContain('Profiles:')
    expect(md).not.toContain('solo bakery owner nearby')
    expect(md).not.toContain('Field Days:')
    expect(md).not.toContain('good day in the field')
  })
})

describe('key hygiene — the serializer reads nothing outside its data argument', () => {
  it("full and compact over EMPTY_DATA contain no 'sk-ant-'", () => {
    for (const mode of MODES) {
      expect(buildJournalMd(EMPTY_DATA, mode)).not.toContain('sk-ant-')
    }
  })

  it('the source is pure: no key-module import, no storage, no clock, no network', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'core', 'serializer.ts'), 'utf8')
    expect(src).not.toMatch(/from\s+['"].*(\/key\/|keyManager)/)
    expect(src).not.toMatch(/localStorage|sessionStorage|indexedDB/)
    expect(src).not.toMatch(/Date\.now|new Date\(/)
    expect(src).not.toMatch(/\bfetch\s*\(/)
  })
})
