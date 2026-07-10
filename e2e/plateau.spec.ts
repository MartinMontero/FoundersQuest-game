// e2e/plateau.spec.ts — the void-fall blocker (Phase 2 review, ruled fix 1).
// The old four square edge walls left the plateau's diagonal rim open: a
// player strafing outward walked off the disk and fell forever. The circular
// rim must hold at EVERY heading, and the safety net must return a fallen
// capsule to spawn. Keyboard only.

import { expect, test } from '@playwright/test'
import { recordRun, seedFounderName, waitForWorldReady } from './helpers'

interface Vec3 {
  x: number
  y: number
  z: number
}

async function playerPos(page: import('@playwright/test').Page): Promise<Vec3> {
  const pos = await page.evaluate(
    () => (window as unknown as { __fq_player?: Vec3 }).__fq_player ?? null,
  )
  expect(pos).not.toBeNull()
  return pos as Vec3
}

test.describe.configure({ timeout: 120_000 })

test('strafing outward ~5 s never leaves the plateau — the rim holds on the diagonal', async ({ page }) => {
  const log = recordRun(page)
  // seed the name so the naming card can't capture the WASD keys under test
  await seedFounderName(page)
  await page.goto('/')
  await waitForWorldReady(page)

  // south-east diagonal from spawn (2, 18): the exact heading the old square
  // walls left open — the disk edge sits ~5 m away, far inside the old walls
  await page.keyboard.down('KeyS')
  await page.keyboard.down('KeyD')
  await page.waitForTimeout(5000)
  await page.keyboard.up('KeyS')
  await page.keyboard.up('KeyD')

  const pos = await playerPos(page)
  expect(pos.y).toBeGreaterThan(-5) // still on the plateau, not in the void
  expect(Math.hypot(pos.x, pos.z)).toBeLessThan(24) // inside the disk radius

  // and it STAYS held — no slow slide off after the keys release
  await page.waitForTimeout(1000)
  const settled = await playerPos(page)
  expect(settled.y).toBeGreaterThan(-5)

  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([])
})
