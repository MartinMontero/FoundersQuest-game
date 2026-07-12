// src/audio/engine.ts — the game's sound, synthesized (A-1). The container
// that builds this game cannot fetch CC0 audio packs (egress-blocked), so the
// beds and cues are PROCEDURAL WebAudio patches: license-free, deterministic,
// zero assets, zero dependencies. The engine takes per-world patch params, so
// sourced files can replace patches later without touching callers.
//
// LAWS: silence is the default (master volume 0 until the player adjusts —
// never autoplay loud); the AudioContext is created lazily on the first user
// gesture; volumes come from the settings store (own key, device-local);
// cues DUPLICATE visual feedback that already exists — nothing is audio-only
// (accessibility gate). Zero network, nothing here touches founders-quest:v3.

export type CueKind = 'chime' | 'ding' | 'sting' | 'bell'

/** per-world ambient drone patch — tuned to each world's §5 mood */
export interface AmbientPatch {
  /** root frequency of the two detuned drone oscillators (Hz) */
  root: number
  /** detune between them (cents) */
  detune: number
  /** lowpass cutoff over the noise floor (Hz) */
  noiseCutoff: number
  /** drone level relative to the noise floor 0..1 */
  droneMix: number
}

/** 8 worlds, 8 airs: low+dark for the descent, brighter on the climb */
export const AMBIENT_PATCHES: Readonly<Record<number, AmbientPatch>> = {
  1: { root: 110.0, detune: 7, noiseCutoff: 420, droneMix: 0.55 }, // nebula hum
  2: { root: 87.31, detune: 5, noiseCutoff: 300, droneMix: 0.45 }, // corvid dusk
  3: { root: 98.0, detune: 9, noiseCutoff: 650, droneMix: 0.6 }, //  forge ember
  4: { root: 73.42, detune: 4, noiseCutoff: 260, droneMix: 0.4 }, //  maze unease
  5: { root: 82.41, detune: 3, noiseCutoff: 340, droneMix: 0.35 }, // mirror still
  6: { root: 130.81, detune: 6, noiseCutoff: 520, droneMix: 0.5 }, // marble light
  7: { root: 146.83, detune: 8, noiseCutoff: 700, droneMix: 0.55 }, // morning span
  8: { root: 164.81, detune: 10, noiseCutoff: 900, droneMix: 0.6 }, // launch dawn
}

/** cue patches: [freqHz, durationS, type] triads envelope'd below */
export const CUE_PATCHES: Readonly<Record<CueKind, { freq: number; dur: number; type: OscillatorType }>> = {
  chime: { freq: 880, dur: 0.5, type: 'sine' }, //     shrine kneel
  ding: { freq: 1318.5, dur: 0.25, type: 'triangle' }, // tier coin banked
  sting: { freq: 523.25, dur: 0.9, type: 'sine' }, //   celebration
  bell: { freq: 220, dur: 1.6, type: 'sine' }, //       funeral bell
}

export interface AudioVolumes {
  master: number
  ambient: number
  cues: number
}

/** the one engine; everything no-ops until unlock() runs on a user gesture */
export interface AudioEngine {
  /** create/resume the context — call ONLY from a user-gesture handler */
  unlock(): void
  setVolumes(volumes: AudioVolumes): void
  /** crossfade the ambient bed to a world's patch (or silence with null) */
  setWorld(stage: number | null): void
  playCue(kind: CueKind): void
}

