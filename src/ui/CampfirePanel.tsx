// src/ui/CampfirePanel.tsx — the campfire rest hub (J16). One waypoint gathers
// the furniture: the weather totem (weather[], R-W append), the field-notes
// lectern (fieldNotes for THIS world), the side-quest board (sideQuests, 03),
// the journal export desk (buildJournalMd — a local download, nothing leaves
// the device), and the founder's own Dinner Card (dinnerCard, R3). Zero network.

import { useEffect, useId, useState, useSyncExternalStore, type ReactElement } from 'react'
import { buildJournalMd } from '../core/serializer'
import type { WeatherEntry } from '../core/schema'
import { useJourneyStore } from '../state/journey'
import { questStore, useQuestData, useQuestStore } from '../state/store'
import { useUiStore } from '../state/ui'
import { AUDIO, CREDITS, DEVICE, FIRST_LIGHT, SIDE_QUESTS, SIDE_QUESTS_RULE, UI, WEATHER_LABELS } from '../strings'
import { readAudioSettings, writeAudioSettings } from '../audio/AudioDirector'
import { installOffered, isPersisted, promptInstall, requestPersistence, subscribeInstall } from '../pwa'
import { DialogShell } from './TrancePanel'

const WEATHER_VALUES: readonly WeatherEntry['value'][] = [1, 2, 3, 4, 5]

/** Download the full journal as a local Markdown file — no network (the founder
 *  saves their OWN record to their OWN disk; nothing is sent anywhere). */
function downloadJournal(md: string): void {
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'founders-quest-journal.md'
  a.click()
  URL.revokeObjectURL(url)
}

