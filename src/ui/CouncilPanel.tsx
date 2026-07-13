// src/ui/CouncilPanel.tsx — the Council temple surface (C-1). Three rooms:
// the KEY (device-side under its own storage key, consent-precedes-store,
// visible remove control — canon 04/05), CONSENT (once, stored, with the
// cost-transparency sentence), and the READING — where the LIVE rite stays
// honestly DARK (BLOCKERS B-4) while the canonical pasted-reading path works
// today: copy the compact journal, carry it to your own Claude, paste the
// reading back (council[].source 'pasted', model labeled).
//
// The key NEVER passes through the quest store or serializer (guard-tested);
// this panel talks to the key manager alone, and only ever as a bare string
// in memory. Nothing here performs any network call.

import { useId, useMemo, useState, type ReactElement } from 'react'
import { buildJournalMd } from '../core/serializer'
import { createKeyManager, KEY_STORAGE_KEY, type KeyManager } from '../key/keyManager'
import { useQuestStore } from '../state/store'
import { useUiStore } from '../state/ui'
import {
  CONSENT_COPY,
  KEY_COPY,
  STANDING_CAPTION,
  TEMPLE,
} from '../strings'
import { DialogShell } from './TrancePanel'

/** the app's one key manager — localStorage-backed, lazily built (SSR-safe) */
let appKeyManager: KeyManager | null = null
function keyManager(): KeyManager {
  if (appKeyManager === null) {
    appKeyManager = createKeyManager({
      get: (k) => window.localStorage.getItem(k),
      set: (k, v) => window.localStorage.setItem(k, v),
      remove: (k) => window.localStorage.removeItem(k),
    })
  }
  return appKeyManager
}
void KEY_STORAGE_KEY // the key's own storage key — documented import, no other use

