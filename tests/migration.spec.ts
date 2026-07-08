// tests/migration.spec.ts — v2 legacy READ-ONLY migration (canon 02).
import { describe, expect, it } from 'vitest'
import { EMPTY_DATA, LEGACY_V2_KEY, STORAGE_KEY, type QuestData } from '../src/core/schema'
import { migrateV2Data, migrateV2IfNeeded, type MigrationResult } from '../src/core/migration'
import { loadQuestData, makeStore, type QuestStore } from '../src/core/store'

/** A store wrapper that records every write, so read-only-ness of v2 is provable. */
function spyStore() {
  const base = makeStore(null)
  const sets: string[] = []
  const removes: string[] = []
  const store: QuestStore = {
    get: (key) => base.get(key),
    set: (key, value) => {
      sets.push(key)
      base.set(key, value)
    },
    remove: (key) => {
      removes.push(key)
      base.remove(key)
    },
    degraded: base.degraded,
  }
  /** seed without recording */
  const seed = (key: string, value: string) => {
    base.set(key, value)
  }
  return { store, sets, removes, seed }
}

function expectMigrated(result: MigrationResult): QuestData {
  if (!result.migrated) throw new Error(`expected migration, got skip: ${result.reason}`)
  return result.data
}

describe('migrateV2Data (pure mapper)', () => {
  it('maps v2 reflections → v3 fieldNotes', () => {
    const data = migrateV2Data({
      reflections: { 'stage-1': 'first note', 'stage-2': 'second note' },
    })
    expect(data.fieldNotes).toEqual({ 'stage-1': 'first note', 'stage-2': 'second note' })
  })

  it('drops non-string reflection values defensively', () => {
    const data = migrateV2Data({
      reflections: { 'stage-1': 'keep', 'stage-2': 42, 'stage-3': null, 'stage-4': { deep: true } },
    })
    expect(data.fieldNotes).toEqual({ 'stage-1': 'keep' })
  })

  it('NEVER migrates v2 milestone checks — empty map, changed criteria (02)', () => {
    const data = migrateV2Data({
      milestones: { 'm-1': true, 'm-2': true, 'm-3': false },
      reflections: { 'stage-1': 'note' },
    })
    expect(data.milestones).toEqual({})
    // and it is a fresh map, not the shared EMPTY_DATA reference
    expect(data.milestones).not.toBe(EMPTY_DATA.milestones)
  })

  it('carries shape-matching v3 keys over via withDefaults', () => {
    const answers = { 'stage-1': { 's1-q1': { text: 'an answer' } } }
    const weather = [{ id: 'w-1', date: '2026-07-01', value: 3 }]
    const data = migrateV2Data({
      answers,
      weather,
      vaultUnlocked: true,
      lastLoop: 'loop-9',
    })
    expect(data.answers).toEqual(answers)
    expect(data.weather).toEqual(weather)
    expect(data.vaultUnlocked).toBe(true)
    expect(data.lastLoop).toBe('loop-9')
  })

  it('drops keys whose shape does not match the v3 template', () => {
    const data = migrateV2Data({
      assumptions: 'not an array',
      evidence: { not: 'an array' },
      vaultUnlocked: 'yes', // not a boolean
      lastLoop: 7, // not string|null
      momentum: [1, 2], // not a record
    })
    expect(data.assumptions).toEqual([])
    expect(data.evidence).toEqual([])
    expect(data.vaultUnlocked).toBe(false)
    expect(data.lastLoop).toBeNull()
    expect(data.momentum).toEqual(EMPTY_DATA.momentum)
  })

  it('accepts null for nullable keys', () => {
    const data = migrateV2Data({ lastLoop: null, dinnerCard: null, dinnerSession: null })
    expect(data.lastLoop).toBeNull()
    expect(data.dinnerCard).toBeNull()
    expect(data.dinnerSession).toBeNull()
  })

  it('ignores unknown v2-only keys entirely', () => {
    const data = migrateV2Data({ someV2Thing: { legacy: true }, reflections: {} })
    expect(data).toEqual(EMPTY_DATA)
    expect('someV2Thing' in data).toBe(false)
  })

  it.each([null, undefined, 'a string', 42, true, [1, 2, 3]])(
    'unknown v2 shape %s → EMPTY_DATA copy, no throw',
    (garbage) => {
      expect(() => migrateV2Data(garbage)).not.toThrow()
      const data = migrateV2Data(garbage)
      expect(data).toEqual(EMPTY_DATA)
      expect(data).not.toBe(EMPTY_DATA)
    },
  )

  it('A-101 keys default into migrated data', () => {
    const data = migrateV2Data({ reflections: { 'stage-1': 'note' } })
    expect(data.huntList).toEqual({ profiles: [], slots: [] })
    expect(data.fieldJournal).toEqual({ attempts: [], imports: [] })
    expect(data.momentum).toEqual({ value: 0, lastAttemptDate: null, lastTickDate: null })
    expect(data.fieldDay).toEqual({ current: null, log: [] })
  })
})

