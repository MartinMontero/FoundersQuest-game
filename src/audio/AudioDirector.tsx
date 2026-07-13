// src/audio/AudioDirector.tsx — the one component that conducts the engine:
// unlocks on the first user gesture (autoplay law), follows the settings
// volumes (own storage key), swaps the ambient bed with the world, and plays
// cues that DUPLICATE existing visual feedback (never audio-only): the shrine
// chime on kneel, the tier ding when a coin banks, the celebration sting, the
// funeral bell. Renders nothing.

import { useEffect, useRef } from 'react'
import { makeStore } from '../core/store'
import { createSettings } from '../settings'
import { useJourneyStore } from '../state/journey'
import { questStore } from '../state/store'
import { useUiStore } from '../state/ui'
import { createAudioEngine, type AudioEngine } from './engine'

let appEngine: AudioEngine | null = null
export function audioEngine(): AudioEngine {
  if (appEngine === null) appEngine = createAudioEngine()
  return appEngine
}

/** read the sliders straight from the settings ladder (own key) */
export function readAudioSettings(): { master: number; ambient: number; cues: number } {
  return createSettings(makeStore()).getAudio()
}

export function writeAudioSettings(
  volumes: Partial<{ master: number; ambient: number; cues: number }>,
): void {
  createSettings(makeStore()).setAudio(volumes)
  audioEngine().setVolumes(readAudioSettings())
}

export function AudioDirector(): null {
  const stage = useJourneyStore((s) => s.currentStage)
  const evidenceCount = useRef<number | null>(null)

  // first gesture unlocks; volumes load from settings at that moment
  useEffect(() => {
    const unlock = (): void => {
      audioEngine().unlock()
      audioEngine().setVolumes(readAudioSettings())
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return (): void => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  // the world's air follows the journey
  useEffect(() => {
    audioEngine().setWorld(stage)
  }, [stage])

  // cues ride the stores: kneel → chime · celebration → sting/bell
  useEffect(() => {
    const unsubUi = useUiStore.subscribe((state, previous) => {
      if (state.mode === 'trance' && previous.mode !== 'trance') {
        audioEngine().playCue('chime')
      }
      if (state.celebration !== null && state.celebration !== previous.celebration) {
        audioEngine().playCue(state.celebration.kind === 'funeral' ? 'bell' : 'sting')
      }
    })
    // a banked coin dings (count-up only — removals/imports ding once per batch)
    const unsubQuest = questStore.subscribe((state) => {
      const count = state.data.evidence.length
      if (evidenceCount.current !== null && count > evidenceCount.current) {
        audioEngine().playCue('ding')
      }
      evidenceCount.current = count
    })
    return (): void => {
      unsubUi()
      unsubQuest()
    }
  }, [])

  return null
}
