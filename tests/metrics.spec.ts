// tests/metrics.spec.ts — pins the exact 02 formulas. Numbers here are canon;
// a rebalance that changes them must fail this suite loudly.

import { describe, expect, it } from 'vitest'
import {
  IMPORTANCE_WEIGHT,
  XP_INVALIDATED,
  XP_SIDE_QUEST,
  XP_VALIDATED,
  actionFraction,
  fieldAttemptTally,
  riskiest,
  tierOf,
  trough,
  truth,
  xp,
} from '../src/core/metrics'
import { withDefaults } from '../src/core/schema'
import type {
  Assumption,
  EvidenceEntry,
  FieldAttempt,
  QuestData,
  WeatherEntry,
} from '../src/core/schema'

let seq = 0

function assumption(over: Partial<Assumption> = {}): Assumption {
  seq += 1
  return {
    id: `a-${seq}`,
    statement: 'people will pay for this',
    originStageId: 's1',
    importance: 'wobbles',
    status: 'untested',
    killCriterion: 'fewer than 3 of 10 pay',
    createdAt: '2026-07-01T00:00:00.000Z',
    ...over,
  }
}

function evidence(over: Partial<EvidenceEntry> = {}): EvidenceEntry {
  seq += 1
  return {
    id: `e-${seq}`,
    tier: 2,
    text: 'they said it in their own words',
    source: 'interview',
    linkedAssumptionIds: [],
    stageId: 's1',
    date: '2026-07-02',
    ...over,
  }
}

function attempt(startedAt: string, over: Partial<FieldAttempt> = {}): FieldAttempt {
  seq += 1
  return {
    id: `att-${seq}`,
    slotId: 'slot-1',
    channel: 'call',
    startedAt,
    evidenceIds: [],
    origin: 'local',
    ...over,
  }
}

function weather(date: string, value: WeatherEntry['value']): WeatherEntry {
  seq += 1
  return { id: `w-${seq}`, date, value }
}

function data(over: Partial<QuestData> = {}): QuestData {
  return withDefaults(over)
}

describe('tierOf', () => {
  it('is 0 with no linked evidence', () => {
    const a = assumption()
    expect(tierOf(a, [])).toBe(0)
    // evidence exists but links a different assumption
    expect(tierOf(a, [evidence({ tier: 4, linkedAssumptionIds: ['someone-else'] })])).toBe(0)
  })

  it('is the max tier across evidence linked to the assumption', () => {
    const a = assumption({ id: 'a-x' })
    const pool = [
      evidence({ tier: 1, linkedAssumptionIds: ['a-x'] }),
      evidence({ tier: 3, linkedAssumptionIds: ['other', 'a-x'] }),
      evidence({ tier: 4, linkedAssumptionIds: ['other'] }), // not linked — ignored
    ]
    expect(tierOf(a, pool)).toBe(3)
  })
})

