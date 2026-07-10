// tests/state.spec.ts — the zustand binding over the framework-free core.
// Every action round-trips through core save (spied); inscribeAnswer writes
// exact 02 fields; no action touches the key store; shouldSummonShadow
// truth-table incl. trough suppression and the 40pp boundary.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { truth, xp } from '../src/core/metrics'
import {
  LEGACY_V2_KEY,
  STORAGE_KEY,
  withDefaults,
  type Assumption,
  type AssumptionStatus,
  type EvidenceEntry,
  type Importance,
  type QuestData,
} from '../src/core/schema'
import { loadQuestData, type QuestStore } from '../src/core/store'
import {
  REGISTRY_POSITION,
  STAGE1_LAYOUT,
  STAGE1_MILESTONES,
  STAGE1_MILESTONE_IDS,
  VAULT_POSITION,
} from '../src/game/contracts'
import { KEY_STORAGE_KEY } from '../src/key/keyManager'
import { createQuestStore, evidenceBanked, tierCounts } from '../src/state/store'
import {
  SHADOW_DIVERGENCE_PP,
  SHADOW_MIN_ASSUMPTIONS,
  shouldSummonShadow,
} from '../src/state/tunables'
import { useUiStore } from '../src/state/ui'
import { STAGES } from '../src/strings'

const FIXED_NOW = '2026-07-08T12:00:00.000Z'

/** A QuestStore spy: records every get/set/remove so writes can be audited. */
function spyStore(degraded = false): QuestStore & {
  map: Map<string, string>
  sets: { key: string; value: string }[]
  removes: string[]
  gets: string[]
} {
  const map = new Map<string, string>()
  const sets: { key: string; value: string }[] = []
  const removes: string[] = []
  const gets: string[] = []
  return {
    map,
    sets,
    removes,
    gets,
    get(key) {
      gets.push(key)
      return map.get(key) ?? null
    },
    set(key, value) {
      sets.push({ key, value })
      map.set(key, value)
    },
    remove(key) {
      removes.push(key)
      map.delete(key)
    },
    degraded,
  }
}

function makeDeps(degraded = false) {
  const store = spyStore(degraded)
  let n = 0
  return {
    spy: store,
    deps: {
      store,
      now: () => FIXED_NOW,
      makeId: (prefix: string) => `${prefix}-${++n}`,
    },
  }
}

// ---- shadow truth-table builders ----

function guardian(
  id: string,
  importance: Importance = 'shrugs',
  status: AssumptionStatus = 'untested',
): Assumption {
  return {
    id,
    statement: `statement ${id}`,
    originStageId: 's1',
    importance,
    status,
    killCriterion: '',
    createdAt: '2026-07-01T00:00:00.000Z',
  }
}

function e2Linked(id: string, assumptionId: string): EvidenceEntry {
  return {
    id,
    tier: 2,
    text: 'their words',
    source: 'call',
    linkedAssumptionIds: [assumptionId],
    stageId: 's1',
    date: '2026-07-02',
  }
}

function dataWith(partial: Partial<QuestData>): QuestData {
  return { ...withDefaults(null), ...partial }
}

const FIVE_IDS = ['m1', 'm2', 'm3', 'm4', 'm5'] as const

