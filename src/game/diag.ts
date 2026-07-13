// src/game/diag.ts — a tiny LOCAL-ONLY diagnostic ring the crash screen can
// show. No telemetry ever leaves the device (CLAUDE.md); this exists so a
// player/operator hitting a crash can screenshot the actual error instead of
// us guessing. It captures three sources that a React error boundary alone
// misses: caught per-frame throws (useSafeFrame), window 'error' events (the
// rAF loop / WASM / shader throws surface here), and unhandled rejections.

const MAX = 8
const seen: string[] = []

function fmt(e: unknown): string {
  if (e instanceof Error) return e.stack ? e.stack.split('\n').slice(0, 4).join('\n') : e.message
  return String(e)
}

/** Record an error once (a per-frame throw would otherwise spam every frame). */
export function recordError(e: unknown): void {
  const msg = fmt(e)
  if (seen.includes(msg)) return
  seen.push(msg)
  if (seen.length > MAX) seen.shift()
}

/** The captured errors, newest last — rendered in the crash screen's details. */
export function getDiag(): readonly string[] {
  return seen
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (ev) => recordError(ev.error ?? ev.message))
  window.addEventListener('unhandledrejection', (ev) => recordError(ev.reason))
}
