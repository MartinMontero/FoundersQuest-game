// tests/field-import.spec.ts — A-101 §8 import integrity, rule by rule, plus
// F-103: no evidence enters by ANY import path without atomic audit registration.

import { describe, expect, it } from 'vitest'
import {
  assembleFrames,
  BEAM_KIND,
  beamFrames,
  IMPORT_CAP_QR_BYTES,
  planImport,
  QR_CHUNK_CHARS,
  validateBeam,
  type BeamEnvelope,
} from '../src/core/fieldImport'
import { STORAGE_KEY, withDefaults, type QuestData } from '../src/core/schema'
import type { QuestStore } from '../src/core/store'
import { createQuestStore } from '../src/state/store'

const NOW = '2026-07-12T13:00:00.000Z'

function envelope(over: Partial<BeamEnvelope['payload']> = {}): BeamEnvelope {
  return {
    kind: BEAM_KIND, v: 1, beamId: 'beam-1', createdAt: NOW,
    payload: { profiles: [], slots: [], attempts: [], evidence: [], fieldDayLog: [], ...over },
  }
}

const COIN = {
  id: 'ev-1', tier: 2 as const, text: '"quote from the field"', source: 'kiosk chat',
  linkedAssumptionIds: [], stageId: 's2', date: '2026-07-12',
}

function makeStore(seed: Partial<QuestData> = {}) {
  const map = new Map<string, string>()
  const persistence: QuestStore = {
    get: (k) => map.get(k) ?? null, set: (k, v) => void map.set(k, v),
    remove: (k) => void map.delete(k), degraded: false,
  }
  map.set(STORAGE_KEY, JSON.stringify({ ...withDefaults(null), ...seed }))
  const store = createQuestStore({ store: persistence, now: () => NOW, makeId: (p) => `${p}-x` })
  return { store, read: () => withDefaults(JSON.parse(map.get(STORAGE_KEY) ?? '{}')) }
}

describe('rule 1 — strict schema', () => {
  it('accepts a clean envelope; rejects unknown keys BY NAME', () => {
    expect(validateBeam(JSON.stringify(envelope()), 'file').ok).toBe(true)
    const bad = JSON.parse(JSON.stringify(envelope({ evidence: [COIN] })))
    bad.payload.evidence[0].sneaky = 'x'
    const r = validateBeam(JSON.stringify(bad), 'file')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('unknown key "sneaky"')
  })

  it('rejects any dinner-named key outright', () => {
    const bad = JSON.parse(JSON.stringify(envelope()))
    bad.payload.dinnerLog = []
    const r = validateBeam(JSON.stringify(bad), 'file')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('dinner')
  })

  it('bounds beamed evidence tiers to 2-4 and rejects non-terminal records', () => {
    const hunch = JSON.stringify(envelope({ evidence: [{ ...COIN, tier: 0 as never }] }))
    expect(validateBeam(hunch, 'file').ok).toBe(false)
    const openSlot = JSON.stringify(envelope({
      slots: [{ id: 's1', profileId: 'p', kind: 'cold', state: 'open' as never, createdAt: NOW }],
    }))
    expect(validateBeam(openSlot, 'file').ok).toBe(false)
  })
})

describe('rule 2 — size caps', () => {
  it('QR cap rejects before parsing', () => {
    const big = JSON.stringify(envelope({ evidence: [{ ...COIN, text: 'q'.repeat(3999) }] }))
      .padEnd(IMPORT_CAP_QR_BYTES + 1, ' ')
    const r = validateBeam(big, 'qr')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('size cap')
  })
})

describe('rules 4 + 7 — append-only dedupe, home-registry links', () => {
  it('same id + same content = skip; different content = conflict; never overwrite', () => {
    const home = withDefaults({ evidence: [{ ...COIN }] })
    const same = planImport(home, envelope({ evidence: [{ ...COIN }] }))
    expect(same.writes.evidence).toEqual([])
    expect(same.skippedExistingIds).toEqual(['ev-1'])
    const different = planImport(home, envelope({ evidence: [{ ...COIN, text: 'altered' }] }))
    expect(different.writes.evidence).toEqual([])
    expect(different.conflicts).toEqual(['ev-1'])
  })

  it('links absent from the HOME registry are blanked and reported', () => {
    const home = withDefaults({
      assumptions: [{ id: 'g-home', statement: 's', originStageId: 's1', importance: 'dies',
        status: 'untested', killCriterion: 'k', createdAt: NOW }],
    })
    const plan = planImport(home, envelope({
      evidence: [{ ...COIN, linkedAssumptionIds: ['g-home', 'g-foreign'] }],
    }))
    expect(plan.writes.evidence[0]?.linkedAssumptionIds).toEqual(['g-home'])
    expect(plan.blankedLinks).toEqual([{ evidenceId: 'ev-1', blanked: ['g-foreign'] }])
  })
})

