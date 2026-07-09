// e2e/helpers.ts — shared plumbing for the Stage-1 grey-box self-play specs.
// KEYBOARD-ONLY: nothing in this file (or the specs using it) dispatches a
// mouse event. Buttons are activated by focusing them and pressing Enter
// (locator.press = programmatic focus + real key events — native keyboard
// activation, the same path a keyboard player uses). No .click() anywhere.

import { expect, type Page } from '@playwright/test'
import { STORAGE_KEY, type QuestData } from '../src/core/schema'
import { STAGES } from '../src/strings'

export const SCREENSHOT_DIR = 'e2e/screenshots'

const stage1 = STAGES.find((s) => s.stage === 1)
if (stage1 === undefined) throw new Error('e2e helpers: stage 1 missing from src/strings')
export const STAGE1 = stage1

/** Verbatim 03 question text for a Stage-1 qid (from src/strings — the same
 * module the app renders from, so the byte-comparison is against canon). */
export function questionText(qid: string): string {
  const question = STAGE1.questions.find((q) => q.id === qid)
  if (question === undefined) throw new Error(`e2e helpers: no stage-1 question ${qid}`)
  return question.text
}

export interface RunLog {
  consoleErrors: string[]
  pageErrors: string[]
  anthropicRequests: string[]
}

/** Attach console-error / uncaught-exception / Anthropic-request recorders.
 * Call BEFORE page.goto so the whole run is covered. */
export function recordRun(page: Page): RunLog {
  const log: RunLog = { consoleErrors: [], pageErrors: [], anthropicRequests: [] }
  page.on('console', (msg) => {
    if (msg.type() === 'error') log.consoleErrors.push(msg.text())
  })
  page.on('pageerror', (error) => {
    log.pageErrors.push(String(error))
  })
  page.on('request', (request) => {
    if (request.url().includes('api.anthropic.com')) log.anthropicRequests.push(request.url())
  })
  return log
}

/** The world is ready once the dev-only FPS sampler has produced a sample —
 * it mounts inside the same Suspense boundary as the physics world, so its
 * presence proves the rapier WASM loaded and frames are rendering. */
export async function waitForWorldReady(page: Page): Promise<void> {
  await page.waitForFunction(
    () => (window as unknown as { __fq_fps?: unknown }).__fq_fps !== undefined,
    undefined,
    { timeout: 90_000 },
  )
}

/** Screenshot beat — file name only; the directory is stable and gitignored. */
export async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png` })
}

// 8 shrines + 3 flagpoles + vault + registry = 13 interactables in the cycle.
const TAB_CYCLE_LIMIT = 16

/** Tab-cycle the 3D interactable focus (keyboard a11y path) until the name
 * chip shows `label` — the chip is the player-visible signal that this target
 * is the active one, shared by Tab focus and walk-up proximity. */
export async function tabToChip(page: Page, label: string): Promise<void> {
  const chip = page.getByText(label, { exact: true })
  for (let i = 0; i < TAB_CYCLE_LIMIT; i += 1) {
    await page.keyboard.press('Tab')
    try {
      await expect(chip).toBeVisible({ timeout: 600 })
      return
    } catch {
      // not this target — keep cycling
    }
  }
  throw new Error(`tabToChip: never reached "${label}" in ${TAB_CYCLE_LIMIT} tabs`)
}

/** WASD walk-up: hold `key` in short bursts until the walk-up proximity chip
 * labelled `label` appears. Bursts (≈1.5 m each at run speed) cannot jump the
 * 2.75 m interact radius, so the highlight is never skipped over. */
export async function walkUntilChip(
  page: Page,
  key: string,
  label: string,
  maxBursts = 24,
): Promise<void> {
  const chip = page.getByText(label, { exact: true })
  for (let i = 0; i < maxBursts; i += 1) {
    await page.keyboard.down(key)
    await page.waitForTimeout(250)
    await page.keyboard.up(key)
    await page.waitForTimeout(150) // damping + a render frame
    if (await chip.isVisible()) return
  }
  throw new Error(`walkUntilChip: "${label}" never appeared after ${maxBursts} bursts of ${key}`)
}

/** Kneel at the active target and wait for the trance panel. */
export async function kneel(page: Page): Promise<void> {
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('trance-panel')).toBeVisible()
}

/** Ctrl+Enter inscribe from inside the panel (focuses `testId` first so the
 * key lands within the trance's key-handling scope), then wait for release. */
export async function inscribe(page: Page, testId: string): Promise<void> {
  await page.getByTestId(testId).press('Control+Enter')
  await expect(page.getByTestId('trance-panel')).toBeHidden()
}

/** Read the founders-quest:v3 record straight out of localStorage. */
export async function readQuestData(page: Page): Promise<QuestData | null> {
  const parsed = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key)
    return raw === null ? null : (JSON.parse(raw) as unknown)
  }, STORAGE_KEY)
  return parsed as QuestData | null
}
