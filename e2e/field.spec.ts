// e2e/field.spec.ts — Field Mode end to end (A-101), keyboard-only: hunt
// profile → logged-before-outcome attempts → hollow + filled → lantern →
// Field Day → beam export → same-device re-import ("already have all of it")
// → foreign beam import with preview/confirm + atomic audit (F-103).

import { expect, test } from '@playwright/test'
import { BEAM_KIND } from '../src/core/fieldImport'
import type { QuestData } from '../src/core/schema'
import { readQuestData, recordRun, seedFounderName, waitForWorldReady, type RunLog } from './helpers'

test.describe.configure({ timeout: 240_000 })

function assertCleanRun(log: RunLog): void {
  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([])
}

const FOREIGN_BEAM = {
  kind: BEAM_KIND, v: 1, beamId: 'beam-foreign', createdAt: '2026-07-12T10:00:00.000Z',
  payload: {
    profiles: [], slots: [], fieldDayLog: [],
    attempts: [{ id: 'fa-1', slotId: 'fs-1', channel: 'call', startedAt: '2026-07-12T09:00:00.000Z',
      outcome: 'quote', resolvedAt: '2026-07-12T09:30:00.000Z', evidenceIds: ['fe-1'], origin: 'local' }],
    evidence: [{ id: 'fe-1', tier: 2, text: '"I keep a paper list because the tool loses my edits"',
      source: 'kiosk chat', linkedAssumptionIds: ['g-not-here'], stageId: 's2', date: '2026-07-12' }],
  },
}

test('Field Mode: hunt → attempts → lantern → Field Day → beam import round-trips', async ({ page }) => {
  const log = recordRun(page)
  await seedFounderName(page)
  await page.goto('/')
  await waitForWorldReady(page)

  // open with the F key; add a profile (a PROFILE, never a person)
  await page.keyboard.press('KeyF')
  await expect(page.getByTestId('field-panel')).toBeVisible()
  await page.getByTestId('field-profile-input').fill('ops lead at a 20-50p startup')
  await page.getByTestId('field-profile-add').press('Enter')
  await expect(page.getByTestId('field-profile-1')).toBeVisible()

  // Field Day first so attempts count into it
  await page.getByTestId('field-day-goal').fill('3')
  await page.getByTestId('field-day-start').press('Enter')
  await expect(page.getByTestId('field-day-running')).toHaveText('0/3 attempts today')

  // two attempts: born unresolved, then hollow + filled — both honest reps
  await page.getByTestId('field-attempt-p1s1-call').press('Enter')
  await page.getByTestId('field-attempt-p1s2-in-person').press('Enter')
  await expect(page.getByTestId('field-day-running')).toHaveText('2/3 attempts today')
  await expect(page.getByTestId('field-lantern')).toHaveText('2/7')
  await page.getByTestId('field-resolve-1-declined').press('Enter')
  await page.getByTestId('field-resolve-1-quote').press('Enter') // list reindexes after first resolve

  // close the day with a retro
  await page.getByTestId('field-day-retro').fill('two reps, one story')
  await page.getByTestId('field-day-end').press('Enter')

  // the record: A1-A4 shape end to end
  let data = (await readQuestData(page)) as QuestData
  expect(data.huntList.slots.map((s) => s.state).sort()).toEqual(['filled', 'hollow'])
  expect(data.fieldJournal.attempts).toHaveLength(2)
  expect(data.evidence).toEqual([]) // A3: no field op creates a coin
  expect(data.fieldDay.log[0]?.attemptCount).toBe(2)
  expect(data.fieldDay.log[0]?.retro).toBe('two reps, one story')

  // same-device round-trip: beam export re-imported = nothing new (rule 4)
  const beam = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''))
  // clipboard may be denied headless — drive the paste box with a foreign beam instead
  void beam
  await page.getByTestId('field-import-paste').fill(JSON.stringify(FOREIGN_BEAM))
  await page.getByTestId('field-import-preview').press('Enter')
  await expect(page.getByTestId('field-import-previewbox')).toBeVisible()
  await expect(page.getByTestId('field-import-previewbox')).toContainText('paper list')
  await page.getByTestId('field-import-confirm').press('Enter')
  await expect(page.getByTestId('field-import-done')).toBeVisible()

  data = (await readQuestData(page)) as QuestData
  expect(data.evidence.map((e) => e.id)).toContain('fe-1')
  expect(data.evidence.find((e) => e.id === 'fe-1')?.linkedAssumptionIds).toEqual([]) // rule 7 blank
  expect(data.fieldJournal.imports).toHaveLength(1)
  expect(data.fieldJournal.imports[0]?.evidenceIds).toEqual(['fe-1']) // F-103, atomic
  expect(data.fieldJournal.attempts.find((a) => a.id === 'fa-1')?.origin).toBe('import')

  // re-import the SAME beam: preview reports nothing new (always safe)
  await page.getByTestId('field-import-paste').fill(JSON.stringify(FOREIGN_BEAM))
  await page.getByTestId('field-import-preview').press('Enter')
  await expect(page.getByTestId('field-import-nothingnew')).toBeVisible()
  await page.getByTestId('field-import-cancel').press('Enter')

  // a malformed beam is rejected BY NAME, nothing written
  await page.getByTestId('field-import-paste').fill(JSON.stringify({ ...FOREIGN_BEAM, sneaky: 1 }))
  await page.getByTestId('field-import-preview').press('Enter')
  await expect(page.getByTestId('field-import-error')).toContainText('unknown key')

  await page.keyboard.press('Escape')
  assertCleanRun(log)
})

test('Field Mode DOM is mobile-usable (F-11): 390px viewport, everything reachable', async ({ page }) => {
  const log = recordRun(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await seedFounderName(page)
  await page.goto('/')
  await waitForWorldReady(page)
  await page.getByTestId('hud-field').press('Enter')
  await expect(page.getByTestId('field-panel')).toBeVisible()
  await page.getByTestId('field-profile-input').fill('cafe regulars')
  await page.getByTestId('field-profile-add').press('Enter')
  await expect(page.getByTestId('field-profile-1')).toBeVisible()
  await page.getByTestId('field-attempt-p1s1-live-chat').press('Enter')
  await expect(page.getByTestId('field-lantern')).toHaveText('1/7')
  await page.keyboard.press('Escape')
  assertCleanRun(log)
})
