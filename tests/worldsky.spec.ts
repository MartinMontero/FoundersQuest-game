// tests/worldsky.spec.ts — the weather→sky tint (E-0). Display only: this
// suite pins that neutral/no weather returns the sky UNCHANGED (reference-
// equal — W1's byte-pinned identity survives) and that the tint touches only
// the air channels (background/fog/horizon), never a world's signature.

import { describe, expect, it } from 'vitest'
import { hexLerp, skyForStage, tintSky, weatherMean } from '../src/game/worldPalette'

describe('weatherMean — the display twin of the trough window', () => {
  it('null on no readings; mean of the last ≤3 by date', () => {
    expect(weatherMean([])).toBeNull()
    expect(
      weatherMean([
        { date: '2026-07-08', value: 5 }, // outside the window once 3 newer exist
        { date: '2026-07-09', value: 1 },
        { date: '2026-07-10', value: 2 },
        { date: '2026-07-11', value: 3 },
      ]),
    ).toBe(2)
  })

  it('chronological by date, not array order', () => {
    expect(
      weatherMean([
        { date: '2026-07-11', value: 5 },
        { date: '2026-07-01', value: 1 },
      ]),
    ).toBe(3)
  })
})

describe('hexLerp', () => {
  it('endpoints and midpoint', () => {
    expect(hexLerp('#000000', '#ffffff', 0)).toBe('#000000')
    expect(hexLerp('#000000', '#ffffff', 1)).toBe('#ffffff')
    expect(hexLerp('#000000', '#ffffff', 0.5)).toBe('#808080')
  })
})

describe('tintSky', () => {
  const w1 = skyForStage(1)

  it('neutral or absent weather returns the SAME sky object (W1 stays byte-pinned)', () => {
    expect(tintSky(w1, null)).toBe(w1)
    expect(tintSky(w1, 3)).toBe(w1)
  })

  it('low weather mutes the air; high warms it; identity channels never move', () => {
    const low = tintSky(w1, 1)
    const high = tintSky(w1, 5)
    expect(low.background).not.toBe(w1.background)
    expect(high.fog).not.toBe(w1.fog)
    for (const sky of [low, high]) {
      expect(sky.zenith).toBe(w1.zenith)
      expect(sky.glow).toBe(w1.glow)
      expect(sky.aurora).toBe(w1.aurora)
      expect(sky.accent).toBe(w1.accent)
    }
    expect(low.background).not.toBe(high.background)
  })

  it('tint is bounded: mean 2 moves less than mean 1', () => {
    const mild = tintSky(w1, 2)
    const deep = tintSky(w1, 1)
    const dist = (a: string, b: string): number =>
      Math.abs(parseInt(a.slice(1, 3), 16) - parseInt(b.slice(1, 3), 16))
    expect(dist(mild.fog, w1.fog)).toBeLessThan(dist(deep.fog, w1.fog))
  })
})