describe('quest store hydration', () => {
  it('hydrates via loadQuestData at init', () => {
    const { spy, deps } = makeDeps()
    spy.map.set(
      STORAGE_KEY,
      JSON.stringify({ ...withDefaults(null), milestones: { 's1-m1': true } }),
    )
    const store = createQuestStore(deps)
    expect(store.getState().data.milestones['s1-m1']).toBe(true)
  })

  it('empty backend hydrates to EMPTY_DATA shape', () => {
    const { deps } = makeDeps()
    const store = createQuestStore(deps)
    expect(store.getState().data).toEqual(withDefaults(null))
  })

  it('surfaces the ladder degraded flag', () => {
    expect(createQuestStore(makeDeps(false).deps).getState().degraded).toBe(false)
    expect(createQuestStore(makeDeps(true).deps).getState().degraded).toBe(true)
  })

  it('a v2 record under founders-quest:v2 hydrates reflections into fieldNotes (ruled fix 3)', () => {
    const { spy, deps } = makeDeps()
    const rawV2 = JSON.stringify({
      reflections: { 'stage-1': 'old reflection', 'stage-2': 'kept too' },
      milestones: { 'm-1': true }, // checks NEVER migrate (02)
      answers: { s1: { 's1-th': { text: 'carried answer' } } },
    })
    spy.map.set(LEGACY_V2_KEY, rawV2)

    const store = createQuestStore(deps)

    // reflections landed in fieldNotes, through the app store's own hydration
    expect(store.getState().data.fieldNotes).toEqual({
      'stage-1': 'old reflection',
      'stage-2': 'kept too',
    })
    expect(store.getState().data.answers).toEqual({ s1: { 's1-th': { text: 'carried answer' } } })
    expect(store.getState().data.milestones).toEqual({})
    // the migrated record was persisted under STORAGE_KEY in the same init
    expect(loadQuestData(spy)).toEqual(store.getState().data)
    // the v2 record is untouched: byte-identical, never written to or removed
    expect(spy.map.get(LEGACY_V2_KEY)).toBe(rawV2)
    expect(spy.sets.map((s) => s.key)).toEqual([STORAGE_KEY])
    expect(spy.removes).toEqual([])
  })

  it('migration never overwrites an existing v3 record', () => {
    const { spy, deps } = makeDeps()
    const v3 = JSON.stringify({ ...withDefaults(null), fieldNotes: { s1: 'v3 note' } })
    spy.map.set(STORAGE_KEY, v3)
    spy.map.set(LEGACY_V2_KEY, JSON.stringify({ reflections: { s1: 'v2 note' } }))
    const store = createQuestStore(deps)
    expect(store.getState().data.fieldNotes).toEqual({ s1: 'v3 note' })
    expect(spy.sets).toEqual([]) // nothing written during hydration
  })

  it('the runtime degraded flag surfaces through commit (review 8e)', () => {
    const { spy, deps } = makeDeps()
    let degradedNow = false
    const failable: QuestStore = {
      get: (key) => spy.get(key),
      set: (key, value) => {
        if (degradedNow) return // swallowed post-probe write, ladder-style
        spy.set(key, value)
      },
      remove: (key) => spy.remove(key),
      get degraded() {
        return degradedNow
      },
    }
    const store = createQuestStore({ ...deps, store: failable })
    store.getState().toggleMilestone('s1-m1')
    expect(store.getState().degraded).toBe(false)
    degradedNow = true // the ladder's first swallowed setItem flips its flag…
    store.getState().toggleMilestone('s1-m2')
    // …and the very next commit surfaces it to the banner's selector
    expect(store.getState().degraded).toBe(true)
  })
})

describe('evidenceBanked (ruled fix 5 — the Truth meter waits honestly)', () => {
  it('true only while an UNRESOLVED guardian holds derived tier ≥ 2', () => {
    const g = guardian('g1')
    expect(evidenceBanked(dataWith({ assumptions: [g] }))).toBe(false) // tier 0
    expect(
      evidenceBanked(dataWith({ assumptions: [g], evidence: [e2Linked('e1', 'g1')] })),
    ).toBe(true) // untested + E2 = banked, waiting on the Mirror
    expect(
      evidenceBanked(
        dataWith({
          assumptions: [{ ...g, status: 'testing' as const }],
          evidence: [e2Linked('e1', 'g1')],
        }),
      ),
    ).toBe(true)
    expect(
      evidenceBanked(
        dataWith({
          assumptions: [{ ...g, status: 'validated' as const }],
          evidence: [e2Linked('e1', 'g1')],
        }),
      ),
    ).toBe(false) // resolved — Truth itself moves now, nothing is banked
    expect(evidenceBanked(dataWith({}))).toBe(false)
  })
})

