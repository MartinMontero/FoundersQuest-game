// e2e/fault.spec.ts — fault injection + collider regression (Z-6 / Z-7).
// Two claims that were previously honest-but-UNTESTED labels, now machine
// checks: (1) the kill-plane safety net returns a voided capsule to spawn —
// via the DEV-only __fq_drop hook (the e2e suite runs the dev server, so the
// hook exists; production builds compile it out); (2) the rim wall actually
// stops the capsule — walk outward until the wall says no. One test, one
// page: a second heavy WebGL boot in the same worker starves the software
// rasteriser (the same reason playwright.config runs workers: 1).

import { expect, test } from '@playwright/test'
import { recordRun, seedFounderName, waitForWorldReady, type RunLog } from './helpers'

test.describe.configure({ timeout: 240_000 })

function assertCleanRun(log: RunLog): void {
  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([])
}

test('Z-6 + Z-7: void fall respawns at spawn; the rim wall stops the capsule', async ({
  page,
}) => {
  const log = recordRun(page)
  await seedFounderName(page)
  await page.goto('/')
  await waitForWorldReady(page)

  // ---- Z-6: drop the capsule into the void (DEV fault hook, self-clearing);
  // the safety net must bring it back above ground at spawn, not strand it
  const before = await page.evaluate(() => window.__fq_player ?? null)
  expect(before).not.toBeNull()
  await page.evaluate(() => {
    window.__fq_drop = true
  })
  await page.waitForFunction(
    () => {
      const p = window.__fq_player
      return p !== undefined && p.y > 0.5 && Math.hypot(p.x - 2, p.z - 18) < 2.5
    },
    undefined,
    { timeout: 15_000 },
  )

  // ---- Z-7: walk outward (KeyS backs toward +z; spawn z=18, rim r=23.5).
  // Poll for the walk actually happening, then keep pushing into the wall.
  await page.keyboard.down('KeyS')
  await page.waitForFunction(() => (window.__fq_player?.z ?? 0) > 20, undefined, {
    timeout: 60_000,
  })
  await page.waitForTimeout(4_000) // shoulder against the wall
  await page.keyboard.up('KeyS')
  await page.waitForTimeout(400)

  const p = await page.evaluate(() => window.__fq_player ?? null)
  expect(p).not.toBeNull()
  if (p !== null) {
    expect(Math.hypot(p.x, p.z)).toBeLessThan(24.5) // the wall said no
    expect(p.y).toBeGreaterThan(0.4) // still on the plateau, not falling
  }
  assertCleanRun(log)
})
