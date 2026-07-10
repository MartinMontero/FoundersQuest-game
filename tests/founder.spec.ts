// tests/founder.spec.ts — the founder's chosen name (device-local preference).
// Pins the pure helpers (display fallback, normalisation/clamp) and the store's
// contract: a real name sticks; an empty/whitespace choice adopts the canon
// default so the first-run card persists as answered and never reappears.

import { describe, expect, it } from 'vitest'
import {
  FOUNDER_NAME_MAX,
  founderDisplayName,
  normaliseFounderName,
  useFounderStore,
} from '../src/state/founder'
import { UI } from '../src/strings'

describe('founderDisplayName — the HUD fallback (empty adopts the canon default)', () => {
  it('empty and whitespace-only names show the canon default', () => {
    expect(founderDisplayName('')).toBe(UI.founder.defaultName)
    expect(founderDisplayName('   ')).toBe(UI.founder.defaultName)
  })

  it('a real name shows verbatim, trimmed of surrounding space', () => {
    expect(founderDisplayName('Ada')).toBe('Ada')
    expect(founderDisplayName('  Ada  ')).toBe('Ada')
  })
})

describe('normaliseFounderName — collapse, trim, clamp; empty stays empty', () => {
  it('collapses internal whitespace and trims the ends', () => {
    expect(normaliseFounderName('  Ada   Lovelace  ')).toBe('Ada Lovelace')
  })

  it('empty or whitespace-only input normalises to empty', () => {
    expect(normaliseFounderName('')).toBe('')
    expect(normaliseFounderName('    ')).toBe('')
  })

  it('clamps to FOUNDER_NAME_MAX characters', () => {
    const long = 'x'.repeat(FOUNDER_NAME_MAX + 20)
    expect(normaliseFounderName(long)).toHaveLength(FOUNDER_NAME_MAX)
  })
})

describe('useFounderStore.setName — a name sticks; empty adopts the default', () => {
  it('a real name is normalised and stored', () => {
    useFounderStore.getState().setName('  Grace   Hopper  ')
    expect(useFounderStore.getState().name).toBe('Grace Hopper')
  })

  it('an empty or whitespace choice adopts the canon default (persists as answered)', () => {
    useFounderStore.getState().setName('   ')
    expect(useFounderStore.getState().name).toBe(UI.founder.defaultName)
  })

  it('an over-long name is clamped to the cap', () => {
    useFounderStore.getState().setName('y'.repeat(FOUNDER_NAME_MAX + 10))
    expect(useFounderStore.getState().name).toHaveLength(FOUNDER_NAME_MAX)
  })
})
