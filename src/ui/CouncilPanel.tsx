// src/ui/CouncilPanel.tsx — the Council temple surface (C-1). Three rooms:
// the KEY (device-side under its own storage key, consent-precedes-store,
// visible remove control — canon 04/05), CONSENT (once, stored, with the
// cost-transparency sentence), and the READING — the LIVE rite (open since
// B-4 resolved 2026-07-13): one press builds the compact journal, hands it to
// the transport's convene() — the ONLY module in src that touches the network
// — and lands the returned page as a reading that names its model. The
// by-hand pasted path stays as the canonical zero-key alternative.
//
// The key NEVER passes through the quest store or serializer (guard-tested);
// this panel reads it from the key manager at press time, as a bare string,
// and hands it to the transport — it is never held in component state.

import { useId, useMemo, useState, useSyncExternalStore, type ReactElement } from 'react'
import { thinInk } from '../core/metrics'
import { buildJournalMd } from '../core/serializer'
import { makeStore } from '../core/store'
import { createKeyManager, KEY_STORAGE_KEY, type KeyManager } from '../key/keyManager'
import { createSettings } from '../settings'
import { questStore, useQuestStore } from '../state/store'
import { useUiStore } from '../state/ui'
import { convene, FALLBACK_MODEL } from '../transport/council'
import {
  COMMITMENT_GATE_COPY,
  CONSENT_COPY,
  COUNCIL_FAILURE_COPY,
  COUNCIL_SYSTEM_PROMPT,
  KEY_COPY,
  STANDING_CAPTION,
  TEMPLE,
  THIN_INK,
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

/** device-local settings ladder — holds the fallback-sage acceptance (05) */
const settings = createSettings(makeStore())

// The convene in-flight flag lives at MODULE level, not component state: the
// panel unmounts on Esc while a request may run for up to 60s, and a remounted
// panel must still know the rite is underway — one press, one send, one charge
// against the player's key. useSyncExternalStore keeps the button honest.
let conveneActive = false
const conveneListeners = new Set<() => void>()
function setConveneActive(value: boolean): void {
  conveneActive = value
  for (const listener of conveneListeners) listener()
}
function subscribeConvene(listener: () => void): () => void {
  conveneListeners.add(listener)
  return (): void => {
    conveneListeners.delete(listener)
  }
}
function readConveneActive(): boolean {
  return conveneActive
}

export function CouncilPanel(): ReactElement {
  const data = useQuestStore((s) => s.data)
  const setCouncilConsent = useQuestStore((s) => s.setCouncilConsent)
  const addPastedReading = useQuestStore((s) => s.addPastedReading)
  const addLiveReading = useQuestStore((s) => s.addLiveReading)
  const setReadingCommitment = useQuestStore((s) => s.setReadingCommitment)
  const closePanel = useUiStore((s) => s.closePanel)
  const titleId = useId()

  const [keyDraft, setKeyDraft] = useState('')
  const [hasKey, setHasKey] = useState(() => keyManager().getKey() !== null)
  const [journalCopied, setJournalCopied] = useState(false)
  const [readingDraft, setReadingDraft] = useState('')
  const busy = useSyncExternalStore(subscribeConvene, readConveneActive)
  const [liveError, setLiveError] = useState<string | null>(null)
  const [offerFallback, setOfferFallback] = useState(false)
  // the commitment draft is KEYED to the reading it was typed for — if a new
  // reading lands mid-draft, the text must not silently re-attach to it (the
  // gate is write-once; a mis-sealed commitment could never be corrected)
  const [commitmentDraft, setCommitmentDraft] = useState<{ id: string; text: string }>({
    id: '',
    text: '',
  })

  const consented = data.councilConsent
  const thin = thinInk(data)
  const compactJournal = useMemo(() => buildJournalMd(data, 'compact'), [data])

  /**
   * The live rite: read the key at press time (never held in state), build the
   * journal ONCE, send, and land the result. The exact string sent is the exact
   * string snapshotted on the reading (02). Failures map to canon 04 copy; a
   * model-access failure becomes the fallback-sage OFFER, never an auto-switch
   * — unless the SAGE itself was refused, which is terminal chrome copy (the
   * offer must never promise a remedy that cannot occur).
   */
  const runConvene = async (fallbackAccepted: boolean): Promise<void> => {
    const key = keyManager().getKey()
    if (key === null || !consented || conveneActive) return
    setConveneActive(true)
    setLiveError(null)
    setOfferFallback(false)
    const journal = buildJournalMd(questStore.getState().data, 'compact')
    let result
    try {
      result = await convene({
        apiKey: key,
        system: COUNCIL_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: journal }],
        fallbackAccepted,
      })
    } finally {
      setConveneActive(false)
    }
    if (result.ok) {
      addLiveReading({ reading: result.text, model: result.model, journal })
      return
    }
    if (result.failure === 'model-access') {
      if (result.model === FALLBACK_MODEL) {
        // the fallback sage was refused too — offering it again would loop
        setLiveError(TEMPLE.live.fallbackUnavailable)
        return
      }
      setOfferFallback(true)
      return
    }
    if (result.failure === 'input-too-large') {
      // 02's local pre-flight guard — nothing was sent; not a canon error class
      setLiveError(TEMPLE.live.tooHeavy)
      return
    }
    setLiveError(COUNCIL_FAILURE_COPY[result.failure])
  }

  const onConvene = (): void => {
    void runConvene(settings.getFallbackAccepted())
  }

  /**
   * Accepting the offer persists (05) — every later reading names the sage.
   * Persist ONLY when the convene can actually run: if the key was removed or
   * consent withdrawn while the offer stood, a silent no-op must not flip the
   * stored acceptance for every future reading.
   */
  const onAcceptFallback = (): void => {
    if (keyManager().getKey() === null || !consented) {
      setOfferFallback(false)
      return
    }
    settings.acceptFallback()
    void runConvene(true)
  }

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
    // a standing offer must not outlive the key it would spend
    setOfferFallback(false)
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

      {/* the LIVE rite — open (B-4 resolved): one press, one page */}
      <section className="mt-4 border-t border-white/10 pt-3">
        <h3 className="quest-label text-2xs text-amber-accent-600">{TEMPLE.live.heading}</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">{TEMPLE.live.gloss}</p>
        {thin ? (
          <p data-testid="council-thin-ink" className="mt-1 text-xs italic text-ink-faint">
            {THIN_INK}
          </p>
        ) : null}
        <button
          type="button"
          data-testid="council-live-button"
          disabled={!consented || !hasKey || thin || busy}
          onClick={onConvene}
          title={consented ? undefined : TEMPLE.consent.heading}
          className="quest-btn quest-btn-gold mt-2 px-3 py-1.5 text-sm disabled:opacity-40"
        >
          {busy ? TEMPLE.live.busy : TEMPLE.live.button}
        </button>
        {!hasKey && consented ? (
          <p className="mt-1 text-2xs italic text-ink-faint">{TEMPLE.live.needsKey}</p>
        ) : null}
        {liveError !== null ? (
          <p role="alert" data-testid="council-live-error" className="mt-2 text-xs text-ember-300">
            {liveError}
          </p>
        ) : null}
        {offerFallback ? (
          <div data-testid="council-fallback-offer" className="quest-aside mt-2 p-2.5">
            <p className="text-xs leading-relaxed text-ink-soft">
              {COUNCIL_FAILURE_COPY['model-access']}
            </p>
            <button
              type="button"
              data-testid="council-fallback-accept"
              disabled={busy || !hasKey || !consented}
              onClick={onAcceptFallback}
              className="quest-btn quest-btn-gold mt-2 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              {TEMPLE.live.fallbackButton}
            </button>
          </div>
        ) : null}
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
          <ul className="mt-2 flex max-h-60 flex-col gap-2 overflow-y-auto pr-1">
            {data.council.map((reading, index) => (
              <li key={reading.id} data-testid={`council-reading-${index + 1}`} className="quest-aside p-2.5">
                <p className="text-2xs text-ink-faint">
                  {reading.date.slice(0, 10)} ·{' '}
                  {reading.source === 'pasted' ? TEMPLE.readings.pastedBy : reading.model}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-xs text-ink">{reading.reading}</p>
                {reading.commitment !== undefined ? (
                  // the sealed commitment rides its reading (04 — exported with it)
                  <p data-testid="council-commitment" className="mt-1.5 text-2xs italic text-amber-accent-200">
                    {TEMPLE.commitment.sealed(reading.commitment)}
                  </p>
                ) : index === data.council.length - 1 ? (
                  // the commitment gate (04, PIE): one thing you'll change — write
                  // once; follow-ups stay locked behind it when they arrive. The
                  // draft belongs to THIS reading: text typed for an earlier one
                  // renders empty here and can never seal onto the wrong reading.
                  <div className="mt-2 border-t border-white/10 pt-2">
                    <p className="text-2xs italic text-ink-faint">{COMMITMENT_GATE_COPY}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <input
                        value={commitmentDraft.id === reading.id ? commitmentDraft.text : ''}
                        onChange={(e) =>
                          setCommitmentDraft({ id: reading.id, text: e.target.value })
                        }
                        aria-label={TEMPLE.commitment.label}
                        data-testid="council-commitment-input"
                        className="quest-input min-w-0 flex-1 px-2 py-1 text-xs normal-case tracking-normal"
                      />
                      <button
                        type="button"
                        data-testid="council-commitment-save"
                        disabled={
                          commitmentDraft.id !== reading.id || commitmentDraft.text.trim() === ''
                        }
                        onClick={() => {
                          setReadingCommitment(reading.id, commitmentDraft.text)
                          setCommitmentDraft({ id: '', text: '' })
                        }}
                        className="quest-btn quest-btn-quiet px-2 py-1 text-2xs disabled:opacity-40"
                      >
                        {TEMPLE.commitment.save}
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </DialogShell>
  )
}