describe('every action round-trips through core save, in the same call', () => {
  it('persists under STORAGE_KEY exactly once per action, matching in-memory state', () => {
    const { spy, deps } = makeDeps()
    const store = createQuestStore(deps)

    const actions: (() => void)[] = [
      () => store.getState().inscribeAnswer('s1', 's1-th', { text: 'saw Priya hit it' }),
      () => store.getState().captureVault('an app that…'),
      () =>
        store.getState().addGuardian({
          statement: 'cafés will pay',
          importance: 'dies',
          killCriterion: '3 of 5 decline',
          originStageId: 's1',
        }),
      () =>
        store.getState().addEvidence({
          tier: 2,
          text: 'word for word',
          source: 'call with Priya',
          linkedAssumptionIds: [],
          stageId: 's1',
        }),
      () => store.getState().toggleMilestone('s1-m1'),
    ]

    for (const act of actions) {
      const setsBefore = spy.sets.length
      act()
      // exactly one persist, in the same call
      expect(spy.sets.length).toBe(setsBefore + 1)
      const written = spy.sets[spy.sets.length - 1]
      expect(written?.key).toBe(STORAGE_KEY)
      // what was persisted IS the state — and it loads back through the core
      expect(JSON.parse(written?.value ?? '')).toEqual(store.getState().data)
      expect(loadQuestData(spy)).toEqual(store.getState().data)
    }
  })

  it('a second store over the same backend sees everything (v3 is the state of record)', () => {
    const { spy, deps } = makeDeps()
    const store = createQuestStore(deps)
    store.getState().inscribeAnswer('s1', 's1-l3', { text: '20 minutes, twice a week' })
    store.getState().captureVault('build a tool')
    const reloaded = createQuestStore({ ...deps, store: spy })
    expect(reloaded.getState().data).toEqual(store.getState().data)
  })
})

describe('inscribeAnswer writes exact 02 fields', () => {
  it('text-only answer holds exactly { text }', () => {
    const store = createQuestStore(makeDeps().deps)
    store.getState().inscribeAnswer('s1', 's1-th', { text: 'the story' })
    expect(store.getState().data.answers['s1']?.['s1-th']).toEqual({ text: 'the story' })
  })

  it('fivewhys answer holds exactly { whys } with five rungs', () => {
    const store = createQuestStore(makeDeps().deps)
    const whys = ['w1', 'w2', 'w3', 'w4', 'root']
    store.getState().inscribeAnswer('s1', 's1-l2', { whys })
    expect(store.getState().data.answers['s1']?.['s1-l2']).toEqual({ whys })
  })

  it('ifthen answer holds exactly { ifPart, thenPart, withinDays }', () => {
    const store = createQuestStore(makeDeps().deps)
    store.getState().inscribeAnswer('s3', 's3-l2', {
      ifPart: 'cafés lose stock weekly',
      thenPart: 'five owners request the sheet',
      withinDays: 7,
    })
    expect(store.getState().data.answers['s3']?.['s3-l2']).toEqual({
      ifPart: 'cafés lose stock weekly',
      thenPart: 'five owners request the sheet',
      withinDays: 7,
    })
  })

  it('merges into an existing answer without dropping earlier fields', () => {
    const store = createQuestStore(makeDeps().deps)
    store.getState().inscribeAnswer('s4', 's4-th', { text: 'stop if <2 sign-ups' })
    store.getState().inscribeAnswer('s4', 's4-th', { sealedAt: FIXED_NOW })
    expect(store.getState().data.answers['s4']?.['s4-th']).toEqual({
      text: 'stop if <2 sign-ups',
      sealedAt: FIXED_NOW,
    })
  })

  it('undefined fields are dropped, not written as keys', () => {
    const store = createQuestStore(makeDeps().deps)
    store.getState().inscribeAnswer('s1', 's1-fx', { text: 'no one works around it', whys: undefined })
    const answer = store.getState().data.answers['s1']?.['s1-fx']
    expect(answer).toEqual({ text: 'no one works around it' })
    expect(answer !== undefined && 'whys' in answer).toBe(false)
  })

  it('leaves other qids and other stages untouched', () => {
    const store = createQuestStore(makeDeps().deps)
    store.getState().inscribeAnswer('s1', 's1-th', { text: 'a' })
    store.getState().inscribeAnswer('s1', 's1-l1', { text: 'b' })
    store.getState().inscribeAnswer('s2', 's2-th', { text: 'c' })
    expect(store.getState().data.answers).toEqual({
      s1: { 's1-th': { text: 'a' }, 's1-l1': { text: 'b' } },
      s2: { 's2-th': { text: 'c' } },
    })
  })
})