export function CouncilPanel(): ReactElement {
  const data = useQuestStore((s) => s.data)
  const setCouncilConsent = useQuestStore((s) => s.setCouncilConsent)
  const addPastedReading = useQuestStore((s) => s.addPastedReading)
  const closePanel = useUiStore((s) => s.closePanel)
  const titleId = useId()

  const [keyDraft, setKeyDraft] = useState('')
  const [hasKey, setHasKey] = useState(() => keyManager().getKey() !== null)
  const [journalCopied, setJournalCopied] = useState(false)
  const [readingDraft, setReadingDraft] = useState('')

  const consented = data.councilConsent
  const compactJournal = useMemo(() => buildJournalMd(data, 'compact'), [data])

  const onSaveKey = (): void => {
    const key = keyDraft.trim()
    if (key === '' || !consented) return
    keyManager().replaceKey(key, { accepted: true, at: new Date().toISOString() })
    setKeyDraft('')
    setHasKey(true)
  }

  const onRemoveKey = (): void => {
    keyManager().removeKey()
    setHasKey(false)
  }

  const onCopyJournal = (): void => {
    void navigator.clipboard?.writeText(compactJournal).then(() => setJournalCopied(true))
  }

  const onSaveReading = (): void => {
    if (readingDraft.trim() === '') return
    addPastedReading(readingDraft)
    setReadingDraft('')
  }

  return (
    <DialogShell
      titleId={titleId}
      onClose={closePanel}
      testId="council-panel"
      layerClassName="z-panel"
      panelClassName="max-w-2xl"
    >
      <h2 id={titleId} className="quest-heading text-xl font-semibold">
        {TEMPLE.title}
      </h2>
      {/* the standing caption — always visible beside the Council (04) */}
      <p className="mt-1 text-2xs italic text-ink-faint">{STANDING_CAPTION}</p>

      {/* CONSENT — once, stored; the cost sentence precedes any send affordance */}
      <section className="mt-4 border-t border-white/10 pt-3">
        <h3 className="quest-label text-2xs text-amber-accent-600">{TEMPLE.consent.heading}</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">{CONSENT_COPY}</p>
        {consented ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span data-testid="council-consented" className="text-xs text-ink">
              {TEMPLE.consent.granted}
            </span>
            <button
              type="button"
              data-testid="council-consent-withdraw"
              onClick={() => setCouncilConsent(false)}
              className="quest-btn quest-btn-quiet px-2 py-0.5 text-2xs"
            >
              {TEMPLE.consent.withdraw}
            </button>
          </div>
        ) : (
          <button
            type="button"
            data-testid="council-consent-grant"
            onClick={() => setCouncilConsent(true)}
            className="quest-btn quest-btn-gold mt-2 px-3 py-1.5 text-sm"
          >
            {TEMPLE.consent.grant}
          </button>
        )}
      </section>

      {/* the KEY — device-side, own storage key, visible remove control */}
      <section className="mt-4 border-t border-white/10 pt-3">
        <h3 className="quest-label text-2xs text-amber-accent-600">{TEMPLE.key.heading}</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">{KEY_COPY}</p>
        {hasKey ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span data-testid="council-key-saved" className="text-xs text-ink">
              {TEMPLE.key.saved}
            </span>
            <button
              type="button"
              data-testid="council-key-remove"
              onClick={onRemoveKey}
              className="quest-btn quest-btn-quiet px-2 py-0.5 text-2xs"
            >
              {TEMPLE.key.remove}
            </button>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder={TEMPLE.key.placeholder}
              aria-label={TEMPLE.key.heading}
              autoComplete="off"
              data-testid="council-key-input"
              className="quest-input min-w-0 flex-1 px-2 py-1.5 font-mono text-sm normal-case tracking-normal"
            />
            <button
              type="button"
              data-testid="council-key-save"
              disabled={!consented || keyDraft.trim() === ''}
              onClick={onSaveKey}
              title={consented ? undefined : TEMPLE.consent.heading}
              className="quest-btn quest-btn-gold px-3 py-1.5 text-sm disabled:opacity-40"
            >
              {TEMPLE.key.save}
            </button>
          </div>
        )}
        {!hasKey ? (
          <p className="mt-1 text-2xs italic text-ink-faint">{TEMPLE.key.none}</p>
        ) : null}
      </section>

      {/* the LIVE rite — honestly dark until B-4 resolves */}
      <section className="mt-4 border-t border-white/10 pt-3">
        <h3 className="quest-label text-2xs text-amber-accent-600">{TEMPLE.live.heading}</h3>
        <p data-testid="council-live-dark" className="mt-1 text-xs italic text-ink-faint">
          {TEMPLE.live.dark}
        </p>
        <button
          type="button"
          data-testid="council-live-button"
          disabled
          className="quest-btn quest-btn-quiet mt-2 px-3 py-1.5 text-sm opacity-40"
        >
          {TEMPLE.live.button}
        </button>
      </section>

      {/* the reading BY HAND — the canonical zero-key path (04 source:'pasted') */}
      <section className="mt-4 border-t border-white/10 pt-3">
        <h3 className="quest-label text-2xs text-amber-accent-600">{TEMPLE.pasted.heading}</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">{TEMPLE.pasted.gloss}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="council-copy-journal"
            disabled={!consented}
            onClick={onCopyJournal}
            className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm disabled:opacity-40"
          >
            {TEMPLE.pasted.copyJournal}
          </button>
          {journalCopied ? (
            <span data-testid="council-journal-copied" className="text-2xs italic text-ink-faint">
              {TEMPLE.pasted.copied}
            </span>
          ) : null}
        </div>
        <label className="mt-3 flex flex-col gap-1">
          <span className="quest-label text-2xs">{TEMPLE.pasted.pasteLabel}</span>
          <textarea
            value={readingDraft}
            onChange={(e) => setReadingDraft(e.target.value)}
            rows={3}
            data-testid="council-reading-paste"
            className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
          />
        </label>
        <button
          type="button"
          data-testid="council-reading-save"
          disabled={readingDraft.trim() === ''}
          onClick={onSaveReading}
          className="quest-btn quest-btn-seal mt-2 text-sm disabled:opacity-40"
        >
          {TEMPLE.pasted.save}
        </button>
      </section>

      {/* past readings — every reading names its model/source (02/05) */}
      <section className="mt-4 border-t border-white/10 pt-3">
        <h3 className="quest-label text-2xs text-amber-accent-600">{TEMPLE.readings.heading}</h3>
        {data.council.length === 0 ? (
          <p data-testid="council-readings-empty" className="mt-1 text-sm italic text-ink-faint">
            {TEMPLE.readings.empty}
          </p>
        ) : (
          <ul className="mt-2 flex max-h-40 flex-col gap-2 overflow-y-auto pr-1">
            {data.council.map((reading, index) => (
              <li key={reading.id} data-testid={`council-reading-${index + 1}`} className="quest-aside p-2.5">
                <p className="text-2xs text-ink-faint">
                  {reading.date.slice(0, 10)} ·{' '}
                  {reading.source === 'pasted' ? TEMPLE.readings.pastedBy : reading.model}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-xs text-ink">{reading.reading}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DialogShell>
  )
}
