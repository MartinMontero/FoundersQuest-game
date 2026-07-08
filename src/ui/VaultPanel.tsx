// src/ui/VaultPanel.tsx — the sealed monument's panel: sealed state + count
// ONLY (canon 01: captured, visible, sealed until Stage 3 — no content reveal
// in this phase). Capture always works: a two-tap capture (button → confirm)
// with zero justification (law 10) via captureVault.

import { useId, useState, type ReactElement } from 'react'
import { useQuestStore } from '../state/store'
import { useUiStore } from '../state/ui'
import { UI } from '../strings'
import { DialogShell } from './TrancePanel'

export function VaultPanel(): ReactElement {
  const count = useQuestStore((s) => s.data.vault.length)
  const captureVault = useQuestStore((s) => s.captureVault)
  const closePanel = useUiStore((s) => s.closePanel)
  const titleId = useId()

  const [text, setText] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [captured, setCaptured] = useState(false)

  const capture = (): void => {
    captureVault(text.trim())
    setText('')
    setConfirming(false)
    setCaptured(true)
  }

  return (
    <DialogShell titleId={titleId} onClose={closePanel} layerClassName="z-panel" testId="vault-panel">
      <h2 id={titleId} className="text-lg font-semibold text-slate-100">
        {UI.vault.panelTitle}
      </h2>
      <p className="mt-1 text-sm text-slate-400">{UI.vault.sealedLine}</p>
      <p data-testid="vault-count" className="mt-3 text-base text-slate-100">
        {UI.vault.countLabel(count)}
      </p>

      {/* capture always works — two taps, zero justification (law 10) */}
      <div className="mt-4 flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-2xs uppercase tracking-wide text-slate-400">
          <span>{UI.vault.captureLabel}</span>
          <input
            data-testid="vault-capture-text"
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setConfirming(false)
            }}
            className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm normal-case tracking-normal text-slate-100"
          />
        </label>
        <div className="flex items-center gap-2">
          {confirming ? (
            <button
              type="button"
              data-testid="vault-capture-confirm"
              onClick={capture}
              className="rounded bg-violet-400 px-3 py-1.5 text-sm font-semibold text-slate-950"
            >
              {UI.vault.nudgeConfirm}
            </button>
          ) : (
            <button
              type="button"
              data-testid="vault-capture"
              disabled={text.trim() === ''}
              onClick={() => setConfirming(true)}
              className="rounded border border-violet-400 px-3 py-1.5 text-sm text-violet-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {UI.vault.nudgeCapture}
            </button>
          )}
          {captured ? (
            <p role="status" className="text-2xs text-violet-300">
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
          className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-200"
        >
          {UI.common.close}
        </button>
      </div>
    </DialogShell>
  )
}
