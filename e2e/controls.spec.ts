// e2e/controls.spec.ts — the per-world trance controls, driven through the real
// world and the real founders-quest:v3 store (keyboard only, zero Anthropic).
// World 5 (The Mirror) is the densest: it seeds a thread sealed back at World 4
// and exercises the three hardest new controls in one world-load —
//   verdict  (reads the s4-th sealed text, records yes/no),
//   decision (LOCKED until ≥1 evidence citation — the s5-dec rule),
//   funeral  (invalidates a Stage-1 guardian in the Registry, 1.5× honors).
// The controls' pure logic is unit-tested in tests/trance-controls.spec.ts; this
// proves they render and commit the exact 02 keys through the live DOM + store.

import { expect, test } from '@playwright/test'
import { STORAGE_KEY, type QuestData } from '../src/core/schema'
import { JOURNEY_STORAGE_KEY } from '../src/state/journey'
import { STAGES } from '../src/strings'
import { recordRun, seedFounderName, tabToTarget, waitForWorldReady } from './helpers'

test.describe.configure({ timeout: 240_000 })

const SEALED_TEXT = 'Stop if fewer than 2 cafés pre-pay.'
const GUARDIAN_ID = 'g-w1'

/** A World-4 sealed thread + a Stage-1 guardian + a linked E2 coin — the exact
 * prerequisites the Mirror's three controls read. Partial: withDefaults fills the rest. */
const SEED: Pick<QuestData, 'answers' | 'assumptions' | 'evidence'> = {
  answers: { s4: { 's4-th': { text: SEALED_TEXT, sealedAt: '2026-07-05T00:00:00.000Z' } } },
  assumptions: [
    {
      id: GUARDIAN_ID,
      statement: 'Cafés will pay to track spoilage',
      originStageId: 's1',
      importance: 'dies',
      status: 'untested',
      killCriterion: 'ask 5; 4 refuse',
      createdAt: '2026-07-01T00:00:00.000Z',
    },
  ],
  evidence: [
    {
      id: 'e-1',
      tier: 2,
      text: '"we lose a crate a week"',
      source: 'Priya, call',
      linkedAssumptionIds: [GUARDIAN_ID],
      stageId: 's2',
      date: '2026-07-03',
    },
  ],
}

function s5Text(qid: string): string {
  const q = STAGES.find((s) => s.stage === 5)?.questions.find((x) => x.id === qid)
  if (q === undefined) throw new Error(`e2e controls: no World-5 question ${qid}`)
  return q.text
}

async function readData(page: import('@playwright/test').Page): Promise<QuestData> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)
  if (raw === null) throw new Error('founders-quest:v3 not written')
  return JSON.parse(raw) as QuestData
}

test('World 5 controls: verdict reads the seal, decision is citation-locked, the funeral buries a Stage-1 belief', async ({
  page,
}) => {
  const log = recordRun(page)
  await seedFounderName(page)
  // start in World 5, with the World-4 seal + a guardian + evidence already banked
  await page.addInitScript(
    ([sk, jk, seed]) => {
      try {
        window.localStorage.setItem(sk as string, seed as string)
        window.localStorage.setItem(jk as string, '5')
      } catch {
        // storage blocked — not this spec's concern
      }
    },
    [STORAGE_KEY, JOURNEY_STORAGE_KEY, JSON.stringify(SEED)],
  )
  await page.goto('/')
  await waitForWorldReady(page)
  await expect(page.getByTestId('stage-banner')).toContainText('The Mirror')

  // the Vault unseals on reaching World 3+ (here, a reload that resumes at W5)
  await expect.poll(async () => (await readData(page)).vaultUnlocked).toBe(true)

  // verdict-first lock: another Mirror shrine is sealed until the verdict is ruled
  await tabToTarget(page, 's5-dec')
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('trance-panel')).toBeVisible()
  await expect(page.getByTestId('verdict-lock')).toBeVisible()
  await expect(page.getByTestId('trance-inscribe')).toBeHidden() // nothing to commit while locked
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('trance-panel')).toBeHidden()

  // ---- verdict (s5-th): the sealed thread is shown; rule yes ----
  await tabToTarget(page, 's5-th')
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('trance-panel')).toBeVisible()
  await expect(page.getByTestId('trance-panel').getByRole('heading')).toHaveText(s5Text('s5-th'))
  await expect(page.getByTestId('input-verdict-sealed')).toContainText(SEALED_TEXT)
  await page.getByTestId('input-verdict-yes').press('Enter')
  await page.getByTestId('trance-inscribe').press('Enter')
  await expect(page.getByTestId('trance-panel')).toBeHidden()
  expect((await readData(page)).answers['s5']?.['s5-th']).toEqual({ verdict: 'yes' })

  // ---- decision (s5-dec): locked until a citation, then pivot cites the coin ----
  await tabToTarget(page, 's5-dec')
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('trance-panel')).toBeVisible()
  await expect(page.getByTestId('trance-panel').getByRole('heading')).toHaveText(s5Text('s5-dec'))
  await page.getByTestId('input-decision-pivot').press('Enter')
  // a decision alone does NOT cast — the citation lock holds Inscribe disabled
  await expect(page.getByTestId('trance-inscribe')).toBeDisabled()
  await page.getByTestId('input-decision-cite-1').press('Space')
  await expect(page.getByTestId('trance-inscribe')).toBeEnabled()
  await page.getByTestId('trance-inscribe').press('Enter')
  await expect(page.getByTestId('trance-panel')).toBeHidden()
  expect((await readData(page)).answers['s5']?.['s5-dec']).toEqual({
    decision: 'pivot',
    citedEvidenceIds: ['e-1'],
  })

  // ---- funeral (s5-l5): pick the Stage-1 belief, two-step confirm, it dies ----
  await tabToTarget(page, 's5-l5')
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('trance-panel')).toBeVisible()
  await expect(page.getByTestId('trance-panel').getByRole('heading')).toHaveText(s5Text('s5-l5'))
  // seal/registry are self-committing — there is no generic Inscribe button
  await expect(page.getByTestId('trance-inscribe')).toBeHidden()
  await page.getByTestId('input-funeral-choice-1').press('Space')
  await page.getByTestId('input-funeral-hold').press('Enter')
  await page.getByTestId('input-funeral-confirm').press('Enter')
  await expect(page.getByTestId('trance-panel')).toBeHidden()
  const data = await readData(page)
  const buried = data.assumptions.find((a) => a.id === GUARDIAN_ID)
  expect(buried?.status).toBe('invalidated')
  expect(buried?.resolvedAt).toBeTruthy()
  // the funeral also records the buried statement at the shrine
  expect(data.answers['s5']?.['s5-l5']?.text).toBe('Cafés will pay to track spoilage')

  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([]) // the spine makes ZERO Anthropic calls
})
