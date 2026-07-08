// e2e/stage1.spec.ts — full keyboard-only self-play of the Stage-1 grey-box
// slice (PLAN item 9). NO mouse events anywhere: movement is WASD, targeting
// is Tab/walk-up, activation is E/Enter, inscribing is Ctrl+Enter; DOM buttons
// are focused and activated with Enter (native keyboard activation).
// Asserts every write lands in the exact 02 keys of founders-quest:v3, that
// flagpoles move Action and never Truth, that only the derived E2 link lights
// the Truth meter, and that the whole run makes zero console errors and zero
// requests to api.anthropic.com.

import { expect, test } from '@playwright/test'
import { EMPTY_DATA, STORAGE_KEY } from '../src/core/schema'
import { STAGE1_MILESTONES } from '../src/game/contracts'
import { UI, WORLD_COPY } from '../src/strings'
import {
  inscribe,
  kneel,
  questionText,
  readQuestData,
  recordRun,
  shot,
  tabToChip,
  waitForWorldReady,
  walkUntilChip,
} from './helpers'

// ---- the founder's ink (typed, byte-asserted against the store) ----

const STORY =
  'I watched Maya, an office manager, retype a supplier order by hand last Tuesday, then phone the rep to fix the total she got wrong.'
const NAMES = ['Maya Chen', 'Luis Ortega', 'Priya Nair']
const WHYS: readonly [string, string, string, string, string] = [
  'Orders arrive as photos of paper forms',
  'The supplier only accepts emailed sheets',
  'Nobody owns the order format on either side',
  'Each side assumes the other will adapt first',
  'There is no shared record either side trusts',
]
const NUMBER_VALUE = '45'
const NUMBER_UNIT = 'minutes'
const NUMBER_CONTEXT = 'Twice a week, every week.'
const LIST_ITEMS: readonly [string, string] = [
  'They keep a shared spreadsheet',
  'They call the supplier to confirm',
]
const FALSIFY =
  'Managers would shrug it off and the workaround would cost nothing. I have not seen anyone shrug.'
const QUICKADD_ENTRIES: readonly [string, string] = [
  'Maya retypes every order by hand',
  'The supplier rejected two orders last month',
]
const GUARDIAN_BLANK = 'managers will trust a shared order record'
const GUARDIAN_KILL = 'Three managers decline to try a shared record after seeing it'
const PENDING_LINE = 'The rep re-keys the fixed total a second time'
const SECOND_GUARDIAN = 'Suppliers will read a shared sheet instead of email'
const EVIDENCE_TEXT = 'Maya said she retypes every order and dreads Mondays'
const EVIDENCE_SOURCE = 'Maya Chen, call 2026-07-07'
// contains solution words ('build', 'app') → must trigger the Vault nudge,
// and must still save byte-identical after the nudge is dismissed (law 10)
const NUDGE_DRAFT = 'Honestly, my instinct is to build an app for the order sheet.'
const VAULT_IDEA = 'A barcode scanner that reorders automatically'

test.describe.configure({ timeout: 300_000 })