describe('rule 5 + F-103 — atomic provenance', () => {
  it('evidence lands WITH its audit record in one commit; ids match exactly; momentum untouched', () => {
    const { store, read } = makeStore()
    const plan = planImport(read(), envelope({
      evidence: [COIN],
      attempts: [{ id: 'at-1', slotId: 'sl-1', channel: 'call', startedAt: NOW,
        outcome: 'quote', resolvedAt: NOW, evidenceIds: ['ev-1'], origin: 'local' }],
    }))
    const before = read()
    store.getState().applyFieldImport(plan, 'beam-1', 'qr')
    const after = read()
    expect(after.evidence.map((e) => e.id)).toEqual(['ev-1'])
    expect(after.fieldJournal.imports).toHaveLength(1)
    expect(after.fieldJournal.imports[0]?.evidenceIds).toEqual(['ev-1']) // written ids ONLY
    expect(after.fieldJournal.imports[0]?.via).toBe('qr')
    expect(after.fieldJournal.attempts[0]?.origin).toBe('import')
    expect(after.fieldJournal.attempts[0]?.beamId).toBe('beam-1')
    expect(after.momentum).toEqual(before.momentum) // courage is not importable
  })

  it('re-importing the same beam writes nothing new — always safe', () => {
    const { store, read } = makeStore()
    const env = envelope({ evidence: [COIN] })
    store.getState().applyFieldImport(planImport(read(), env), 'beam-1', 'file')
    const second = planImport(read(), env)
    expect(second.writes.evidence).toEqual([])
    expect(second.skippedExistingIds).toEqual(['ev-1'])
  })
})

describe('QR frames — FQB1 chunk / reassemble (spec §8)', () => {
  it('round-trips a multi-frame beam, frames given out of order, stray scans ignored', () => {
    // enough quoted text to force > QR_CHUNK_CHARS of base64url → several frames
    const coins = Array.from({ length: 3 }, (_, i) => ({
      ...COIN, id: `ev-${i}`, text: `"${'their exact words '.repeat(40)}${i}"`,
    }))
    const env = envelope({ evidence: coins })
    const frames = beamFrames(env)
    expect(frames.length).toBeGreaterThan(1)
    for (const f of frames) {
      expect(f).toMatch(/^FQB1:beam-1:\d+:\d+:/)
      expect(f.length).toBeLessThanOrEqual(QR_CHUNK_CHARS + `FQB1:beam-1:${frames.length}:${frames.length}:`.length)
    }
    const shuffled = [frames[frames.length - 1], 'https://not-a-beam.example', ...frames.slice(0, -1)]
    const out = assembleFrames(shuffled as string[])
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(JSON.parse(out.raw)).toEqual(env)
      expect(validateBeam(out.raw, 'qr').ok).toBe(true)
    }
  })

  it('a missing frame is a named error, never a partial import', () => {
    const env = envelope({ evidence: [{ ...COIN, text: `"${'w'.repeat(2500)}"` }] })
    const frames = beamFrames(env)
    expect(frames.length).toBeGreaterThan(1)
    const out = assembleFrames(frames.slice(1))
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.error).toContain('missing frames')
  })

  it('frames from two different beams never merge', () => {
    const a = beamFrames(envelope())
    const b = beamFrames({ ...envelope(), beamId: 'beam-2' })
    const out = assembleFrames([...a, ...b])
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.error).toContain('different beams')
  })

  it('unicode in quotes survives the base64url trip intact', () => {
    const env = envelope({ evidence: [{ ...COIN, text: '"café — 現場の声 🎯"' }] })
    const out = assembleFrames(beamFrames(env))
    expect(out.ok).toBe(true)
    if (out.ok) expect(JSON.parse(out.raw).payload.evidence[0].text).toBe('"café — 現場の声 🎯"')
  })
})
