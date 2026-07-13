// src/game/useWorldSky.ts — the ONE sky the scene consumes (E-0): the current
// world's identity, tinted by the founder's logged weather. Both sky readers
// (World.tsx air, Nebula.tsx dome) share this hook so they can never drift.
// Display only — nothing here feeds a metric.

import { useMemo } from 'react'
import { useJourneyStore } from '../state/journey'
import { useQuestStore } from '../state/store'
import { skyForStage, tintSky, weatherMean, type WorldSky } from './worldPalette'

export function useWorldSky(): WorldSky {
  const stage = useJourneyStore((s) => s.currentStage)
  const weather = useQuestStore((s) => s.data.weather)
  return useMemo(() => tintSky(skyForStage(stage), weatherMean(weather)), [stage, weather])
}