test('stage 1 self-play, keyboard only: boot → shrines → guardian → evidence → flagpole → vault → reload', async ({ page }, testInfo) => {
  const log = recordRun(page)

  // ---- boot ----
  await page.goto('/')
  await waitForWorldReady(page)
  await expect(page.getByRole('heading', { name: WORLD_COPY.appTitle })).toBeAttached()
  const hint = page.getByTestId('onboarding-hint')
  await expect(hint).toBeVisible()
  await expect(hint).toContainText(UI.onboarding.movement)
  await expect(hint).toContainText(UI.onboarding.interact)
  // Truth leads and starts unlit — no guardians registered yet
  await expect(page.getByTestId('hud-truth-value')).toHaveText(UI.hud.truthUnlit)
  await expect(page.getByTestId('hud-action-value')).toHaveText('0%')
  await shot(page, 'boot')

  // ---- WASD walk-up to the first shrine (proximity highlight), E to kneel ----
  await walkUntilChip(page, 'KeyW', questionText('s1-th'))
  await expect(page.getByText(WORLD_COPY.prompts.shrine, { exact: true })).toBeVisible()
  await kneel(page)
  // the 03 question renders verbatim, byte-for-byte
  const heading = page.getByTestId('trance-panel').locator('h2')
  expect(await heading.textContent()).toBe(questionText('s1-th'))
  await shot(page, 'trance-open')

  // ---- s1-th [story]: type, Ctrl+Enter, exact 02 key ----
  await page.getByTestId('input-text').pressSequentially(STORY)
  await inscribe(page, 'input-text')
  let data = await readQuestData(page)
  expect(data?.answers['s1']?.['s1-th']).toEqual({ text: STORY })

  // ---- s1-l1 [names]: three real people ----
  await tabToChip(page, questionText('s1-l1'))
  await kneel(page)
  for (const [i, name] of NAMES.entries()) {
    await page.getByTestId(`input-name-${i + 1}`).pressSequentially(name)
  }
  await inscribe(page, 'input-name-3')
  data = await readQuestData(page)
  expect(data?.answers['s1']?.['s1-l1']).toEqual({ text: NAMES.join('\n') })

  // ---- s1-l2 [fivewhys]: five chained rungs, root visible ----
  await tabToChip(page, questionText('s1-l2'))
  await kneel(page)
  for (const [i, why] of WHYS.entries()) {
    const rung = page.getByTestId(`input-why-${i + 1}`)
    await expect(rung).toBeEnabled() // each rung unlocks only after the previous
    await rung.pressSequentially(why)
  }
  const root = page.getByTestId('fivewhys-root')
  await expect(root).toBeVisible()
  await expect(root).toContainText(WHYS[4])
  await shot(page, 'fivewhys-root')
  await inscribe(page, 'input-why-5')
  data = await readQuestData(page)
  expect(data?.answers['s1']?.['s1-l2']).toEqual({ whys: WHYS })

  // ---- s1-l3 [number]: value + unit + context ----
  await tabToChip(page, questionText('s1-l3'))
  await kneel(page)
  // warn-not-block (review 8d): unparseable ink shows a caution while the
  // Inscribe stays enabled — gates warn, never block (canon 01)
  await page.getByTestId('input-number-value').pressSequentially('about forty-five')
  const numberCaution = page.getByTestId('input-number-caution')
  await expect(numberCaution).toBeVisible()
  await expect(numberCaution).toHaveText(UI.trance.numberCaution)
  await expect(page.getByTestId('trance-inscribe')).toBeEnabled()
  await page.getByTestId('input-number-value').press('ControlOrMeta+a')
  await page.getByTestId('input-number-value').pressSequentially(NUMBER_VALUE)
  await expect(numberCaution).toBeHidden()
  await page.getByTestId('input-number-unit').pressSequentially(NUMBER_UNIT)
  await page.getByTestId('input-number-context').pressSequentially(NUMBER_CONTEXT)
  await inscribe(page, 'input-number-value')
  data = await readQuestData(page)
  expect(data?.answers['s1']?.['s1-l3']).toEqual({
    text: `${NUMBER_VALUE} ${NUMBER_UNIT}\n${NUMBER_CONTEXT}`,
  })

  // ---- s1-l4 [list]: two workaround rows ----
  await tabToChip(page, questionText('s1-l4'))
  await kneel(page)
  await page.getByTestId('input-list-1').pressSequentially(LIST_ITEMS[0])
  await page.getByTestId('input-list-add').press('Enter')
  await page.getByTestId('input-list-2').pressSequentially(LIST_ITEMS[1])
  await inscribe(page, 'input-list-2')
  data = await readQuestData(page)
  expect(data?.answers['s1']?.['s1-l4']).toEqual({ text: LIST_ITEMS.join('\n') })

  // ---- s1-fx [falsify] ----
  await tabToChip(page, questionText('s1-fx'))
  await kneel(page)
  await page.getByTestId('input-text').pressSequentially(FALSIFY)
  await inscribe(page, 'input-text')
  data = await readQuestData(page)
  expect(data?.answers['s1']?.['s1-fx']).toEqual({ text: FALSIFY })

  // ---- s1-fp [quickadd]: two entries + inline "This only works if ___" guardian ----
  await tabToChip(page, questionText('s1-fp'))
  await kneel(page)
  for (const entry of QUICKADD_ENTRIES) {
    await page.getByTestId('quickadd-entry').pressSequentially(entry)
    await page.getByTestId('quickadd-entry').press('Enter')
  }
  await expect(page.getByTestId('quickadd-item-1')).toContainText(QUICKADD_ENTRIES[0])
  await expect(page.getByTestId('quickadd-item-2')).toContainText(QUICKADD_ENTRIES[1])
  await page.getByTestId('quickadd-affordance-1').press('Enter')
  await page.getByTestId('quickadd-blank').pressSequentially(GUARDIAN_BLANK)
  await page.getByTestId('quickadd-kill').pressSequentially(GUARDIAN_KILL)
  await page.getByTestId('quickadd-register').press('Enter')
  await expect(page.getByTestId('quickadd-registered-1')).toHaveText(
    UI.trance.guardianRegistered,
  )
  await shot(page, 'quickadd-guardian')

  // Esc works IMMEDIATELY after guardian creation: the register button
  // unmounted under focus, but Escape listens at document level (ruled fix 2)
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('trance-panel')).toBeHidden()
  // kneel again — the draft (entries + registered marker) was kept
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('trance-panel')).toBeVisible()
  await expect(page.getByTestId('quickadd-item-1')).toContainText(QUICKADD_ENTRIES[0])
  await expect(page.getByTestId('quickadd-registered-1')).toHaveText(
    UI.trance.guardianRegistered,
  )

  // the pending, un-entered line joins the draft (review 8c): type it, stand
  // up, kneel again — it is still in the entry field, and it will NOT be
  // serialized on inscribe (only added entries become Answer.text lines)
  await page.getByTestId('quickadd-entry').pressSequentially(PENDING_LINE)
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('trance-panel')).toBeHidden()
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('trance-panel')).toBeVisible()
  await expect(page.getByTestId('quickadd-entry')).toHaveValue(PENDING_LINE)
  await expect(page.getByTestId('quickadd-item-2')).toContainText(QUICKADD_ENTRIES[1])

  await inscribe(page, 'quickadd-entry')
  data = await readQuestData(page)
  expect(data?.answers['s1']?.['s1-fp']).toEqual({ text: QUICKADD_ENTRIES.join('\n') })
  expect(data?.assumptions).toHaveLength(1)
  const guardian = data?.assumptions[0]
  expect(guardian).toMatchObject({
    statement: `${UI.trance.quickaddStatementPrefix}${GUARDIAN_BLANK}`,
    originStageId: 's1',
    importance: 'wobbles',
    status: 'untested',
    killCriterion: GUARDIAN_KILL,
  })
  expect(guardian).not.toHaveProperty('tier') // tier is derived, never stored

  // the first guardian lights the Truth meter (null → 0%): Truth moved
  await expect(page.getByTestId('hud-truth-value')).toHaveText('0%')
  // no evidence stands against it yet — nothing is banked (ruled fix 5)
  await expect(page.getByTestId('hud-truth-banked')).toBeHidden()

  // ---- Registry panel: the guardian stands (derived tier 0, untested) ----
  await tabToChip(page, WORLD_COPY.registryName)
  await page.keyboard.press('KeyE')
  const registry = page.getByTestId('registry-panel')
  await expect(registry).toBeVisible()
  const row = page.getByTestId('registry-guardian')
  await expect(row).toHaveCount(1)
  await expect(row).toContainText(`${UI.trance.quickaddStatementPrefix}${GUARDIAN_BLANK}`)
  await expect(row).toContainText(UI.registry.riskiestBadge) // the only guardian is the riskiest
  await expect(row).toContainText('untested')
  await expect(row).toContainText('E0 Whisper') // derived tier before any evidence
  await expect(row).toContainText(GUARDIAN_KILL)

  // ---- link one E2 evidence to the guardian via the registry ----
  await page.getByTestId('registry-link-toggle').press('Enter')
  await page.getByTestId('registry-evidence-text').pressSequentially(EVIDENCE_TEXT)
  await page.getByTestId('registry-evidence-source').pressSequentially(EVIDENCE_SOURCE)
  await page.getByTestId('registry-evidence-add').press('Enter')
  await expect(row).toContainText('E2 Word') // derived tier from the linked coin
  await shot(page, 'registry')
  // Esc works IMMEDIATELY after 'Log as E2': the add button unmounted under
  // focus, but Escape listens at document level now (ruled fix 2 — the old
  // close-button workaround is gone)
  await page.keyboard.press('Escape')
  await expect(registry).toBeHidden()

  // banked truth (ruled fix 5): E2 stands against an unresolved guardian —
  // the meter shows it is waiting on the Mirror's verdict, not broken
  const bankedLine = page.getByTestId('hud-truth-banked')
  await expect(bankedLine).toBeVisible()
  await expect(bankedLine).toHaveText(UI.hud.truthBanked)

  // re-open the registry and create a guardian via the form; the create
  // button disables itself once the statement clears — Esc must still work
  // immediately after creation (ruled fix 2)
  await tabToChip(page, WORLD_COPY.registryName)
  await page.keyboard.press('KeyE')
  await expect(registry).toBeVisible()
  await page.getByTestId('registry-statement').pressSequentially(SECOND_GUARDIAN)
  await page.getByTestId('registry-create').press('Enter')
  await expect(page.getByTestId('registry-guardian')).toHaveCount(2)
  await page.keyboard.press('Escape')
  await expect(registry).toBeHidden()

  data = await readQuestData(page)
  expect(data?.assumptions).toHaveLength(2)
  expect(data?.assumptions[1]).toMatchObject({
    statement: SECOND_GUARDIAN,
    originStageId: 's1',
    importance: 'wobbles',
    status: 'untested',
  })
  expect(data?.evidence).toHaveLength(1)
  expect(data?.evidence[0]).toMatchObject({
    tier: 2,
    text: EVIDENCE_TEXT,
    source: EVIDENCE_SOURCE,
    linkedAssumptionIds: [guardian?.id],
    stageId: 's1',
  })

  // ---- HUD: tier coin E2 = 1; Truth lit at 0% (unresolved — resolve is Phase 3) ----
  await expect(page.getByTestId('hud-coin-e2-count')).toHaveText('×1')
  await expect(page.getByTestId('hud-truth-value')).toHaveText('0%')
  const truthBeforeFlag = await page.getByTestId('hud-truth-value').textContent()

  // ---- Action: raise one flagpole (self-report; Action only, never Truth) ----
  const pole = STAGE1_MILESTONES[0]
  if (pole === undefined) throw new Error('stage 1 has no milestones')
  await tabToChip(page, pole.label)
  await expect(page.getByText(WORLD_COPY.prompts.flagpoleRaise, { exact: true })).toBeVisible()
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('hud-action-value')).toHaveText('33%') // 1 of 3 milestones
  await expect(page.getByTestId('hud-truth-value')).toHaveText(truthBeforeFlag ?? '')
  data = await readQuestData(page)
  expect(data?.milestones[pole.id]).toBe(true)
  await shot(page, 'hud-after')

  // ---- Vault nudge: solution words in a draft → gentle nudge; dismiss; ----
  // ---- the answer still saves byte-identical (law 10) ----
  await tabToChip(page, questionText('s1-l5'))
  await kneel(page)
  await page.getByTestId('input-text').pressSequentially(NUDGE_DRAFT)
  const nudge = page.getByTestId('vault-nudge')
  await expect(nudge).toBeVisible()
  await expect(nudge).toContainText(UI.vault.nudgeText)
  await shot(page, 'vault-nudge')
  await page.getByTestId('vault-nudge-dismiss').press('Enter')
  await expect(nudge).toBeHidden()
  await inscribe(page, 'input-text')
  data = await readQuestData(page)
  expect(data?.answers['s1']?.['s1-l5']).toEqual({ text: NUDGE_DRAFT }) // byte-identical
  expect(data?.vault).toHaveLength(0) // dismissed — nothing captured

  // ---- Vault monument: two-tap capture; count shown, content never shown ----
  await tabToChip(page, WORLD_COPY.vaultName)
  await page.keyboard.press('KeyE')
  const vaultPanel = page.getByTestId('vault-panel')
  await expect(vaultPanel).toBeVisible()
  await expect(page.getByTestId('vault-count')).toHaveText(UI.vault.countLabel(0))
  await page.getByTestId('vault-capture-text').pressSequentially(VAULT_IDEA)
  await page.getByTestId('vault-capture').press('Enter') // tap 1
  await page.getByTestId('vault-capture-confirm').press('Enter') // tap 2
  await expect(page.getByTestId('vault-count')).toHaveText(UI.vault.countLabel(1))
  // sealed: the captured content is not shown anywhere (input cleared too)
  await expect(page.getByTestId('vault-capture-text')).toHaveValue('')
  await expect(page.getByText(VAULT_IDEA)).toHaveCount(0)
  await page.getByTestId('vault-close').press('Enter')
  await expect(vaultPanel).toBeHidden()
  data = await readQuestData(page)
  expect(data?.vault).toHaveLength(1)
  expect(data?.vault[0]?.text).toBe(VAULT_IDEA)
  expect(data?.vaultUnlocked).toBe(false) // sealed until Stage 3

  // ---- reload: founders-quest:v3 is the only state of record ----
  const beforeReload = await readQuestData(page)
  await page.reload()
  await waitForWorldReady(page)
  const afterReload = await readQuestData(page)
  expect(afterReload).toEqual(beforeReload)
  await expect(page.getByTestId('onboarding-hint')).toBeHidden() // no longer first-run
  await expect(page.getByTestId('hud-truth-value')).toHaveText('0%')
  await expect(page.getByTestId('hud-action-value')).toHaveText('33%')
  await expect(page.getByTestId('hud-coin-e2-count')).toHaveText('×1')
  // the banked state derives from the persisted record — it survives reload
  await expect(page.getByTestId('hud-truth-banked')).toHaveText(UI.hud.truthBanked)
  await shot(page, 'reload-persist')

  // ---- frame rate: 3 s of roaming, then sample the dev FPS window ----
  await page.keyboard.down('KeyW')
  await page.waitForTimeout(3200)
  await page.keyboard.up('KeyW')
  const fps = await page.evaluate(() => {
    const record = (window as unknown as { __fq_fps?: { fps: number; samples: number[] } })
      .__fq_fps
    return record ?? null
  })
  expect(fps).not.toBeNull()
  const samples = fps?.samples ?? []
  const mean = samples.length > 0 ? samples.reduce((a, b) => a + b, 0) / samples.length : 0
  const fpsNote =
    `grey-box roam FPS (HEADLESS CONTAINER, software GL — NOT player hardware): ` +
    `last=${(fps?.fps ?? 0).toFixed(1)}, mean=${mean.toFixed(1)} over ${samples.length} 1s samples`
  console.log(`[fps] ${fpsNote}`)
  testInfo.annotations.push({ type: 'fps-headless-container', description: fpsNote })

  // ---- run-wide invariants ----
  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([]) // the slice makes ZERO Anthropic calls
  // the record never grew a foreign key: the persisted top-level shape is
  // EXACTLY the 02 keys, order-insensitive (review 8b — a real assertion)
  const finalRaw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)
  expect(finalRaw).not.toBeNull()
  const finalKeys = Object.keys(JSON.parse(finalRaw as string) as Record<string, unknown>)
  expect([...finalKeys].sort()).toEqual(Object.keys(EMPTY_DATA).sort())
})
