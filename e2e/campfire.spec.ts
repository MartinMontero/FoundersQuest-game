// e2e/campfire.spec.ts — the campfire hub (J16), driven through the real world +
// store. One waypoint: weather totem (R-W append), field-notes lectern, side-quest
// board, and Dinner Card all write the exact founders-quest:v3 keys. Keyboard only;
// zero Anthropic. (The journal export is a local download — its markdown is
// unit-tested via buildJournalMd; the button is asserted present here.)

import { expect, test } from '@playwright/test'
import { STORAGE_KEY, type QuestData } from '../src/core/schema'
import { JOURNEY_STORAGE_KEY } from '../src/state/journey'
import { recordRun, seedFounderName, tabToTarget, waitForWorldReady } from './helpers'

test.describe.configure({ timeout: 240_000 })

async function readData(page: import('@playwright/test').Page): Promise<QuestData> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)
  if (raw === null) throw new Error('founders-quest:v3 not written')
  return JSON.parse(raw) as QuestData
}

test('Campfire hub: weather appends, a field note + Dinner Card save, a side quest completes', async ({
  page,
}) => {
  const log = recordRun(page)
  await seedFounderName(page)
  await page.addInitScript(
    ([jk]) => {
      try {
        window.localStorage.setItem(jk as string, '2') // World 2 (The Raven)
      } catch {
        // storage blocked — not this spec's concern
      }
    },
    [JOURNEY_STORAGE_KEY],
  )
  await page.goto('/')
  await waitForWorldReady(page)

  // rest at the campfire
  await tabToTarget(page, 'campfire')
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('campfire-panel')).toBeVisible()

  // weather totem — two taps the SAME day are BOTH kept (R-W append)
  await page.getByTestId('campfire-weather-1').press('Enter') // Storm
  await page.getByTestId('campfire-weather-4').press('Enter') // Breaks
  await expect(page.getByTestId('campfire-weather-last')).toContainText('Breaks')

  // field-notes lectern — this world's note
  const NOTE = 'three cafés said no; one asked to keep the sheet'
  await page.getByTestId('campfire-note').fill(NOTE)
  await page.getByTestId('campfire-note-save').press('Enter')

  // side-quest board — accept then complete "The 404"
  await page.getByTestId('campfire-quest-accept-The 404').press('Enter')
  await page.getByTestId('campfire-quest-complete-The 404').press('Enter')
  await expect(page.getByTestId('campfire-quest-done-The 404')).toBeVisible()

  // Dinner Card — the founder's own card
  const DINNER = 'my pipeline is all warm intros — no cold demand yet'
  await page.getByTestId('campfire-dinner').fill(DINNER)
  await page.getByTestId('campfire-dinner-save').press('Enter')

  // the journal export desk exists (its markdown is unit-tested via buildJournalMd)
  await expect(page.getByTestId('campfire-export')).toBeVisible()

  // the attribution page (E-11): opens from the desk, honest about the one
  // non-CC0 entry (MIT vendored encoder), closes back to the world
  await page.getByTestId('campfire-credits').press('Enter')
  await expect(page.getByTestId('credits-panel')).toBeVisible()
  await expect(page.getByTestId('credits-models')).toContainText('Kay Lousberg')
  await expect(page.getByTestId('credits-code')).toContainText('MIT')
  await expect(page.getByTestId('credits-code-notes')).toContainText('DENSO WAVE')
  await page.getByTestId('credits-close').press('Enter')

  const data = await readData(page)
  expect(data.weather.map((w) => w.value)).toEqual([1, 4]) // both taps kept, in order
  expect(data.fieldNotes['s2']).toBe(NOTE)
  expect(data.sideQuests['The 404']?.startedAt).toBeTruthy()
  expect(data.sideQuests['The 404']?.completedAt).toBeTruthy()
  expect(data.dinnerCard?.text).toBe(DINNER)

  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([])
})
