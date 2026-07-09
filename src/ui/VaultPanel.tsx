// src/ui/VaultPanel.tsx — the sealed monument's panel: sealed state + count
// ONLY (canon 01: captured, visible, sealed until Stage 3 — no content reveal
// in this phase). Capture always works: a two-tap capture (button → confirm)
// with zero justification (law 10) via captureVault.

import { useId, useRef, useState, type ReactElement } from 'react'
import { useQuestStore } from '../state/store'
import { useUiStore } from '../state/ui'
import { UI } from '../strings'
import { focusAfterCommit } from './focus'
import { DialogShell } from './TrancePanel'

export function VaultPanel(): ReactElement {
  const count = useQuestStore((s) => s.data.vault.length)
  const captureVault = useQuestStore((s) => s.captureVault)
  const closePanel = useUiStore((s) => s.closePanel)
  const titleId = useId()
  const textRef = useRef<HTMLInputElement | null>(null)

  const [text, setText] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [captured, setCaptured] = useState(false)

  const capture = (): void => {
    captureVault(text.trim())
    setText('')
    setConfirming(false)
    setCaptured(true)
    // the confirm button unmounts on commit — hand focus to the capture field
    focusAfterCommit(() => textRef.current)
  }

  return (
    <DialogShell titleId={titleId} onClose={closePanel} layerClassName="z-panel" testId="vault-panel">
      <div
        aria-hidden="true"
        className="mb-3 h-px w-16 rounded-full bg-gradient-to-r from-ink-line/70 to-transparent"
      />
      <h2 id={titleId} className="quest-heading text-xl font-semibold">
        {UI.vault.panelTitle}
      </h2>
      <p className="mt-2 text-xs text-ink-faint">{UI.vault.sealedLine}</p>
      <p
        data-testid="vault-count"
        className="quest-heading mt-4 text-2xl font-semibold text-ink"
      >
        {UI.vault.countLabel(count)}
      </p>

      {/* capture always works — two taps, zero justification (law 10) */}
      <div className="mt-5 flex flex-col gap-2">
        <label className="quest-label flex flex-col gap-1 text-2xs">
          <span>{UI.vault.captureLabel}</span>
          <input
            ref={textRef}
            data-testid="vault-capture-text"
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setConfirming(false)
            }}
            className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
          />
        </label>
        <div className="flex items-center gap-2">
          {confirming ? (
            <button
              type="button"
              data-testid="vault-capture-confirm"
              onClick={capture}
              className="quest-btn quest-btn-violet px-3 py-1.5 text-sm"
            >
              {UI.vault.nudgeConfirm}
            </button>
          ) : (
            <button
              type="button"
              data-testid="vault-capture"
              disabled={text.trim() === ''}
              onClick={() => setConfirming(true)}
              className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
            >
              {UI.vault.nudgeCapture}
            </button>
          )}
          {captured ? (
            <p role="status" className="text-2xs font-medium text-[#5f43aa]">
              {UI.vault.nudgeCaptured}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          data-testid="vault-close"
          onClick={closePanel}
          className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
        >
          {UI.common.close}
        </button>
      </div>
    </DialogShell>
  )
}