describe('sealThread stamps text + sealedAt in one write (Ariadne, s4-th)', () => {
  it('writes { text, sealedAt } with the timestamp from the injected clock', () => {
    const { spy, deps } = makeDeps()
    const store = createQuestStore(deps)
    const before = spy.sets.length
    store.getState().sealThread('s4', 's4-th', 'stop if <2 sign-ups')
    expect(store.getState().data.answers['s4']?.['s4-th']).toEqual({
      text: 'stop if <2 sign-ups',
      sealedAt: FIXED_NOW,
    })
    // persists through core save in the same call (state of record = founders-quest:v3)
    expect(spy.sets.length).toBe(before + 1)
  })

  it('merges onto an existing answer without dropping earlier fields', () => {
    const store = createQuestStore(makeDeps().deps)
    store.getState().inscribeAnswer('s4', 's4-th', { verdict: 'no' })
    store.getState().sealThread('s4', 's4-th', 'the thread')
    expect(store.getState().data.answers['s4']?.['s4-th']).toEqual({
      verdict: 'no',
      text: 'the thread',
      sealedAt: FIXED_NOW,
    })
  })
})

describe('invalidateAssumption holds the funeral (s5-l5)', () => {
  it('flips status to invalidated and stamps resolvedAt from the clock', () => {
    const { spy, deps } = makeDeps()
    spy.map.set(STORAGE_KEY, JSON.stringify(dataWith({ assumptions: [guardian('g-1', 'dies')] })))
    const store = createQuestStore(deps)
    store.getState().invalidateAssumption('g-1')
    const a = store.getState().data.assumptions[0]
    expect(a?.status).toBe('invalidated')
    expect(a?.resolvedAt).toBe(FIXED_NOW)
  })

  it('is idempotent — an already-buried belief keeps its original resolvedAt', () => {
    const { spy, deps } = makeDeps()
    spy.map.set(
      STORAGE_KEY,
      JSON.stringify(
        dataWith({
          assumptions: [
            { ...guardian('g-1', 'dies', 'invalidated'), resolvedAt: '2020-01-01T00:00:00.000Z' },
          ],
        }),
      ),
    )
    const store = createQuestStore(deps)
    store.getState().invalidateAssumption('g-1')
    expect(store.getState().data.assumptions[0]?.resolvedAt).toBe('2020-01-01T00:00:00.000Z')
  })

  it('does not mutate the prior array and leaves other guardians untouched', () => {
    const { spy, deps } = makeDeps()
    spy.map.set(
      STORAGE_KEY,
      JSON.stringify(dataWith({ assumptions: [guardian('g-1'), guardian('g-2')] })),
    )
    const store = createQuestStore(deps)
    const prior = store.getState().data.assumptions
    store.getState().invalidateAssumption('g-1')
    const next = store.getState().data.assumptions
    expect(next).not.toBe(prior) // a new array — immutable update
    expect(prior[0]?.status).toBe('untested') // the prior snapshot is untouched
    expect(next[0]?.status).toBe('invalidated')
    expect(next[1]?.status).toBe('untested')
  })

  it('an unknown id is a no-op', () => {
    const { spy, deps } = makeDeps()
    spy.map.set(STORAGE_KEY, JSON.stringify(dataWith({ assumptions: [guardian('g-1')] })))
    const store = createQuestStore(deps)
    store.getState().invalidateAssumption('nope')
    expect(store.getState().data.assumptions[0]?.status).toBe('untested')
  })

  it('a proven funeral (linked E2) pays 1.5x XP (15) and moves Truth', () => {
    const { spy, deps } = makeDeps()
    spy.map.set(
      STORAGE_KEY,
      JSON.stringify(
        dataWith({ assumptions: [guardian('g-1', 'dies')], evidence: [e2Linked('e-1', 'g-1')] }),
      ),
    )
    const store = createQuestStore(deps)
    store.getState().invalidateAssumption('g-1')
    expect(xp(store.getState().data)).toBe(15) // invalidation pays 1.5x (15 vs 10)
    expect(truth(store.getState().data)).toBe(1) // the lone assumption, resolved with tier≥2
  })

  it('an unproven funeral (no E2 evidence) earns no XP and does not move Truth', () => {
    const { spy, deps } = makeDeps()
    spy.map.set(STORAGE_KEY, JSON.stringify(dataWith({ assumptions: [guardian('g-1', 'dies')] })))
    const store = createQuestStore(deps)
    store.getState().invalidateAssumption('g-1')
    expect(xp(store.getState().data)).toBe(0) // tier<2 resolution earns nothing
    expect(truth(store.getState().data)).toBe(0) // resolved, but tier<2 → numerator 0
  })
})