describe('truth', () => {
  it('is null when there are no assumptions, whatever else exists', () => {
    expect(truth(data())).toBeNull()
    expect(
      truth(
        data({
          milestones: { m1: true, m2: true },
          evidence: [evidence({ tier: 4, linkedAssumptionIds: ['ghost'] })],
          weather: [weather('2026-07-01', 1)],
        }),
      ),
    ).toBeNull()
  })

  it('uses exact weights dies=3, wobbles=2, shrugs=1', () => {
    expect(IMPORTANCE_WEIGHT.dies).toBe(3)
    expect(IMPORTANCE_WEIGHT.wobbles).toBe(2)
    expect(IMPORTANCE_WEIGHT.shrugs).toBe(1)

    const dies = assumption({ id: 'd1', importance: 'dies', status: 'validated' })
    const wobbles = assumption({ id: 'w1', importance: 'wobbles', status: 'untested' })
    const shrugs = assumption({ id: 's1', importance: 'shrugs', status: 'invalidated' })
    const d = data({
      assumptions: [dies, wobbles, shrugs],
      evidence: [
        evidence({ tier: 2, linkedAssumptionIds: ['d1'] }),
        evidence({ tier: 3, linkedAssumptionIds: ['s1'] }),
      ],
    })
    // (3 + 1) / (3 + 2 + 1) — invalidated counts toward Truth exactly like validated
    expect(truth(d)).toBe(4 / 6)
  })

  it('never moves on hunches: resolved with derived tier<2 contributes 0', () => {
    const d = data({
      assumptions: [
        assumption({ id: 'h1', importance: 'dies', status: 'validated' }), // tier 0
        assumption({ id: 'h2', importance: 'dies', status: 'invalidated' }),
      ],
      evidence: [evidence({ tier: 1, linkedAssumptionIds: ['h2'] })], // tier 1 hunch
    })
    expect(truth(d)).toBe(0)
  })

  it('requires resolution: tier≥2 evidence on an untested/testing assumption contributes 0', () => {
    const d = data({
      assumptions: [
        assumption({ id: 'u1', status: 'untested' }),
        assumption({ id: 't1', status: 'testing' }),
      ],
      evidence: [
        evidence({ tier: 4, linkedAssumptionIds: ['u1'] }),
        evidence({ tier: 3, linkedAssumptionIds: ['t1'] }),
      ],
    })
    expect(truth(d)).toBe(0)
  })

  it('counts tier exactly 2 (boundary)', () => {
    const d = data({
      assumptions: [assumption({ id: 'b1', importance: 'shrugs', status: 'validated' })],
      evidence: [evidence({ tier: 2, linkedAssumptionIds: ['b1'] })],
    })
    expect(truth(d)).toBe(1)
  })
})

describe('xp', () => {
  it('pins the 15/10 awards — invalidation pays exactly 1.5x validation', () => {
    expect(XP_INVALIDATED).toBe(15)
    expect(XP_VALIDATED).toBe(10)
    expect(XP_INVALIDATED / XP_VALIDATED).toBe(1.5)
    expect(XP_SIDE_QUEST).toBe(5)

    const invalidated = data({
      assumptions: [assumption({ id: 'i1', status: 'invalidated' })],
      evidence: [evidence({ tier: 2, linkedAssumptionIds: ['i1'] })],
    })
    const validated = data({
      assumptions: [assumption({ id: 'v1', status: 'validated' })],
      evidence: [evidence({ tier: 2, linkedAssumptionIds: ['v1'] })],
    })
    expect(xp(invalidated)).toBe(15)
    expect(xp(validated)).toBe(10)
    expect(xp(invalidated) / xp(validated)).toBe(1.5)
  })

  it('awards nothing for resolutions below tier 2 or for unresolved assumptions', () => {
    const d = data({
      assumptions: [
        assumption({ id: 'v1', status: 'validated' }), // tier 0
        assumption({ id: 'i1', status: 'invalidated' }),
        assumption({ id: 'u1', status: 'untested' }), // tier 3 but unresolved
      ],
      evidence: [
        evidence({ tier: 1, linkedAssumptionIds: ['i1'] }),
        evidence({ tier: 3, linkedAssumptionIds: ['u1'] }),
      ],
    })
    expect(xp(d)).toBe(0)
  })

  it('adds +5 per COMPLETED side quest only', () => {
    const d = data({
      sideQuests: {
        'sq-1': { text: 'shadow a checkout line', startedAt: '2026-07-01', completedAt: '2026-07-02' },
        'sq-2': { text: 'call three lapsed users', startedAt: '2026-07-03', completedAt: '2026-07-05' },
        'sq-3': { text: 'still in progress', startedAt: '2026-07-06' },
      },
    })
    expect(xp(d)).toBe(10)
  })

  it('sums assumptions and side quests: 15 + 10 + 5 = 30', () => {
    const d = data({
      assumptions: [
        assumption({ id: 'i1', importance: 'dies', status: 'invalidated' }),
        assumption({ id: 'v1', importance: 'shrugs', status: 'validated' }),
      ],
      evidence: [
        evidence({ tier: 2, linkedAssumptionIds: ['i1'] }),
        evidence({ tier: 4, linkedAssumptionIds: ['v1'] }),
      ],
      sideQuests: { 'sq-1': { text: 'done', startedAt: '2026-07-01', completedAt: '2026-07-02' } },
    })
    expect(xp(d)).toBe(30)
  })
})

