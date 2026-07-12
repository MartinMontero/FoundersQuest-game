// tests/field.spec.ts — Field Mode's binding accounting contract (A-101 §3).
// A1 exact writes · A2 hollow-is-Action-only · A3 nothing touches Truth ·
// A4 zero field XP · logged-BEFORE-outcome is structural.

import { describe, expect, it } from 'vitest'
import { actionFraction, fieldAttemptTally, truth, xp } from '../src/core/metrics'
import { STORAGE_KEY, withDefaults, type QuestData } from '../src/core/schema'
import type { QuestStore } from '../src/core/store'
import { createQuestStore } from '../src/state/store'

const NOW = '2026-07-12T12:00:00.000Z'

function makeStore(seed: Partial<QuestData> = {}) {
  const map = new Map<string, string>()
  const persistence: QuestStore = {
    get: (k) => map.get(k) ?? null,
    set: (k, v) => void map.set(k, v),
    remove: (k) => void map.delete(k),
    degraded: false,
  }
  map.set(STORAGE_KEY, JSON.stringify({ ...withDefaults(null), ...seed }))
  let n = 0
  const store = createQuestStore({
    store: persistence,
    now: () => NOW,
    makeId: (p: string) => `${p}-${++n}`,
  })
  return { store, read: () => withDefaults(JSON.parse(map.get(STORAGE_KEY) ?? '{}')) }
}

describe('A-101 accounting contract', () => {
  it('A1 — startAttempt writes EXACTLY attempt + slot + momentum + field-day', () => {
    const { store, read } = makeStore()
    const s = store.getState
    s().addHuntProfile('ops leads at 20-50p startups')
    const before = read()
    const slotId = before.huntList.slots[0]?.id ?? ''
    const attempt = s().startAttempt(slotId, 'call')
    expect(attempt).not.toBeNull()
    const after = read()
    // the ONLY deltas: fieldJournal.attempts, huntList.slots, momentum
    expect(after.fieldJournal.attempts).toHaveLength(1)
    expect(after.huntList.slots[0]?.state).toBe('attempted')
    expect(after.momentum.value).toBe(1)
    expect(after.momentum.lastAttemptDate).toBe(NOW)
    const untouched: (keyof QuestData)[] = [
      'evidence', 'assumptions', 'milestones', 'vault', 'trail', 'gates',
      'weather', 'sideQuests', 'calibration', 'confrontations', 'funerals',
      'wisdomCodex', 'council',
    ]
    for (const key of untouched) expect(after[key]).toEqual(before[key])
  })

  it('structural: an attempt is born unresolvable — outcome only via resolveAttempt', () => {
    const { store, read } = makeStore()
    const s = store.getState
    s().addHuntProfile('p')
    const slotId = read().huntList.slots[0]?.id ?? ''
    const attempt = s().startAttempt(slotId, 'in-person')
    expect(attempt?.outcome).toBeUndefined()
    expect(attempt?.startedAt).toBe(NOW)
    s().resolveAttempt('never-started', 'quote') // unknown id: no-op
    expect(read().fieldJournal.attempts[0]?.outcome).toBeUndefined()
  })

  it('A2 — hollow counts on the Action SIDE only; the formula is untouched', () => {
    const { store, read } = makeStore()
    const s = store.getState
    s().addHuntProfile('p')
    const slotId = read().huntList.slots[0]?.id ?? ''
    const a = s().startAttempt(slotId, 'call')
    s().resolveAttempt(a?.id ?? '', 'declined') // a rejection still fills the slot
    const data = read()
    expect(data.huntList.slots[0]?.state).toBe('hollow')
    expect(fieldAttemptTally(data, '2026-07-12').total).toBe(1)
    expect(actionFraction(data, ['m1', 'm2'])).toBe(0) // formula unchanged
    expect(data.milestones).toEqual({}) // never auto-checked
  })

  it('A3 — nothing in Field Mode creates evidence or moves Truth', () => {
    const { store, read } = makeStore({
      assumptions: [{
        id: 'g1', statement: 's', originStageId: 's1', importance: 'dies',
        status: 'untested', killCriterion: 'k', createdAt: NOW,
      }],
    })
    const s = store.getState
    const truthBefore = truth(read())
    s().addHuntProfile('p')
    const slotId = read().huntList.slots[0]?.id ?? ''
    const a = s().startAttempt(slotId, 'video')
    s().resolveAttempt(a?.id ?? '', 'quote') // even a FILLED slot writes no coin
    const data = read()
    expect(data.evidence).toEqual([])
    expect(truth(data)).toBe(truthBefore)
  })

  it('A4 — Field Mode grants zero XP of its own; momentum caps at 7', () => {
    const { store, read } = makeStore({ momentum: { value: 7, lastAttemptDate: null, lastTickDate: null } })
    const s = store.getState
    s().addHuntProfile('p')
    const slotId = read().huntList.slots[0]?.id ?? ''
    const a = s().startAttempt(slotId, 'live-chat')
    s().resolveAttempt(a?.id ?? '', 'quote')
    const data = read()
    expect(xp(data)).toBe(0)
    expect(data.momentum.value).toBe(7) // capped — courage, never a streak
  })

  it('slots: only OPEN slots accept attempts; profile ships with two cold slots', () => {
    const { store, read } = makeStore()
    const s = store.getState
    s().addHuntProfile('p')
    const data = read()
    expect(data.huntList.slots).toHaveLength(2)
    expect(data.huntList.slots.every((x) => x.kind === 'cold' && x.state === 'open')).toBe(true)
    const slotId = data.huntList.slots[0]?.id ?? ''
    s().startAttempt(slotId, 'call')
    expect(s().startAttempt(slotId, 'call')).toBeNull() // no double-log
  })
})
