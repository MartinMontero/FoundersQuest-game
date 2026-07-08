// src/game/useReducedMotion.ts — live `prefers-reduced-motion` flag.
// Under reduced motion the world uses: instant camera cuts (no dolly), static
// nebula particles, no idle bob/pulse, fade-only Shadow (game-design §3).

import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function currentlyReduced(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(QUERY).matches
  )
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(currentlyReduced)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(QUERY)
    const onChange = (event: MediaQueryListEvent): void => {
      setReduced(event.matches)
    }
    mql.addEventListener('change', onChange)
    return (): void => {
      mql.removeEventListener('change', onChange)
    }
  }, [])

  return reduced
}
