// src/game/controls.ts — keyboard-first world controls (game-design §3).
// WASD/arrows move · Shift walks · Q / Alt+←→ orbit the camera ·
// Tab / Shift+Tab cycle interactables · E / Enter activate · Esc drops
// Tab focus in roam (panels/trance own Esc through the UI layer).
// The move flags are a module-level scratch read by the player's frame loop —
// render plumbing, never state of record. Zero network, zero DOM focus tricks.

import { useEffect, useRef } from 'react'
import { questStore } from '../state/store'
import { useUiStore } from '../state/ui'
import type { WorldEvents } from './contracts'
import { SPEC_BY_ID, activeTargetId, useInteractionStore } from './interaction'

export interface MoveInput {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  walk: boolean
  yawLeft: boolean
  yawRight: boolean
}

const input: MoveInput = {
  forward: false,
  back: false,
  left: false,
  right: false,
  walk: false,
  yawLeft: false,
  yawRight: false,
}

/** Read-only view for frame loops (mutated in place; do not hold across frames). */
export function getMoveInput(): Readonly<MoveInput> {
  return input
}

function resetInput(): void {
  input.forward = false
  input.back = false
  input.left = false
  input.right = false
  input.walk = false
  input.yawLeft = false
  input.yawRight = false
}

/** True when the key event belongs to a DOM control (panels, HUD) — leave it alone. */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLButtonElement
  )
}

/** Fire the contracts callback for the currently highlighted interactable. */
function activate(events: WorldEvents): void {
  const id = activeTargetId(useInteractionStore.getState())
  if (id === null) return
  const spec = SPEC_BY_ID.get(id)
  if (spec === undefined) return
  switch (spec.kind) {
    case 'shrine':
      if (spec.qid !== undefined) events.onShrineEnter(spec.qid)
      break
    case 'vault':
      events.onVaultApproach()
      break
    case 'registry':
      events.onRegistryApproach()
      break
    case 'flagpole':
      if (spec.milestoneId !== undefined) events.onFlagpole(spec.milestoneId)
      break
    case 'portal':
      if (spec.portalDir === 'loop' && spec.loopName !== undefined && spec.targetStage !== undefined) {
        events.onLoop(spec.loopName, spec.targetStage)
      } else if (spec.targetStage !== undefined) {
        events.onPortal(spec.targetStage)
      }
      break
    case 'campfire':
      events.onCampfire()
      break
    case 'arena':
      events.onArenaEnter()
      break
    case 'ego':
      events.onEgoApproach()
      break
  }
}

/** Movement flags clear focus so the ring returns to walk-up proximity. */
function setMoveFlag(code: string, altKey: boolean, down: boolean): boolean {
  switch (code) {
    case 'KeyW':
    case 'ArrowUp':
      input.forward = down
      return true
    case 'KeyS':
    case 'ArrowDown':
      input.back = down
      return true
    case 'KeyA':
      input.left = down
      return true
    case 'KeyD':
      input.right = down
      return true
    case 'ArrowLeft':
      if (down && altKey) input.yawLeft = true
      else if (down) input.left = true
      else {
        input.left = false
        input.yawLeft = false
      }
      return true
    case 'ArrowRight':
      if (down && altKey) input.yawRight = true
      else if (down) input.right = true
      else {
        input.right = false
        input.yawRight = false
      }
      return true
    case 'KeyQ':
      input.yawLeft = down
      return true
    case 'ShiftLeft':
    case 'ShiftRight':
      input.walk = down
      return true
    default:
      return false
  }
}

/**
 * Attach the world's keyboard bindings for the lifetime of the component.
 * Listens on window; every binding stands down when a DOM control has focus
 * or the UI mode is not 'roam' (keyups still clear flags so exiting a panel
 * never leaves a stuck key).
 */
export function useWorldControls(events: WorldEvents): void {
  const eventsRef = useRef(events)
  useEffect(() => {
    eventsRef.current = events
  }, [events])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (isEditableTarget(e.target)) return
      if (useUiStore.getState().mode !== 'roam') return

      if (e.code === 'Tab') {
        e.preventDefault()
        if (!e.repeat) useInteractionStore.getState().cycleFocus(e.shiftKey ? -1 : 1)
        return
      }
      if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        // prevent the default text insertion: activation may focus a writing
        // panel in this same dispatch, and the key must not leak into it
        e.preventDefault()
        if (!e.repeat) activate(eventsRef.current)
        return
      }
      if (e.code === 'Escape') {
        useInteractionStore.getState().clearFocus()
        return
      }
      // the Cartographer's Chart (M = map, L = legend) — once handed over
      // (completed OR skipped opening both unlock it; nothing is gated)
      if (e.code === 'KeyC' && !e.repeat) {
        // the Council temple (C-1) — key, consent, and the by-hand reading
        e.preventDefault()
        useUiStore.getState().openPanel('panel:council')
        return
      }
      if (e.code === 'KeyF' && !e.repeat) {
        // Field Mode (A-101) — always available; it is the founder's journal side
        e.preventDefault()
        useUiStore.getState().openPanel('panel:field')
        return
      }
      if ((e.code === 'KeyM' || e.code === 'KeyL') && !e.repeat) {
        if (questStore.getState().data.chartUnlocked) {
          useUiStore.getState().openPanel(e.code === 'KeyM' ? 'panel:chart' : 'panel:legend')
        }
        return
      }
      const isArrow = e.code.startsWith('Arrow')
      if (setMoveFlag(e.code, e.altKey, true)) {
        if (isArrow) e.preventDefault()
        // walking hands the highlight back to proximity
        if (e.code !== 'ShiftLeft' && e.code !== 'ShiftRight') {
          useInteractionStore.getState().clearFocus()
        }
      }
    }

    const onKeyUp = (e: KeyboardEvent): void => {
      // always clear flags, whatever the mode — no stuck keys after a panel
      setMoveFlag(e.code, e.altKey, false)
    }

    const onBlur = (): void => {
      resetInput()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)

    // entering a trance/panel freezes movement immediately
    const unsubscribe = useUiStore.subscribe((state) => {
      if (state.mode !== 'roam') resetInput()
    })

    return (): void => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      unsubscribe()
      resetInput()
    }
  }, [])
}
