// App shell — intentionally minimal (Phase-2 integration point).
// Mounts <GameRoot/> (the 3D world) with <UiRoot/> (the DOM UI layer) beside
// it: HUD, trance, panels, Shadow, banners. All copy from src/strings.
//
// World init is honest about its async triad (ruled fix 7): a DOM loading
// line stands until the world's first rendered frame, and a top-level error
// boundary catches a broken world with plain copy and a reload button.

import { Component, useState, type ErrorInfo, type ReactElement, type ReactNode } from 'react'
import { GameRoot } from './game'
import { getDiag, recordError } from './game/diag'
import { RENDER_TIER } from './game/perf'
import { WORLD_COPY } from './strings'
import { UiRoot } from './ui/UiRoot'

/** The GPU's real renderer string — the single most useful line for a crash
 * report (a specific mobile GPU vs. a driver). A throwaway canvas, read once at
 * crash time; every failure mode collapses to 'unavailable' (LOCAL-ONLY: this
 * never leaves the device — CLAUDE.md). */
function glRenderer(): string {
  try {
    const canvas = document.createElement('canvas')
    const gl =
      (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ??
      (canvas.getContext('webgl') as WebGLRenderingContext | null)
    if (gl === null) return 'unavailable'
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    if (ext === null) return 'unavailable'
    return String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
  } catch {
    return 'unavailable'
  }
}

interface BoundaryState {
  failed: boolean
  /** the caught error (message + stack), for the technical-details panel */
  error: Error | null
  /** the React component stack from ErrorInfo, first frames only */
  infoStack: string | null
}

/** Top-level error boundary: honest failure copy + a reload button (no <form>),
 * plus a collapsed technical-details panel so a player/operator can screenshot
 * the ACTUAL crash cause. Everything here is LOCAL-ONLY — no network, no
 * telemetry ever leaves the device (CLAUDE.md). The diag ring additionally
 * surfaces rAF-loop / WASM / unhandledrejection errors a React boundary misses. */
class AppErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false, error: null, infoStack: null }

  static getDerivedStateFromError(): Partial<BoundaryState> {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // local console only — no telemetry of any kind leaves the device (CLAUDE.md)
    console.error(error, info.componentStack)
    // also land it in the diag ring so the details panel shows one coherent story
    recordError(error)
    this.setState({ error, infoStack: info.componentStack ?? null })
  }

  render(): ReactNode {
    if (this.state.failed) {
      const { error, infoStack } = this.state
      const lines = [
        error !== null ? error.message : 'unknown error',
        ...(error?.stack !== undefined ? error.stack.split('\n').slice(0, 4) : []),
        ...(infoStack !== null ? infoStack.split('\n').slice(0, 4) : []),
        `tier: ${RENDER_TIER}`,
        `gl: ${glRenderer()}`,
        `ua: ${navigator.userAgent}`,
        getDiag().join('\n---\n'),
      ]
      const details = lines.filter((line) => line !== '').join('\n')
      return (
        <div
          role="alert"
          data-testid="app-crashed"
          className="flex h-full w-full flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center"
        >
          <p className="max-w-md text-base text-slate-100">{WORLD_COPY.crashed}</p>
          <button
            type="button"
            data-testid="app-reload"
            onClick={() => window.location.reload()}
            className="rounded bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            {WORLD_COPY.reload}
          </button>
          <details data-testid="crash-details" className="max-w-full">
            <summary className="cursor-pointer text-xs text-slate-500">
              Show technical details
            </summary>
            <pre className="mt-3 max-w-full overflow-auto whitespace-pre-wrap text-left text-2xs text-slate-400">
              {details}
            </pre>
          </details>
        </div>
      )
    }
    return this.props.children
  }
}

export function App(): ReactElement {
  // flips on the world's first rendered frame (same pattern as the FPS sampler)
  const [worldReady, setWorldReady] = useState(false)

  return (
    <AppErrorBoundary>
      <main className="relative h-full w-full overflow-hidden">
        <h1 className="sr-only">{WORLD_COPY.appTitle}</h1>
        <p data-testid="boot-status" className="sr-only">
          {WORLD_COPY.bootStatus}
        </p>
        <GameRoot onFirstFrame={() => setWorldReady(true)} />
        {!worldReady ? (
          <div className="pointer-events-none fixed inset-0 z-hud flex items-center justify-center">
            <p data-testid="world-loading" role="status" className="text-sm italic text-slate-300">
              {WORLD_COPY.loading}
            </p>
          </div>
        ) : null}
        <UiRoot />
      </main>
    </AppErrorBoundary>
  )
}