describe('riskiest', () => {
  it('is null with no assumptions and null when all are resolved', () => {
    expect(riskiest(data())).toBeNull()
    expect(
      riskiest(
        data({
          assumptions: [
            assumption({ status: 'validated' }),
            assumption({ status: 'invalidated' }),
          ],
        }),
      ),
    ).toBeNull()
  })

  it('maximizes weight × (4 − tier) among untested|testing', () => {
    // shrugs tier 0 → 1×4 = 4 beats dies tier 3 → 3×1 = 3
    const d = data({
      assumptions: [
        assumption({ id: 'dies-t3', importance: 'dies', status: 'testing' }),
        assumption({ id: 'shrugs-t0', importance: 'shrugs', status: 'untested' }),
      ],
      evidence: [evidence({ tier: 3, linkedAssumptionIds: ['dies-t3'] })],
    })
    expect(riskiest(d)?.id).toBe('shrugs-t0')

    // at equal tier, weight decides: dies (12) over wobbles (8)
    const d2 = data({
      assumptions: [
        assumption({ id: 'w0', importance: 'wobbles' }),
        assumption({ id: 'd0', importance: 'dies' }),
      ],
    })
    expect(riskiest(d2)?.id).toBe('d0')
  })

  it('ignores resolved assumptions even at higher scores', () => {
    const d = data({
      assumptions: [
        assumption({ id: 'big', importance: 'dies', status: 'validated' }), // 12 but resolved
        assumption({ id: 'small', importance: 'shrugs', status: 'untested' }),
      ],
    })
    expect(riskiest(d)?.id).toBe('small')
  })

  it('breaks score ties by createdAt (earlier wins), independent of array order', () => {
    const early = assumption({ id: 'zz-early', createdAt: '2026-07-01T00:00:00.000Z' })
    const late = assumption({ id: 'aa-late', createdAt: '2026-07-05T00:00:00.000Z' })
    expect(riskiest(data({ assumptions: [early, late] }))?.id).toBe('zz-early')
    expect(riskiest(data({ assumptions: [late, early] }))?.id).toBe('zz-early')
  })

  it('breaks createdAt ties by id, independent of array order', () => {
    const at = '2026-07-01T00:00:00.000Z'
    const a = assumption({ id: 'a-tie', createdAt: at })
    const b = assumption({ id: 'b-tie', createdAt: at })
    expect(riskiest(data({ assumptions: [a, b] }))?.id).toBe('a-tie')
    expect(riskiest(data({ assumptions: [b, a] }))?.id).toBe('a-tie')
  })
})

describe('trough', () => {
  it('is false with no weather', () => {
    expect(trough(data())).toBe(false)
    expect(trough(data(), '2026-07-08')).toBe(false)
  })

  it('window of 1: mean is the value; boundary at exactly 2', () => {
    expect(trough(data({ weather: [weather('2026-07-01', 2)] }))).toBe(true)
    expect(trough(data({ weather: [weather('2026-07-01', 3)] }))).toBe(false)
  })

  it('window of 2', () => {
    expect(trough(data({ weather: [weather('2026-07-01', 1), weather('2026-07-02', 3)] }))).toBe(
      true, // mean 2
    )
    expect(trough(data({ weather: [weather('2026-07-01', 2), weather('2026-07-02', 4)] }))).toBe(
      false, // mean 3
    )
  })

  it('window of 3', () => {
    const low = [weather('2026-07-01', 1), weather('2026-07-02', 2), weather('2026-07-03', 3)]
    expect(trough(data({ weather: low }))).toBe(true) // mean exactly 2
    const high = [weather('2026-07-01', 2), weather('2026-07-02', 3), weather('2026-07-03', 3)]
    expect(trough(data({ weather: high }))).toBe(false) // mean 8/3
  })

  it('more than 3 entries: only the last 3 count', () => {
    const recoveredLately = [
      weather('2026-07-01', 1),
      weather('2026-07-02', 1),
      weather('2026-07-03', 1),
      weather('2026-07-04', 3),
      weather('2026-07-05', 3),
      weather('2026-07-06', 3),
    ]
    expect(trough(data({ weather: recoveredLately }))).toBe(false)

    const sankLately = [
      weather('2026-07-01', 5),
      weather('2026-07-02', 5),
      weather('2026-07-03', 5),
      weather('2026-07-04', 1),
      weather('2026-07-05', 1),
      weather('2026-07-06', 1),
    ]
    expect(trough(data({ weather: sankLately }))).toBe(true)
  })

  it('"last" is chronological by date, not insertion order', () => {
    // Newest entry stored first; naive last-3-of-array would read 1,1,1 → true.
    const d = data({
      weather: [
        weather('2026-07-07', 5),
        weather('2026-07-01', 1),
        weather('2026-07-02', 1),
        weather('2026-07-03', 1),
      ],
    })
    expect(trough(d)).toBe(false) // chronological last 3 = 1, 1, 5 → mean 7/3
  })
})

