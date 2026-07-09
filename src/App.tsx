// App shell — intentionally minimal (Phase-2 integration point).
// Mounts <GameRoot/> (the 3D world) with <UiRoot/> (the DOM UI layer) beside
// it: HUD, trance, panels, Shadow, banners. All copy from src/strings.
//
// World init is honest about its async triad (ruled fix 7): a DOM loading
// line stands until the world's first rendered frame, and a top-level error
// boundary catches a broken world with plain copy and a reload button.

import { Component, useState, type ErrorInfo, type ReactElement, type ReactNode } from 'react'
import { GameRoot } from './game'
import { WORLD_COPY } from './strings'
import { UiRoot } from './ui/UiRoot'

interface BoundaryState {
  failed: boolean
}

/** Top-level error boundary: honest failure copy + a reload button (no <form>). */
class AppErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false }

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // local console only — no telemetry of any kind leaves the device (CLAUDE.md)
    console.error(error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.failed) {
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