describe('sequence-lock actions (unlockVault / passGate / overrideGate / recordLoop)', () => {
  it('unlockVault flips the one-way flag; idempotent', () => {
    const { spy, deps } = makeDeps()
    const store = createQuestStore(deps)
    expect(store.getState().data.vaultUnlocked).toBe(false)
    store.getState().unlockVault()
    expect(store.getState().data.vaultUnlocked).toBe(true)
    const setsAfter = spy.sets.length
    store.getState().unlockVault() // no-op the second time
    expect(spy.sets.length).toBe(setsAfter) // idempotent — no redundant write
  })

  it('passGate records gates[id]=passed + a gate-pass trail entry', () => {
    const store = createQuestStore(makeDeps().deps)
    store.getState().passGate('act1', '⛩ Act I Gate — The First Threshold')
    const { data } = store.getState()
    expect(data.gates.act1).toEqual({ status: 'passed', date: FIXED_NOW })
    expect(data.trail).toEqual([
      { type: 'gate-pass', name: '⛩ Act I Gate — The First Threshold', date: FIXED_NOW },
    ])
  })

  it('overrideGate records the written reason to gates[id] AND the trail (logged, exported)', () => {
    const store = createQuestStore(makeDeps().deps)
    store.getState().overrideGate('act2', "⛩ Act II Gate — The Mirror's Verdict", 'shipping the demo; will backfill citations')
    const { data } = store.getState()
    expect(data.gates.act2).toEqual({
      status: 'overridden',
      reason: 'shipping the demo; will backfill citations',
      date: FIXED_NOW,
    })
    expect(data.trail[0]).toEqual({
      type: 'gate-override',
      name: "⛩ Act II Gate — The Mirror's Verdict",
      reason: 'shipping the demo; will backfill citations',
      date: FIXED_NOW,
    })
  })

  it('recordLoop appends a loop trail entry with the learning line and sets lastLoop', () => {
    const store = createQuestStore(makeDeps().deps)
    store.getState().recordLoop('The Reality Check', 5, 1, 'my sample was all friends — the yeses were politeness')
    const { data } = store.getState()
    expect(data.lastLoop).toBe('The Reality Check')
    expect(data.trail).toEqual([
      {
        type: 'loop',
        name: 'The Reality Check',
        fromId: 's5',
        toId: 's1',
        learning: 'my sample was all friends — the yeses were politeness',
        date: FIXED_NOW,
      },
    ])
  })

  it('gate/loop writes persist through core save and never touch the key store', () => {
    const { spy, deps } = makeDeps()
    const store = createQuestStore(deps)
    store.getState().passGate('act3', '⛩ Act III Gate — The Far Bank')
    expect(spy.sets.some((s) => s.key === STORAGE_KEY)).toBe(true)
    expect(spy.sets.some((s) => s.key === KEY_STORAGE_KEY)).toBe(false)
  })
})