describe('fieldAttemptTally', () => {
  const today = '2026-07-08'

  it('is zero on an empty journal', () => {
    expect(fieldAttemptTally(data(), today)).toEqual({ total: 0, last7Days: 0 })
  })

  it('7-day trailing boundary: today and 6 days back are in; 7 days back is out', () => {
    const d = data({
      fieldJournal: {
        attempts: [
          attempt('2026-07-08T09:00:00.000Z'), // today — in
          attempt('2026-07-02T23:59:59.000Z'), // 6 days ago — in (boundary)
          attempt('2026-07-01T00:00:00.000Z'), // 7 days ago — out
          attempt('2026-06-15T12:00:00.000Z'), // long past — out
        ],
        imports: [],
      },
    })
    expect(fieldAttemptTally(d, today)).toEqual({ total: 4, last7Days: 2 })
  })

  it('total counts every attempt regardless of date', () => {
    const d = data({
      fieldJournal: {
        attempts: [attempt('2025-01-01T00:00:00.000Z'), attempt('2026-07-08T00:00:00.000Z')],
        imports: [],
      },
    })
    expect(fieldAttemptTally(d, today).total).toBe(2)
  })

  it('NEVER feeds Action: attempts change the tally, not actionFraction (or truth)', () => {
    const ids = ['m1', 'm2']
    const before = data({ milestones: { m1: true } })
    const after = data({
      milestones: { m1: true },
      fieldJournal: {
        attempts: [attempt('2026-07-08T09:00:00.000Z'), attempt('2026-07-07T09:00:00.000Z')],
        imports: [],
      },
    })
    expect(fieldAttemptTally(after, today).last7Days).toBe(2)
    expect(actionFraction(after, ids)).toBe(actionFraction(before, ids))
    expect(actionFraction(after, ids)).toBe(1 / 2)
    expect(truth(after)).toBe(truth(before)) // both null — attempts move nothing
  })
})

describe('actionFraction', () => {
  it('is raised milestones over total ids', () => {
    const d = data({ milestones: { m1: true, m2: false, m3: true } })
    // m4 never touched; m2 explicitly false — neither is raised
    expect(actionFraction(d, ['m1', 'm2', 'm3', 'm4'])).toBe(2 / 4)
    expect(actionFraction(d, ['m2', 'm4'])).toBe(0)
  })

  it('is 0 for an empty id list', () => {
    expect(actionFraction(data({ milestones: { m1: true } }), [])).toBe(0)
  })

  it('milestones never touch truth: toggling all leaves truth unchanged', () => {
    const ids = ['m1', 'm2', 'm3']
    const allRaised = Object.fromEntries(ids.map((id) => [id, true]))

    // with assumptions: truth identical before/after raising every milestone
    const assumptions = [
      assumption({ id: 'd1', importance: 'dies', status: 'validated' }),
      assumption({ id: 'w1', importance: 'wobbles', status: 'untested' }),
    ]
    const pool = [evidence({ tier: 2, linkedAssumptionIds: ['d1'] })]
    const down = data({ assumptions, evidence: pool })
    const up = data({ assumptions, evidence: pool, milestones: allRaised })
    expect(truth(down)).toBe(3 / 5)
    expect(truth(up)).toBe(3 / 5)
    expect(xp(up)).toBe(xp(down))

    // with none: still null even at full Action
    expect(truth(data({ milestones: allRaised }))).toBeNull()
    expect(actionFraction(data({ milestones: allRaised }), ids)).toBe(1)
  })
})