export function createAudioEngine(): AudioEngine {
  let context: AudioContext | null = null
  let master: GainNode | null = null
  let ambientGain: GainNode | null = null
  let cuesGain: GainNode | null = null
  let droneA: OscillatorNode | null = null
  let droneB: OscillatorNode | null = null
  let noiseFilter: BiquadFilterNode | null = null
  let droneLevel: GainNode | null = null
  let noiseLevel: GainNode | null = null
  let volumes: AudioVolumes = { master: 0, ambient: 0.7, cues: 0.7 }
  let currentStage: number | null = null

  function ensureGraph(): boolean {
    if (context !== null) return true
    if (typeof AudioContext === 'undefined') return false
    context = new AudioContext()
    master = context.createGain()
    master.gain.value = volumes.master
    master.connect(context.destination)
    ambientGain = context.createGain()
    ambientGain.gain.value = volumes.ambient
    ambientGain.connect(master)
    cuesGain = context.createGain()
    cuesGain.gain.value = volumes.cues
    cuesGain.connect(master)
    // the bed: two detuned drones + a filtered noise floor, always connected,
    // levels driven by the world patch (constant graph, no re-wiring)
    droneLevel = context.createGain()
    droneLevel.gain.value = 0
    droneLevel.connect(ambientGain)
    noiseLevel = context.createGain()
    noiseLevel.gain.value = 0
    noiseFilter = context.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.connect(noiseLevel)
    noiseLevel.connect(ambientGain)
    droneA = context.createOscillator()
    droneB = context.createOscillator()
    droneA.connect(droneLevel)
    droneB.connect(droneLevel)
    droneA.start()
    droneB.start()
    // 2s looped noise buffer, deterministic LCG (no Math.random)
    const seconds = 2
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate)
    const channel = buffer.getChannelData(0)
    let seed = 0x9e3779b9
    for (let i = 0; i < channel.length; i += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0
      channel[i] = (seed / 0x80000000 - 1) * 0.6
    }
    const noise = context.createBufferSource()
    noise.buffer = buffer
    noise.loop = true
    noise.connect(noiseFilter)
    noise.start()
    if (currentStage !== null) applyWorld(currentStage)
    return true
  }

  function applyWorld(stage: number): void {
    if (context === null || droneA === null || droneB === null) return
    const patch = AMBIENT_PATCHES[stage] ?? AMBIENT_PATCHES[1]
    if (patch === undefined) return
    const t = context.currentTime
    droneA.frequency.setTargetAtTime(patch.root, t, 1.2)
    droneB.frequency.setTargetAtTime(patch.root, t, 1.2)
    droneA.detune.setTargetAtTime(-patch.detune, t, 1.2)
    droneB.detune.setTargetAtTime(patch.detune, t, 1.2)
    noiseFilter?.frequency.setTargetAtTime(patch.noiseCutoff, t, 1.2)
    droneLevel?.gain.setTargetAtTime(0.05 * patch.droneMix, t, 1.5)
    noiseLevel?.gain.setTargetAtTime(0.03 * (1 - patch.droneMix), t, 1.5)
  }

  return {
    unlock(): void {
      if (!ensureGraph()) return
      if (context !== null && context.state === 'suspended') void context.resume()
    },
    setVolumes(next: AudioVolumes): void {
      volumes = next
      if (context === null) return
      const t = context.currentTime
      master?.gain.setTargetAtTime(next.master, t, 0.1)
      ambientGain?.gain.setTargetAtTime(next.ambient, t, 0.1)
      cuesGain?.gain.setTargetAtTime(next.cues, t, 0.1)
    },
    setWorld(stage: number | null): void {
      currentStage = stage
      if (context === null) return
      if (stage === null) {
        const t = context.currentTime
        droneLevel?.gain.setTargetAtTime(0, t, 0.8)
        noiseLevel?.gain.setTargetAtTime(0, t, 0.8)
        return
      }
      applyWorld(stage)
    },
    playCue(kind: CueKind): void {
      if (volumes.master === 0 || volumes.cues === 0) return // silence stays silent
      if (context === null || cuesGain === null) return
      const patch = CUE_PATCHES[kind]
      const t = context.currentTime
      const osc = context.createOscillator()
      const env = context.createGain()
      osc.type = patch.type
      osc.frequency.value = patch.freq
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.35, t + 0.02)
      env.gain.exponentialRampToValueAtTime(0.001, t + patch.dur)
      osc.connect(env)
      env.connect(cuesGain)
      osc.start(t)
      osc.stop(t + patch.dur + 0.05)
      // the bell tolls with a fifth below, softly
      if (kind === 'bell') {
        const under = context.createOscillator()
        under.type = 'sine'
        under.frequency.value = patch.freq * (2 / 3)
        const underEnv = context.createGain()
        underEnv.gain.setValueAtTime(0, t)
        underEnv.gain.linearRampToValueAtTime(0.2, t + 0.03)
        underEnv.gain.exponentialRampToValueAtTime(0.001, t + patch.dur)
        under.connect(underEnv)
        underEnv.connect(cuesGain)
        under.start(t)
        under.stop(t + patch.dur + 0.05)
      }
    },
  }
}
