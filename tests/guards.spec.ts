// Repo-guard tests — structural canon rules, machine-enforced.
// 02: no server anywhere; exactly one transport module; key never serialized.
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'src')
const TRANSPORT_FILE = join(SRC, 'transport', 'council.ts')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

describe('repo guards (canon 02 / CLAUDE.md)', () => {
  it('no functions/ directory exists — no server, ever', () => {
    expect(existsSync(join(ROOT, 'functions'))).toBe(false)
  })

  it('api.anthropic.com appears in exactly one src module: the transport', () => {
    const offenders = walk(SRC).filter(
      (f) => f !== TRANSPORT_FILE && readFileSync(f, 'utf8').includes('api.anthropic.com'),
    )
    expect(offenders).toEqual([])
    expect(readFileSync(TRANSPORT_FILE, 'utf8')).toContain('api.anthropic.com')
  })

  it('fetch is called only from the transport module', () => {
    const offenders = walk(SRC).filter((f) => {
      if (f === TRANSPORT_FILE) return false
      const text = readFileSync(f, 'utf8')
      return /\bfetch\s*\(/.test(text) || /XMLHttpRequest|WebSocket|sendBeacon/.test(text)
    })
    expect(offenders).toEqual([])
  })

  it('no ANTHROPIC_API_KEY string anywhere in src — BYOK has no env key', () => {
    const offenders = walk(SRC).filter((f) => readFileSync(f, 'utf8').includes('ANTHROPIC_API_KEY'))
    expect(offenders).toEqual([])
  })

  it('no sk-ant- material in src — fabricated keys live only in tests', () => {
    const offenders = walk(SRC).filter((f) => readFileSync(f, 'utf8').includes('sk-ant-'))
    expect(offenders).toEqual([])
  })

  it('the serializer has no import path to the key module', () => {
    const serializer = readFileSync(join(SRC, 'core', 'serializer.ts'), 'utf8')
    expect(serializer).not.toMatch(/from\s+['"].*\/key\//)
    expect(serializer).not.toMatch(/from\s+['"].*keyManager/)
  })

  it('no eval / Function constructor / dangerouslySetInnerHTML in src', () => {
    const offenders = walk(SRC).filter((f) => {
      const text = readFileSync(f, 'utf8')
      return /\beval\s*\(/.test(text) || /new Function\s*\(/.test(text) || /dangerouslySetInnerHTML/.test(text)
    })
    expect(offenders).toEqual([])
  })

  it('the CSP header file ships the canon connect-src', () => {
    const headers = readFileSync(join(ROOT, 'public', '_headers'), 'utf8')
    expect(headers).toContain("default-src 'self'")
    expect(headers).toContain("connect-src 'self' https://api.anthropic.com")
    expect(headers).toContain('frame-ancestors \'none\'')
  })
})
