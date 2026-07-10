// src/game/AssetBoundary.tsx — a render-error boundary for individual 3D assets.
// A single heavy glTF/texture fetch that fails (an aborted/stalled download on a
// slow connection or a weak GPU) must NOT collapse the whole world into the app
// error boundary ("the world failed to hold together"). Wrapping each big asset in
// one of these lets it degrade to a lightweight fallback (a capsule for the
// character, nothing for the trees) while the rest of the world holds together.
//
// It catches RENDER errors only (React error boundary). Pair it with <Suspense>
// for the loading state: Suspense shows the fallback WHILE loading, this shows the
// fallback IF loading fails. Both use the same fallback, so the swap is seamless.

import { Component, type ReactNode } from 'react'

interface AssetBoundaryProps {
  /** rendered instead of the children if they throw (e.g. a failed asset load) */
  fallback: ReactNode
  /** dev-only label for the console note when an asset fails */
  label?: string
  children: ReactNode
}

interface AssetBoundaryState {
  failed: boolean
}

export class AssetBoundary extends Component<AssetBoundaryProps, AssetBoundaryState> {
  state: AssetBoundaryState = { failed: false }

  static getDerivedStateFromError(): AssetBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error): void {
    if (import.meta.env.DEV) {
      // a degraded asset is expected on weak devices — a note, not a crash
      console.warn(`[asset] ${this.props.label ?? 'asset'} failed to load, using fallback:`, error.message)
    }
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