describe('captureVault / addGuardian / addEvidence write exact 02 shapes', () => {
  it('captureVault appends { id, text, date } — nothing else, no justification field', () => {
    const store = createQuestStore(makeDeps().deps)
    const entry = store.getState().captureVault('a SaaS for this')
    expect(entry).toEqual({ id: 'vault-1', text: 'a SaaS for this', date: FIXED_NOW })
    store.getState().captureVault('second idea')
    expect(store.getState().data.vault).toEqual([
      { id: 'vault-1', text: 'a SaaS for this', date: FIXED_NOW },
      { id: 'vault-2', text: 'second idea', date: FIXED_NOW },
    ])
  })

  it('addGuardian pushes an untested assumption with NO tier field', () => {
    const store = createQuestStore(makeDeps().deps)
    const g = store.getState().addGuardian({
      statement: 'This only works if cafés track waste',
      importance: 'wobbles',
      killCriterion: 'ask 5; 4 do not track',
      originStageId: 's1',
    })
    expect(g).toEqual({
      id: 'guardian-1',
      statement: 'This only works if cafés track waste',
      originStageId: 's1',
      importance: 'wobbles',
      status: 'untested',
      killCriterion: 'ask 5; 4 do not track',
      createdAt: FIXED_NOW,
    })
    expect('tier' in g).toBe(false)
    expect(store.getState().data.assumptions).toEqual([g])
  })

  it('addEvidence pushes the exact 02 entry and copies linkedAssumptionIds', () => {
    const store = createQuestStore(makeDeps().deps)
    const linked = ['guardian-9']
    const e = store.getState().addEvidence({
      tier: 2,
      text: '"we lose a crate a week"',
      source: 'Priya, call',
      linkedAssumptionIds: linked,
      stageId: 's1',
    })
    expect(e).toEqual({
      id: 'evidence-1',
      tier: 2,
      text: '"we lose a crate a week"',
      source: 'Priya, call',
      linkedAssumptionIds: ['guardian-9'],
      stageId: 's1',
      date: FIXED_NOW,
    })
    linked.push('intruder')
    expect(store.getState().data.evidence[0]?.linkedAssumptionIds).toEqual(['guardian-9'])
  })

  it('tierCounts tallies coins per tier', () => {
    const store = createQuestStore(makeDeps().deps)
    store.getState().addEvidence({ tier: 0, text: 'a', source: 's', linkedAssumptionIds: [], stageId: 's1' })
    store.getState().addEvidence({ tier: 2, text: 'b', source: 's', linkedAssumptionIds: [], stageId: 's1' })
    store.getState().addEvidence({ tier: 2, text: 'c', source: 's', linkedAssumptionIds: [], stageId: 's1' })
    expect(tierCounts(store.getState().data)).toEqual({ 0: 1, 1: 0, 2: 2, 3: 0, 4: 0 })
  })
})

describe('toggleMilestone', () => {
  it('raises then lowers, and never moves Truth', () => {
    const store = createQuestStore(makeDeps().deps)
    store.getState().toggleMilestone('s1-m1')
    expect(store.getState().data.milestones['s1-m1']).toBe(true)
    expect(truth(store.getState().data)).toBeNull() // no assumptions — meter stays unlit
    store.getState().toggleMilestone('s1-m1')
    expect(store.getState().data.milestones['s1-m1']).toBe(false)
  })
})

