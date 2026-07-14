// e2e/council-live.spec.ts — the LIVE rite (B-4 resolved 2026-07-13), every
// path machine-verified over the stub harness with a fabricated key; no real
// key exists and no request leaves the machine (routes intercept first):
//   ok            → reading lands source 'live', names claude-fable-5; the
//                   persisted snapshot EQUALS the wire body's user content;
//                   the wire system prompt carries the On-hunches block;
//                   the commitment gate seals once
//   key-invalid   → canon 04 key-failure copy, journal untouched
//   network       → canon 04 not-in-session copy
//   model-access  → the fallback-sage OFFER (never auto-switch); accepting
//                   persists — proven by a LATER plain convene riding the
//                   stored acceptance — and the reading names the sage
// Consent is isolated too: withdraw disables Convene with key + ink in hand.
// KEYBOARD-ONLY like the whole suite: every activation is press('Enter').

import { expect, test } from '@playwright/test'
import { STORAGE_KEY, type QuestData } from '../src/core/schema'
import { COUNCIL_SYSTEM_PROMPT } from '../src/strings'
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

  // ---- consent precedes the send, ISOLATED: key kept, ink present ----
  await expect(page.getByTestId('council-live-button')).toBeEnabled()
  await page.getByTestId('council-consent-withdraw').press('Enter')
  await expect(page.getByTestId('council-live-button')).toBeDisabled()
  await page.getByTestId('council-consent-grant').press('Enter')
  await expect(page.getByTestId('council-live-button')).toBeEnabled()

  // ---- ok: the reading lands, names the pinned model, snapshots as sent ----
  const okCalls = await stubAnthropic(page, { kind: 'ok', text: 'The record shows a beginning.' })
  await page.getByTestId('council-live-button').press('Enter')
  await expect(page.getByTestId('council-reading-1')).toContainText('The record shows a beginning.')
  await expect(page.getByTestId('council-reading-1')).toContainText('claude-fable-5')
  expect(okCalls).toHaveLength(1)
  expect(okCalls[0]?.model).toBe('claude-fable-5')
  expect(okCalls[0]?.hasDirectBrowserHeader).toBe(true)
  expect(okCalls[0]?.maxTokens).toBe(1000)
  // the wire carried the CANONICAL prompt — including the B-4 On-hunches block
  expect(okCalls[0]?.system).toBe(COUNCIL_SYSTEM_PROMPT)
  expect(okCalls[0]?.system).toContain('On hunches:')

  let data = (await readQuestData(page)) as QuestData
  expect(data.council).toHaveLength(1)
  expect(data.council[0]?.source).toBe('live')
  expect(data.council[0]?.model).toBe('claude-fable-5')
  // the hard invariant, end to end: snapshot EQUALS the string that crossed
  expect(data.council[0]?.journal).toBe(okCalls[0]?.userContent)
  expect(data.council[0]?.journal).toContain('Signed pilot agreement')

  // ---- the commitment gate: one thing you'll change, sealed once ----
  await page.getByTestId('council-commitment-input').fill('Call five churned users this week.')
  await page.getByTestId('council-commitment-save').press('Enter')
  await expect(page.getByTestId('council-commitment')).toContainText('Call five churned users')
  data = (await readQuestData(page)) as QuestData
  expect(data.council[0]?.commitment).toBe('Call five churned users this week.')

  // ---- key-invalid: canon 04 key-failure copy; nothing new lands ----
  const keyCalls = await stubAnthropic(page, { kind: 'key-invalid' })
  await page.getByTestId('council-live-button').press('Enter')
  await expect(page.getByTestId('council-live-error')).toContainText("didn't accept your key")
  expect(keyCalls).toHaveLength(1)

  // ---- network: the Council is not in session; the journal is untouched ----
  const netCalls = await stubAnthropic(page, { kind: 'network' })
  await page.getByTestId('council-live-button').press('Enter')
  await expect(page.getByTestId('council-live-error')).toContainText('not in session')
  expect(netCalls).toHaveLength(1)
  data = (await readQuestData(page)) as QuestData
  expect(data.council).toHaveLength(1) // still just the one reading

  // ---- model-access: the OFFER, then the fallback sage speaks ----
  const offerCalls = await stubAnthropic(page, { kind: 'model-access' })
  await page.getByTestId('council-live-button').press('Enter')
  await expect(page.getByTestId('council-fallback-offer')).toBeVisible()
  await expect(page.getByTestId('council-fallback-offer')).toContainText('fallback sage')
  expect(offerCalls).toHaveLength(1)
  expect(offerCalls[0]?.model).toBe('claude-fable-5') // the offer came from a pinned-model attempt

  const sageCalls = await stubAnthropic(page, { kind: 'ok', text: 'A different voice, same rite.' })
  await page.getByTestId('council-fallback-accept').press('Enter')
  await expect(page.getByTestId('council-reading-2')).toContainText('A different voice, same rite.')
  await expect(page.getByTestId('council-reading-2')).toContainText('claude-sonnet-4-6')
  expect(sageCalls).toHaveLength(1)
  expect(sageCalls[0]?.model).toBe('claude-sonnet-4-6') // acceptance rode the wire

  data = (await readQuestData(page)) as QuestData
  expect(data.council).toHaveLength(2)
  expect(data.council[1]?.source).toBe('live')
  expect(data.council[1]?.model).toBe('claude-sonnet-4-6')

  // ---- acceptance PERSISTED: a plain convene now reads the settings ladder
  // and speaks as the sage without any new offer or acceptance ----
  const persistedCalls = await stubAnthropic(page, { kind: 'ok', text: 'Still the sage.' })
  await page.getByTestId('council-live-button').press('Enter')
  await expect(page.getByTestId('council-reading-3')).toContainText('Still the sage.')
  expect(persistedCalls).toHaveLength(1)
  expect(persistedCalls[0]?.model).toBe('claude-sonnet-4-6')

  // the whole run made exactly the six intercepted calls — no strays
  expect(log.anthropicRequests).toHaveLength(6)
  expect(log.pageErrors).toEqual([])
  // resource-load noise is expected ONLY from the stubbed Anthropic responses
  // (the aborted 'network' mode and the 401/404 fulfillments); anything else
  // in the console — a broken asset, a failed chunk — is a real failure
  expect(
    log.consoleErrors.filter(
      (e) => !(e.includes('Failed to load resource') && e.includes('api.anthropic.com')),
    ),
  ).toEqual([])
})