export function CampfirePanel(): ReactElement {
  const data = useQuestData()
  const stage = useJourneyStore((s) => s.currentStage)
  const logWeather = useQuestStore((s) => s.logWeather)
  const saveFieldNote = useQuestStore((s) => s.saveFieldNote)
  const startSideQuest = useQuestStore((s) => s.startSideQuest)
  const completeSideQuest = useQuestStore((s) => s.completeSideQuest)
  const setDinnerCard = useQuestStore((s) => s.setDinnerCard)
  const closePanel = useUiStore((s) => s.closePanel)
  const openPanel = useUiStore((s) => s.openPanel)
  const titleId = useId()

  const stageId = `s${stage}`
  const [note, setNote] = useState(data.fieldNotes[stageId] ?? '')
  const [noteSaved, setNoteSaved] = useState(false)
  const [dinner, setDinner] = useState(data.dinnerCard?.text ?? '')
  const [dinnerSaved, setDinnerSaved] = useState(false)

  // this-device honesty (F-9): install offer + the durable-storage promise
  const installReady = useSyncExternalStore(subscribeInstall, installOffered)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  useEffect(() => {
    void isPersisted().then(setPersisted)
  }, [])
  const onInstall = (): void => {
    void promptInstall()
      .then(requestPersistence)
      .then(isPersisted)
      .then(setPersisted)
  }

  const lastWeather = data.weather[data.weather.length - 1]

  return (
    <DialogShell
      titleId={titleId}
      onClose={closePanel}
      layerClassName="z-panel"
      panelClassName="max-w-2xl"
      testId="campfire-panel"
    >
      <div
        aria-hidden="true"
        className="mb-3 h-px w-16 rounded-full bg-gradient-to-r from-amber-accent-500/70 to-transparent"
      />
      <h2 id={titleId} className="quest-heading text-xl font-semibold">
        {UI.campfire.title}
      </h2>

      {/* ---- sound furniture (A-1): synthesized, silence-default, own key ---- */}
      <fieldset className="quest-aside mt-3 p-3">
        <legend className="quest-label px-1.5 text-2xs">{AUDIO.legend}</legend>
        <p className="text-2xs text-ink-faint">{AUDIO.hint}</p>
        <div className="mt-2 flex flex-col gap-1.5">
          {(['master', 'ambient', 'cues'] as const).map((channel) => (
            <label key={channel} className="flex items-center gap-2 text-xs text-ink-soft">
              <span className="w-16">{AUDIO[channel]}</span>
              <input
                type="range"
                min={0}
                max={100}
                defaultValue={Math.round(readAudioSettings()[channel] * 100)}
                onChange={(e) => writeAudioSettings({ [channel]: Number(e.target.value) / 100 })}
                data-testid={`campfire-audio-${channel}`}
                className="w-40 accent-amber-accent-500"
                aria-label={AUDIO[channel]}
              />
            </label>
          ))}
        </div>
      </fieldset>

      {/* ---- weather totem: one tap, every reading kept (R-W append) ---- */}
      <fieldset className="quest-aside mt-5 p-4">
        <legend className="quest-label px-1.5 text-2xs">{UI.campfire.weatherLegend}</legend>
        <p className="text-2xs text-ink-faint">{UI.campfire.weatherHint}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEATHER_VALUES.map((v) => (
            <button
              key={v}
              type="button"
              data-testid={`campfire-weather-${v}`}
              onClick={() => logWeather(v)}
              className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
            >
              {WEATHER_LABELS[v]}
            </button>
          ))}
        </div>
        <p data-testid="campfire-weather-last" className="mt-2 text-2xs text-amber-accent-600">
          {lastWeather !== undefined
            ? UI.campfire.weatherLast(WEATHER_LABELS[lastWeather.value])
            : UI.campfire.weatherNone}
        </p>
      </fieldset>

      {/* ---- field-notes lectern: this world's own note ---- */}
      <fieldset className="quest-aside mt-4 p-4">
        <legend className="quest-label px-1.5 text-2xs">{UI.campfire.notesLegend}</legend>
        <label className="quest-label flex flex-col gap-1 text-2xs">
          <span>{UI.campfire.notesLabel}</span>
          <textarea
            data-testid="campfire-note"
            value={note}
            placeholder={UI.campfire.notesPlaceholder}
            onChange={(event) => {
              setNote(event.target.value)
              setNoteSaved(false)
            }}
            rows={3}
            className="quest-paper text-sm"
          />
        </label>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            data-testid="campfire-note-save"
            onClick={() => {
              saveFieldNote(stageId, note)
              setNoteSaved(true)
            }}
            className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
          >
            {UI.campfire.save}
          </button>
          {noteSaved ? (
            <span className="text-2xs text-amber-accent-600">{UI.campfire.notesSaved}</span>
          ) : null}
        </div>
      </fieldset>

      {/* ---- side-quest board (03): accept / complete ---- */}
      <fieldset className="quest-aside mt-4 p-4">
        <legend className="quest-label px-1.5 text-2xs">{UI.campfire.questsLegend}</legend>
        <p className="text-2xs italic text-ink-faint">{SIDE_QUESTS_RULE}</p>
        <ul className="mt-2 flex flex-col gap-2">
          {SIDE_QUESTS.map((quest) => {
            const rec = data.sideQuests[quest.name]
            return (
              <li key={quest.name} className="flex items-start justify-between gap-2">
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-ink">{quest.name}</span>
                  <span className="text-2xs text-ink-faint">{quest.note}</span>
                </span>
                {rec === undefined ? (
                  <button
                    type="button"
                    data-testid={`campfire-quest-accept-${quest.name}`}
                    onClick={() => startSideQuest(quest.name, quest.name)}
                    className="quest-btn quest-btn-quiet px-3 py-1 text-2xs"
                  >
                    {UI.campfire.questAccept}
                  </button>
                ) : rec.completedAt !== undefined ? (
                  <span
                    data-testid={`campfire-quest-done-${quest.name}`}
                    className="quest-eyebrow whitespace-nowrap text-2xs text-amber-accent-600"
                  >
                    {UI.campfire.questDone}
                  </span>
                ) : (
                  <button
                    type="button"
                    data-testid={`campfire-quest-complete-${quest.name}`}
                    onClick={() => completeSideQuest(quest.name)}
                    className="quest-btn quest-btn-gold px-3 py-1 text-2xs"
                  >
                    {UI.campfire.questComplete}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </fieldset>

      {/* ---- journal export desk: a local Markdown download ---- */}
      <fieldset className="quest-aside mt-4 p-4">
        <legend className="quest-label px-1.5 text-2xs">{UI.campfire.exportLegend}</legend>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="campfire-export"
            onClick={() => downloadJournal(buildJournalMd(data, 'full'))}
            className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
          >
            {UI.campfire.exportDownload}
          </button>
          {/* the attribution page (E-11) lives on the same desk — it is paper */}
          <button
            type="button"
            data-testid="campfire-credits"
            onClick={() => openPanel('panel:credits')}
            className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
          >
            {CREDITS.title}
          </button>
        </div>
        <p className="mt-2 text-2xs text-ink-faint">{UI.campfire.exportHint}</p>
      </fieldset>

      {/* ---- this device (F-9): install offer + storage honesty, transfer first ---- */}
      <fieldset className="quest-aside mt-4 p-4">
        <legend className="quest-label px-1.5 text-2xs">{DEVICE.legend}</legend>
        <p className="text-2xs text-ink-faint">{DEVICE.hint}</p>
        {persisted !== null ? (
          <p data-testid="campfire-persisted" className="mt-1.5 text-2xs text-ink-soft">
            {persisted ? DEVICE.persisted : DEVICE.notPersisted}
          </p>
        ) : null}
        {installReady ? (
          <div className="mt-2">
            <button
              type="button"
              data-testid="campfire-install"
              onClick={onInstall}
              className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
            >
              {DEVICE.install}
            </button>
            <p className="mt-1 text-2xs text-ink-faint">{DEVICE.installHint}</p>
          </div>
        ) : null}
        <p data-testid="campfire-transfer-first" className="mt-2 text-2xs text-amber-accent-600">
          {DEVICE.transferFirst}
        </p>
      </fieldset>

      {/* ---- Dinner Card: the founder's own card that leads the Brief (R3) ---- */}
      <fieldset className="quest-aside mt-4 p-4">
        <legend className="quest-label px-1.5 text-2xs">{UI.campfire.dinnerLegend}</legend>
        <label className="quest-label flex flex-col gap-1 text-2xs">
          <span>{UI.campfire.dinnerLabel}</span>
          <textarea
            data-testid="campfire-dinner"
            value={dinner}
            placeholder={UI.campfire.dinnerPlaceholder}
            onChange={(event) => {
              setDinner(event.target.value)
              setDinnerSaved(false)
            }}
            rows={3}
            className="quest-paper text-sm"
          />
        </label>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            data-testid="campfire-dinner-save"
            onClick={() => {
              setDinnerCard(dinner)
              setDinnerSaved(true)
            }}
            className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
          >
            {UI.campfire.save}
          </button>
          {dinnerSaved ? (
            <span className="text-2xs text-amber-accent-600">{UI.campfire.dinnerSaved}</span>
          ) : null}
        </div>
      </fieldset>

      <div className="mt-6">
        <button
          type="button"
          data-testid="campfire-replay-firstlight"
          onClick={() => {
            closePanel()
            questStore.getState().setOpeningBeat(2)
          }}
          className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
        >
          {FIRST_LIGHT.reentry.campfireReplay}
        </button>
        <button
          type="button"
          data-testid="campfire-close"
          onClick={closePanel}
          className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
        >
          {UI.common.close}
        </button>
      </div>
    </DialogShell>
  )
}