describe('no action touches the key store', () => {
  it('every write in a full action sweep lands on STORAGE_KEY only', () => {
    const { spy, deps } = makeDeps()
    const store = createQuestStore(deps)
    store.getState().inscribeAnswer('s1', 's1-th', { text: 't' })
    store.getState().captureVault('v')
    store.getState().addGuardian({
      statement: 's',
      importance: 'dies',
      killCriterion: 'k',
      originStageId: 's1',
    })
    store.getState().addEvidence({ tier: 3, text: 'e', source: 'src', linkedAssumptionIds: [], stageId: 's1' })
    store.getState().toggleMilestone('s1-m1')

    expect(spy.sets.length).toBeGreaterThan(0)
    expect(spy.sets.every((s) => s.key === STORAGE_KEY)).toBe(true)
    expect(spy.removes).toEqual([])
    const touched = [...spy.sets.map((s) => s.key), ...spy.gets, ...spy.removes]
    expect(touched).not.toContain(KEY_STORAGE_KEY)
    expect([...spy.map.keys()]).toEqual([STORAGE_KEY])
  })
})

describe('shouldSummonShadow truth table', () => {
  const threeUntested = [guardian('a'), guardian('b'), guardian('c')]

  it('false below the assumption floor, even at 100pp divergence', () => {
    const data = dataWith({
      assumptions: [guardian('a'), guardian('b')], // 2 < SHADOW_MIN_ASSUMPTIONS
      milestones: { m1: true, m2: true, m3: true, m4: true, m5: true },
    })
    expect(SHADOW_MIN_ASSUMPTIONS).toBe(3)
    expect(shouldSummonShadow(data, FIVE_IDS)).toBe(false)
  })

  it('true at exactly the 40pp boundary (Action 40, Truth 0)', () => {
    const data = dataWith({
      assumptions: threeUntested,
      milestones: { m1: true, m2: true }, // 2/5 = 40pp
    })
    expect(SHADOW_DIVERGENCE_PP).toBe(40)
    expect(shouldSummonShadow(data, FIVE_IDS)).toBe(true)
  })

  it('false just below the boundary (Action 20, Truth 0)', () => {
    const data = dataWith({
      assumptions: threeUntested,
      milestones: { m1: true }, // 1/5 = 20pp
    })
    expect(shouldSummonShadow(data, FIVE_IDS)).toBe(false)
  })

  it('Truth catching up closes the gap: Action 100 − Truth 60 = 40 summons; Truth 80 does not', () => {
    const five = ['a', 'b', 'c', 'd', 'e'].map((id) => guardian(id))
    const validated = (n: number): Assumption[] =>
      five.map((g, i) => (i < n ? { ...g, status: 'validated' as const } : g))
    const evidenceFor = (n: number): EvidenceEntry[] =>
      five.slice(0, n).map((g, i) => e2Linked(`e${i}`, g.id))
    const raisedAll = { m1: true, m2: true, m3: true, m4: true, m5: true }

    const at60 = dataWith({ assumptions: validated(3), evidence: evidenceFor(3), milestones: raisedAll })
    expect(shouldSummonShadow(at60, FIVE_IDS)).toBe(true) // 100 − 60 = 40pp

    const at80 = dataWith({ assumptions: validated(4), evidence: evidenceFor(4), milestones: raisedAll })
    expect(shouldSummonShadow(at80, FIVE_IDS)).toBe(false) // 100 − 80 = 20pp
  })

  it('never in the trough — same divergence, weather mean ≤ 2 suppresses', () => {
    const summoning = {
      assumptions: threeUntested,
      milestones: { m1: true, m2: true, m3: true, m4: true, m5: true },
    }
    const weather = (values: (1 | 2 | 3 | 4 | 5)[]) =>
      values.map((value, i) => ({ id: `w${i}`, date: `2026-07-0${i + 1}`, value }))

    expect(shouldSummonShadow(dataWith({ ...summoning, weather: weather([2, 2, 2]) }), FIVE_IDS)).toBe(false)
    expect(shouldSummonShadow(dataWith({ ...summoning, weather: weather([5, 5, 5]) }), FIVE_IDS)).toBe(true)
  })

  it('defaults to the Stage-1 milestone ids when none are passed', () => {
    const raised: Record<string, boolean> = {}
    for (const id of STAGE1_MILESTONE_IDS) raised[id] = true
    expect(shouldSummonShadow(dataWith({ assumptions: threeUntested, milestones: raised }))).toBe(true)
    expect(shouldSummonShadow(dataWith({ assumptions: threeUntested }))).toBe(false)
  })
})

