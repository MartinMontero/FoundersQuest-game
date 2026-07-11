// e2e/feelpack.spec.ts — the feel-checkpoint screenshot pack (art-direction §4).
// Skipped unless FEEL_PACK=1: run explicitly per phase and ARCHIVE the output
// (docs/feel-packs/<phase>/) — one image per checkable criterion. Honest note:
// these are software-GL headless captures — colors/light are representative,
// fps is not. The operator's eye remains the verdict; this pack is the record.

import { test } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { seedFounderName, tabToTarget, waitForWorldReady } from './helpers'

const PHASE = process.env['FEEL_PACK_PHASE'] ?? 'a3'
const DIR = `docs/feel-packs/${PHASE}`

test.describe.configure({ timeout: 240_000 })

test.skip(process.env['FEEL_PACK'] !== '1', 'feel pack runs only when FEEL_PACK=1')

test('feel pack: spawn, shrine, trance frame, opening, chart, legend', async ({ page }) => {
  mkdirSync(DIR, { recursive: true })

  // 1-2: fresh opening — invitation + dialogue over the live world
  await seedFounderName(page, 'Tester', { freshOpening: true })
  await page.goto('/')
  await waitForWorldReady(page)
  await page.screenshot({ path: `${DIR}/01-invitation.png` })
  await page.getByTestId('opening-accept').press('Enter')
  await page.waitForTimeout(1200) // let the typewriter ink a line
  await page.screenshot({ path: `${DIR}/02-dialogue-over-world.png` })

  // 3: spawn view — horizon, landmarks (skip the rest of the induction)
  await page.evaluate(() => {
    const raw = window.localStorage.getItem('founders-quest:v3')
    const data = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>)
    window.localStorage.setItem(
      'founders-quest:v3',
      JSON.stringify({
        ...data,
        openingCompletedAt: '2026-07-11T00:00:00.000Z',
        openingBeatProgress: null,
        chartUnlocked: true,
        invitationSeen: true,
      }),
    )
  })
  await page.reload()
  await waitForWorldReady(page)
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${DIR}/03-spawn-horizon.png` })

  // 4: shrine approach + 5: trance frame (world visible around the panel)
  await tabToTarget(page, 's1-th')
  await page.screenshot({ path: `${DIR}/04-shrine-focus.png` })
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(900) // the trance dolly
  await page.screenshot({ path: `${DIR}/05-trance-frame.png` })
  await page.keyboard.press('Escape')

  // 6: the Chart · 7: the Legend
  await page.keyboard.press('KeyM')
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${DIR}/06-chart.png` })
  await page.keyboard.press('Escape')
  await page.keyboard.press('KeyL')
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${DIR}/07-legend.png` })
})