describe('migrateV2IfNeeded (orchestrator)', () => {
  const V2_RECORD = {
    reflections: { 'stage-1': 'old reflection' },
    milestones: { 'm-1': true },
    answers: { 'stage-1': { 's1-q1': { text: 'kept' } } },
  }

  it('skips when v3 data already exists, leaving it untouched', () => {
    const { store, seed, sets, removes } = spyStore()
    const v3Raw = JSON.stringify({ ...EMPTY_DATA, lastLoop: 'loop-1' })
    seed(STORAGE_KEY, v3Raw)
    seed(LEGACY_V2_KEY, JSON.stringify(V2_RECORD))
    const result = migrateV2IfNeeded(store)
    expect(result).toEqual({ migrated: false, reason: 'v3-already-present' })
    expect(store.get(STORAGE_KEY)).toBe(v3Raw)
    expect(sets).toEqual([])
    expect(removes).toEqual([])
  })

  it('skips when no v2 data exists', () => {
    const { store, sets } = spyStore()
    const result = migrateV2IfNeeded(store)
    expect(result).toEqual({ migrated: false, reason: 'no-v2-data' })
    expect(sets).toEqual([])
  })

  it('corrupt v2 JSON → v2-unreadable, nothing written, no throw', () => {
    const { store, seed, sets, removes } = spyStore()
    seed(LEGACY_V2_KEY, '{ definitely not JSON')
    expect(() => migrateV2IfNeeded(store)).not.toThrow()
    const result = migrateV2IfNeeded(store)
    expect(result).toEqual({ migrated: false, reason: 'v2-unreadable' })
    expect(store.get(STORAGE_KEY)).toBeNull()
    expect(sets).toEqual([])
    expect(removes).toEqual([])
    // the unreadable v2 record itself is left in place
    expect(store.get(LEGACY_V2_KEY)).toBe('{ definitely not JSON')
  })

  it('non-object v2 JSON (array) → v2-unreadable', () => {
    const { store, seed } = spyStore()
    seed(LEGACY_V2_KEY, '[1,2,3]')
    expect(migrateV2IfNeeded(store)).toEqual({ migrated: false, reason: 'v2-unreadable' })
    expect(store.get(STORAGE_KEY)).toBeNull()
  })

  it('migrates: reflections→fieldNotes, milestone checks dropped, answers carried', () => {
    const { store, seed } = spyStore()
    seed(LEGACY_V2_KEY, JSON.stringify(V2_RECORD))
    const data = expectMigrated(migrateV2IfNeeded(store))
    expect(data.fieldNotes).toEqual({ 'stage-1': 'old reflection' })
    expect(data.milestones).toEqual({})
    expect(data.answers).toEqual(V2_RECORD.answers)
  })

  it('persists the migrated record under STORAGE_KEY (loadQuestData sees it)', () => {
    const { store, seed } = spyStore()
    seed(LEGACY_V2_KEY, JSON.stringify(V2_RECORD))
    const data = expectMigrated(migrateV2IfNeeded(store))
    expect(loadQuestData(store)).toEqual(data)
  })

  it('the v2 record is NEVER modified or deleted — byte-identical after migration', () => {
    const { store, seed, sets, removes } = spyStore()
    const rawV2 = JSON.stringify(V2_RECORD)
    seed(LEGACY_V2_KEY, rawV2)
    migrateV2IfNeeded(store)
    expect(store.get(LEGACY_V2_KEY)).toBe(rawV2)
    expect(removes).toEqual([])
    // the ONLY write is the v3 record
    expect(sets).toEqual([STORAGE_KEY])
  })

  it('a second run after migration skips with v3-already-present', () => {
    const { store, seed } = spyStore()
    seed(LEGACY_V2_KEY, JSON.stringify(V2_RECORD))
    expect(migrateV2IfNeeded(store).migrated).toBe(true)
    expect(migrateV2IfNeeded(store)).toEqual({ migrated: false, reason: 'v3-already-present' })
  })
})
