// e2e/council-live.spec.ts — the LIVE rite (B-4 resolved 2026-07-13), every
// path machine-verified over the stub harness with a fabricated key; no real
// key exists and no request leaves the machine (routes intercept first):
//   ok            → reading lands source 'live', names claude-fable-5, snapshots
//                   the journal as sent; the commitment gate seals once
//   key-invalid   → canon 04 key-failure copy, journal untouched
//   network       → canon 04 not-in-session copy
//   model-access  → the fallback-sage OFFER (never auto-switch); accepting
//                   persists and re-convenes as claude-sonnet-4-6, and the
//                   reading names the sage who spoke
// Wire assertions ride the stub log: model per call, the CORS opt-in header,
// max_tokens 1000 (the one-page budget).

import { expect, test } from '@playwright/test'
import { STORAGE_KEY, type QuestData } from '../src/core/schema'
import { readQuestData, recordRun, seedFounderName, waitForWorldReady } from './helpers'
import { stubAnthropic } from './stubs'

test.describe.configure({ timeout: 240_000 })

const FAKE_KEY = 'sk-ant-e2e-fabricated-never-real-0000'

test('live rite: ok / key-invalid / network / model-access + fallback, all stubbed', async ({
  page,
}) => {
  const log = recordRun(page)
  await seedFounderName(page)
  // un-thin the journal: one ledger entry lifts the 04 thin-ink guard
  await page.addInitScript(
    ([storageKey]) => {
      window.localStorage.setItem(
        storageKey as string,
        JSON.stringify({
          openingCompletedAt: '2026-07-10T00:00:00.000Z',
          invitationSeen: true,
          evidence: [
            {
              id: 'e-seed-1',
              tier: 2,
              text: 'Signed pilot agreement with a named shop.',
              source: 'pilot outreach',
              linkedAssumptionIds: [],
              stageId: 's1',
              date: '2026-07-10T00:00:00.000Z',
            },
          ],
        }),
      )
    },
    [STORAGE_KEY],
  )
  await page.goto('/')
  await waitForWorldReady(page)

  await page.keyboard.press('KeyC')
  await expect(page.getByTestId('council-panel')).toBeVisible()
  await expect(page.getByTestId('council-thin-ink')).toHaveCount(0) // guard lifted

  // consent, then keep the fabricated key
  await page.getByTestId('council-consent-grant').press('Enter')
  await page.getByTestId('council-key-input').fill(FAKE_KEY)
  await page.getByTestId('council-key-save').press('Enter')
  await expect(page.getByTestId('council-key-saved')).toBeVisible()

  // ---- ok: the reading lands, names the pinned model, snapshots as sent ----
  const okCalls = await stubAnthropic(page, { kind: 'ok', text: 'The record shows a beginning.' })
  await page.getByTestId('council-live-button').click()
  await expect(page.getByTestId('council-reading-1')).toContainText('The record shows a beginning.')
  await expect(page.getByTestId('council-reading-1')).toContainText('claude-fable-5')
  expect(okCalls).toHaveLength(1)
  expect(okCalls[0]?.model).toBe('claude-fable-5')
  expect(okCalls[0]?.hasDirectBrowserHeader).toBe(true)
  expect(okCalls[0]?.maxTokens).toBe(1000)

  let data = (await readQuestData(page)) as QuestData
  expect(data.council).toHaveLength(1)
  expect(data.council[0]?.source).toBe('live')
  expect(data.council[0]?.model).toBe('claude-fable-5')
  expect(data.council[0]?.journal).toContain('#') // the compact snapshot as sent

  // ---- the commitment gate: one thing you'll change, sealed once ----
  await page.getByTestId('council-commitment-input').fill('Call five churned users this week.')
  await page.getByTestId('council-commitment-save').press('Enter')
  await expect(page.getByTestId('council-commitment')).toContainText('Call five churned users')
  data = (await readQuestData(page)) as QuestData
  expect(data.council[0]?.commitment).toBe('Call five churned users this week.')

  // ---- key-invalid: canon 04 key-failure copy; nothing new lands ----
  const keyCalls = await stubAnthropic(page, { kind: 'key-invalid' })
  await page.getByTestId('council-live-button').click()
  await expect(page.getByTestId('council-live-error')).toContainText("didn't accept your key")
  expect(keyCalls).toHaveLength(1)

  // ---- network: the Council is not in session; the journal is untouched ----
  const netCalls = await stubAnthropic(page, { kind: 'network' })
  await page.getByTestId('council-live-button').click()
  await expect(page.getByTestId('council-live-error')).toContainText('not in session')
  expect(netCalls).toHaveLength(1)
  data = (await readQuestData(page)) as QuestData
  expect(data.council).toHaveLength(1) // still just the one reading

  // ---- model-access: the OFFER, then the fallback sage speaks ----
  const offerCalls = await stubAnthropic(page, { kind: 'model-access' })
  await page.getByTestId('council-live-button').click()
  await expect(page.getByTestId('council-fallback-offer')).toBeVisible()
  await expect(page.getByTestId('council-fallback-offer')).toContainText('fallback sage')
  expect(offerCalls).toHaveLength(1)
  expect(offerCalls[0]?.model).toBe('claude-fable-5') // the offer came from a pinned-model attempt

  const sageCalls = await stubAnthropic(page, { kind: 'ok', text: 'A different voice, same rite.' })
  await page.getByTestId('council-fallback-accept').click()
  await expect(page.getByTestId('council-reading-2')).toContainText('A different voice, same rite.')
  await expect(page.getByTestId('council-reading-2')).toContainText('claude-sonnet-4-6')
  expect(sageCalls).toHaveLength(1)
  expect(sageCalls[0]?.model).toBe('claude-sonnet-4-6') // acceptance rode the wire

  data = (await readQuestData(page)) as QuestData
  expect(data.council).toHaveLength(2)
  expect(data.council[1]?.source).toBe('live')
  expect(data.council[1]?.model).toBe('claude-sonnet-4-6')

  // the whole run made exactly the five intercepted calls — no strays
  expect(log.anthropicRequests).toHaveLength(5)
  expect(log.pageErrors).toEqual([])
  // resource-load noise from the deliberately-aborted 'network' stub is expected;
  // anything else in the console is a real failure
  expect(log.consoleErrors.filter((e) => !e.includes('Failed to load resource'))).toEqual([])
})