describe('STAGE1_LAYOUT contract', () => {
  const stage1 = STAGES.find((s) => s.stage === 1)

  it('milestone ids derive as s1-m1..m3 in 03 milestone order', () => {
    expect(STAGE1_MILESTONE_IDS).toEqual(['s1-m1', 's1-m2', 's1-m3'])
    expect(STAGE1_MILESTONES.map((m) => m.label)).toEqual(stage1?.milestones)
  })

  it('places a shrine for all 8 s1 qids, 3 flagpoles, one vault, one registry', () => {
    const shrines = STAGE1_LAYOUT.filter((s) => s.kind === 'shrine')
    expect(shrines.map((s) => s.qid)).toEqual(stage1?.questions.map((q) => q.id))
    expect(shrines).toHaveLength(8)

    const flags = STAGE1_LAYOUT.filter((s) => s.kind === 'flagpole')
    expect(flags.map((f) => f.milestoneId)).toEqual([...STAGE1_MILESTONE_IDS])

    expect(STAGE1_LAYOUT.filter((s) => s.kind === 'vault').map((s) => s.position)).toEqual([
      VAULT_POSITION,
    ])
    expect(STAGE1_LAYOUT.filter((s) => s.kind === 'registry').map((s) => s.position)).toEqual([
      REGISTRY_POSITION,
    ])
  })

  it('ids are unique and every spec has a 3-tuple position', () => {
    const ids = STAGE1_LAYOUT.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const spec of STAGE1_LAYOUT) {
      expect(spec.position).toHaveLength(3)
      expect(spec.position.every((n) => Number.isFinite(n))).toBe(true)
    }
  })
})

describe('ui store (ephemeral)', () => {
  beforeEach(() => {
    useUiStore.setState(useUiStore.getInitialState(), true)
  })

  it('boots in roam with the shadow hidden', () => {
    const s = useUiStore.getState()
    expect(s.mode).toBe('roam')
    expect(s.activeQid).toBeNull()
    expect(s.shadow).toEqual({ visible: false, quote: '', action: '' })
  })

  it('enterTrance / exitTrance manage mode and activeQid', () => {
    useUiStore.getState().enterTrance('s1-l2')
    expect(useUiStore.getState().mode).toBe('trance')
    expect(useUiStore.getState().activeQid).toBe('s1-l2')
    useUiStore.getState().exitTrance()
    expect(useUiStore.getState().mode).toBe('roam')
    expect(useUiStore.getState().activeQid).toBeNull()
  })

  it('openPanel / closePanel and setMode', () => {
    useUiStore.getState().openPanel('panel:vault')
    expect(useUiStore.getState().mode).toBe('panel:vault')
    useUiStore.getState().closePanel()
    expect(useUiStore.getState().mode).toBe('roam')
    useUiStore.getState().setMode('panel:registry')
    expect(useUiStore.getState().mode).toBe('panel:registry')
  })

  it('summonShadow / dismissShadow', () => {
    useUiStore.getState().summonShadow('your own words', 'kneel at the kill criterion')
    expect(useUiStore.getState().shadow).toEqual({
      visible: true,
      quote: 'your own words',
      action: 'kneel at the kill criterion',
    })
    useUiStore.getState().dismissShadow()
    expect(useUiStore.getState().shadow).toEqual({ visible: false, quote: '', action: '' })
  })

  it('is structurally unpersisted: no storage import exists in the module', () => {
    const source = readFileSync(join(__dirname, '..', 'src', 'state', 'ui.ts'), 'utf8')
    expect(source).not.toMatch(/makeStore|saveQuestData|loadQuestData|localStorage|STORAGE_KEY/)
  })
})
