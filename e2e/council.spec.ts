// e2e/council.spec.ts — the Council temple surface (C-1). Consent precedes
// every send affordance; the key lives under its OWN storage key with a
// visible remove control and NEVER enters founders-quest:v3; the by-hand
// pasted-reading path works and every reading names its source. The live rite
// is OPEN (B-4 resolved) but never fires here: a fresh journal is thin-inked
// (<3 answers, empty ledger), so the Convene button stays disabled end to end
// — zero Anthropic traffic asserted for the whole run. The live paths are
// machine-verified in council-live.spec.ts over the stub harness.

import { expect, test } from '@playwright/test'
import { STORAGE_KEY, type QuestData } from '../src/core/schema'
import { KEY_STORAGE_KEY } from '../src/key/keyManager'
import { readQuestData, recordRun, seedFounderName, waitForWorldReady, type RunLog } from './helpers'

test.describe.configure({ timeout: 240_000 })

function assertCleanRun(log: RunLog): void {
  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([])
}

const FAKE_KEY = 'sk-ant-e2e-fabricated-never-real-0000'

test('temple: consent gates, key stays in its own store, pasted reading lands labeled', async ({
  page,
}) => {
  const log = recordRun(page)
  await seedFounderName(page)
  await page.goto('/')
  await waitForWorldReady(page)

  await page.keyboard.press('KeyC')
  await expect(page.getByTestId('council-panel')).toBeVisible()

  // before consent: key save and journal copy are disabled — consent precedes;
  // the fresh journal is also thin-inked, so the live rite offers no send
  await expect(page.getByTestId('council-thin-ink')).toBeVisible()
  await expect(page.getByTestId('council-live-button')).toBeDisabled()
  await page.getByTestId('council-key-input').fill(FAKE_KEY)
  await expect(page.getByTestId('council-key-save')).toBeDisabled()
  await expect(page.getByTestId('council-copy-journal')).toBeDisabled()

  // grant consent (stored) → the key can be kept; remove control is visible
  await page.getByTestId('council-consent-grant').press('Enter')
  await expect(page.getByTestId('council-consented')).toBeVisible()
  await page.getByTestId('council-key-save').press('Enter')
  await expect(page.getByTestId('council-key-saved')).toBeVisible()
  // consent + key are in, but the journal is thin — the rite still cannot fire
  await expect(page.getByTestId('council-live-button')).toBeDisabled()

  // the key lives under its OWN storage key and NEVER inside founders-quest:v3
  const stores = await page.evaluate((keys) => ({
    keyStore: window.localStorage.getItem(keys[0] as string),
    quest: window.localStorage.getItem(keys[1] as string) ?? '',
  }), [KEY_STORAGE_KEY, STORAGE_KEY])
  expect(stores.keyStore).toBe(FAKE_KEY)
  expect(stores.quest).not.toContain('sk-ant-')

  // the by-hand reading: paste → saved with source 'pasted' + compact journal snapshot
  await page.getByTestId('council-reading-paste').fill('The record shows courage; the gap shows the next test.')
  await page.getByTestId('council-reading-save').press('Enter')
  await expect(page.getByTestId('council-reading-1')).toContainText('read by hand')
  const data = (await readQuestData(page)) as QuestData
  expect(data.council).toHaveLength(1)
  expect(data.council[0]?.source).toBe('pasted')
  expect(data.council[0]?.model).toBe('pasted')
  expect(data.council[0]?.journal).toContain('#') // the compact snapshot travelled with it
  expect(data.councilConsent).toBe(true)

  // the visible remove control clears the key store completely
  await page.getByTestId('council-key-remove').press('Enter')
  const cleared = await page.evaluate((k) => window.localStorage.getItem(k), KEY_STORAGE_KEY)
  expect(cleared).toBeNull()

  // reload: consent + reading persist; the key stays gone
  await page.reload()
  await waitForWorldReady(page)
  await page.keyboard.press('KeyC')
  await expect(page.getByTestId('council-consented')).toBeVisible()
  await expect(page.getByTestId('council-reading-1')).toBeVisible()
  await expect(page.getByTestId('council-key-input')).toBeVisible() // no key kept

  assertCleanRun(log) // zero api.anthropic.com requests — the rite stayed dark
})
