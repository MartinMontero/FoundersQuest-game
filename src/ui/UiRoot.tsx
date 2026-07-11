// src/ui/UiRoot.tsx — the DOM UI layer over the canvas. Composes the HUD,
// the shrine trance, the Vault/Registry panels, the Shadow overlay, the
// first-run hint, and the honest storage banner — all pure renders of the two
// stores. Zero network anywhere in this layer (guard-tested repo-wide).
//
// Shadow summoning: when the derived divergence check (src/state/tunables)
// flips true and the player has not dismissed this appearance, the overlay
// opens quoting ONLY the founder's own stored text — chosen locally from the
// riskiest guardian's origin stage — paired with exactly one low-friction
// action: the deep-link that opens the riskiest guardian in the Registry.

import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import { riskiest, trough } from '../core/metrics'
import type { QuestData } from '../core/schema'
import { useJourneyStore } from '../state/journey'
import { questStore, useQuestData } from '../state/store'
import { EARNED_HUNCH_BUMP, shouldSummonShadow } from '../state/tunables'
import { useUiStore } from '../state/ui'
import { STAGES, UI } from '../strings'
import { CalibrationPanel } from './CalibrationPanel'
import { CampfirePanel } from './CampfirePanel'
import { DegradedBanner } from './DegradedBanner'
import { FounderNaming } from './FounderNaming'
import { GatePanel } from './GatePanel'
import { Hud } from './Hud'
import { LoopPanel } from './LoopPanel'
import { OnboardingHint } from './OnboardingHint'
import { RegistryPanel } from './RegistryPanel'
import { ShadowOverlay } from './ShadowOverlay'
import { TrancePanel } from './TrancePanel'
import { VaultPanel } from './VaultPanel'

/**
 * The Shadow's line: the founder's OWN stored text tied to the riskiest
 * guardian's origin stage — answers first (in 03 question order: text, then
 * whys), then ledger entries from that stage, then the guardian's own
 * statement. Pure and local; nothing invented, nothing sent anywhere.
 */
export function chooseShadowQuote(data: QuestData): string {
  // same bump as useRiskiest — "riskiest" is one identity everywhere (A2)
  const guardian = riskiest(data, EARNED_HUNCH_BUMP)
  if (guardian === null) return ''
  const stage = STAGES.find((s) => `s${s.stage}` === guardian.originStageId)
  const stageAnswers = data.answers[guardian.originStageId]
  if (stage !== undefined && stageAnswers !== undefined) {
    for (const question of stage.questions) {
      const answer = stageAnswers[question.id]
      if (answer === undefined) continue
      const text = answer.text?.trim() ?? ''
      if (text !== '') return text
      const whys = (answer.whys ?? []).map((why) => why.trim()).filter((why) => why !== '')
      if (whys.length > 0) return whys.join('\n')
    }
  }
  for (const entry of data.evidence) {
    if (entry.stageId === guardian.originStageId && entry.text.trim() !== '') return entry.text
  }
  return guardian.statement
}

export function UiRoot(): ReactElement {
  const mode = useUiStore((s) => s.mode)
  const activeQid = useUiStore((s) => s.activeQid)
  const shadowVisible = useUiStore((s) => s.shadow.visible)
  const data = useQuestData()

  /** deep-link flag: the next Registry open focuses the riskiest guardian */
  const [focusRiskiest, setFocusRiskiest] = useState(false)
  /** once dismissed, the Shadow stays away until the divergence clears and returns */
  const dismissLatch = useRef(false)

  const summonNow = shouldSummonShadow(data)
  const inTrough = trough(data)

  // The Vault unseals at Stage 3 (canon 01) — a one-way flag. Fires on first
  // reach AND on a reload that resumes at World 3+ (currentStage is device-local,
  // never inside founders-quest:v3), so the seal state always matches the world.
  const currentStage = useJourneyStore((s) => s.currentStage)
  useEffect(() => {
    const VAULT_UNSEAL_STAGE = 3
    if (currentStage >= VAULT_UNSEAL_STAGE && !data.vaultUnlocked) {
      questStore.getState().unlockVault()
    }
  }, [currentStage, data.vaultUnlocked])

  useEffect(() => {
    const ui = useUiStore.getState()
    // the Shadow holds fire in the trough (02/03): if the weather sinks while
    // it stands, it withdraws on its own — NOT a player dismiss, so no latch
    if (inTrough && ui.shadow.visible) ui.dismissShadow()
    if (!summonNow) {
      // trough or closed divergence: either way the summons condition is gone
      dismissLatch.current = false
      return
    }
    // never interrupt a trance or panel — defer the summons until the player
    // returns to roam (this effect re-runs on every mode change)
    if (mode !== 'roam') return
    if (dismissLatch.current || ui.shadow.visible) return
    ui.summonShadow(chooseShadowQuote(data), UI.shadow.action)
  }, [summonNow, inTrough, mode, data])

  useEffect(() => {
    if (mode !== 'panel:registry' && focusRiskiest) setFocusRiskiest(false)
  }, [mode, focusRiskiest])

  const handleShadowDismiss = useCallback((): void => {
    dismissLatch.current = true
    useUiStore.getState().dismissShadow()
  }, [])

  const handleShadowAction = useCallback((): void => {
    dismissLatch.current = true
    useUiStore.getState().dismissShadow()
    setFocusRiskiest(true)
    useUiStore.getState().openPanel('panel:registry')
  }, [])

  return (
    <>
      <Hud />
      <FounderNaming />
      <OnboardingHint />
      {mode === 'trance' && activeQid !== null ? (
        // key: each shrine gets its own draft state (drafts are per-question)
        <TrancePanel key={activeQid} qid={activeQid} />
      ) : null}
      {mode === 'panel:vault' ? <VaultPanel /> : null}
      {mode === 'panel:registry' ? <RegistryPanel focusRiskiest={focusRiskiest} /> : null}
      {mode === 'panel:campfire' ? <CampfirePanel /> : null}
      {mode === 'panel:calibration' ? <CalibrationPanel /> : null}
      {mode === 'gate' ? <GatePanel /> : null}
      {mode === 'loop' ? <LoopPanel /> : null}
      {shadowVisible ? (
        <ShadowOverlay onAction={handleShadowAction} onDismiss={handleShadowDismiss} />
      ) : null}
      <DegradedBanner />
    </>
  )
}
