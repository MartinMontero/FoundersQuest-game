// tests/audio.spec.ts — A-1's laws at the data layer: silence is the default,
// volumes clamp and persist under the settings' own key, and the patch tables
// are complete (8 worlds, 4 cues). The AudioContext itself is browser-only —
// engine behavior is exercised by the e2e slider spec; honest label.

import { describe, expect, it } from 'vitest'
import { AMBIENT_PATCHES, CUE_PATCHES } from '../src/audio/engine'
import { createSettings, SETTINGS_STORAGE_KEY, type SettingsStore } from '../src/settings'

function memoryStore(): SettingsStore & { map: Map<string, string> } {
  const map = new Map<string, string>()
  return {
    map,
    get: (k) => map.get(k) ?? null,
    set: (k, v) => void map.set(k, v),
    remove: (k) => void map.delete(k),
  }
}

describe('A-1 audio settings', () => {
  it('SILENCE is the default: master 0 until the player raises it', () => {
    const s = createSettings(memoryStore())
    expect(s.getAudio().master).toBe(0)
  })

  it('volumes clamp to [0,1], persist under the settings key, and merge partially', () => {
    const store = memoryStore()
    const s = createSettings(store)
    s.setAudio({ master: 1.7, cues: -3 })
    expect(s.getAudio().master).toBe(1)
    expect(s.getAudio().cues).toBe(0)
    expect(s.getAudio().ambient).toBeCloseTo(0.7) // untouched channel survives
    expect(store.map.get(SETTINGS_STORAGE_KEY)).toContain('audioMaster')
  })

  it('a hand-corrupted volume hydrates to the default, never NaN', () => {
    const store = memoryStore()
    store.map.set(SETTINGS_STORAGE_KEY, JSON.stringify({ audioMaster: 'loud' }))
    expect(createSettings(store).getAudio().master).toBe(0)
  })

  it('patch tables are complete: 8 world airs, 4 cues, all bounded', () => {
    for (let stage = 1; stage <= 8; stage += 1) {
      const p = AMBIENT_PATCHES[stage]
      expect(p).toBeDefined()
      expect(p!.root).toBeGreaterThan(20)
      expect(p!.droneMix).toBeGreaterThanOrEqual(0)
      expect(p!.droneMix).toBeLessThanOrEqual(1)
    }
    for (const kind of ['chime', 'ding', 'sting', 'bell'] as const) {
      expect(CUE_PATCHES[kind].dur).toBeGreaterThan(0)
    }
  })
})
