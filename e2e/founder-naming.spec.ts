// e2e/founder-naming.spec.ts — the first-run naming moment (keyboard only).
// On a fresh boot the naming card owns the screen and the movement hint stands
// down behind it. Typing a name and beginning writes it to the settings' OWN
// key (never founders-quest:v3, never api.anthropic.com), shows it in the HUD,
// releases the hint, and the card never returns. Skipping adopts the canon
// default 'founder'. The name is device-local — nothing here reaches the wire.

import { expect, test } from '@playwright/test'
import { STORAGE_KEY } from '../src/core/schema'
import { SETTINGS_STORAGE_KEY } from '../src/settings'
import { UI } from '../src/strings'
import { recordRun, waitForWorldReady } from './helpers'

const NAME = 'Ada Lovelace'

test.describe.configure({ timeout: 120_000 })

test('first run: name the founder → HUD shows it, card never returns, name never sent', async ({ page }) => {
  const log = recordRun(page)
  await page.goto('/')
  await waitForWorldReady(page)

  // the card owns the screen; the movement hint holds back behind it
  const card = page.getByTestId('founder-naming')
  await expect(card).toBeVisible()
  await expect(page.getByTestId('onboarding-hint')).toBeHidden()
  // until named, the HUD shows the canon default
  await expect(page.getByTestId('hud-founder-name')).toHaveText(UI.founder.defaultName)

  // type a name and begin — Enter from the field is the keyboard path
  const input = page.getByTestId('founder-name-input')
  await input.fill(NAME)
  await input.press('Enter')

  // the card is gone, the HUD carries the chosen name, and the hint appears
  await expect(card).toBeHidden()
  await expect(page.getByTestId('hud-founder-name')).toHaveText(NAME)
  await expect(page.getByTestId('onboarding-hint')).toBeVisible()

  // the name lives under the settings' OWN key — never inside founders-quest:v3
  const settingsRaw = await page.evaluate((k) => window.localStorage.getItem(k), SETTINGS_STORAGE_KEY)
  expect(settingsRaw).not.toBeNull()
  expect(JSON.parse(settingsRaw as string)).toMatchObject({ founderName: NAME })
  const questRaw = await page.evaluate((k) => window.localStorage.getItem(k), STORAGE_KEY)
  if (questRaw !== null) expect(questRaw).not.toContain(NAME)

  // it persists and the card does not nag on return
  await page.reload()
  await waitForWorldReady(page)
  await expect(page.getByTestId('founder-naming')).toBeHidden()
  await expect(page.getByTestId('hud-founder-name')).toHaveText(NAME)

  // device-local: naming never touched the wire
  expect(log.anthropicRequests).toEqual([])
  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
})

test('first run: skip naming → the founder keeps the default name, card does not return', async ({ page }) => {
  const log = recordRun(page)
  await page.goto('/')
  await waitForWorldReady(page)

  const card = page.getByTestId('founder-naming')
  await expect(card).toBeVisible()

  // Stay "founder": adopt the default; the card persists as answered
  await page.getByTestId('founder-name-skip').press('Enter')
  await expect(card).toBeHidden()
  await expect(page.getByTestId('hud-founder-name')).toHaveText(UI.founder.defaultName)
  await expect(page.getByTestId('onboarding-hint')).toBeVisible()

  // reload: still the default, and the card stays closed (the choice persisted)
  await page.reload()
  await waitForWorldReady(page)
  await expect(page.getByTestId('founder-naming')).toBeHidden()
  await expect(page.getByTestId('hud-founder-name')).toHaveText(UI.founder.defaultName)

  expect(log.anthropicRequests).toEqual([])
  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
})
