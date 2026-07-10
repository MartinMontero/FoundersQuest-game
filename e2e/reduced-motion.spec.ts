// e2e/reduced-motion.spec.ts — prefers-reduced-motion honored (game-design §3):
// the trance framing is an INSTANT CUT — asserted behaviorally via the dev
// camera hook (__fq_cam, review 8f): under reduced motion the camera is
// already at the trance framing right after kneel; under normal motion it is
// still dollying. The writing panel opens immediately on kneel either way,
// and entering/exiting a trance throws nothing. Keyboard only.

import { expect, test, type Page } from '@playwright/test'
import { TRANCE_BACKOFF, TRANCE_HEIGHT } from '../src/game/CameraRig'
import { STAGE1_LAYOUT } from '../src/game/contracts'
import { UI, WORLD_COPY } from '../src/strings'
import {
  questionText,
  recordRun,
  seedFounderName,
  shot,
  tabToChip,
  waitForWorldReady,
} from './helpers'

interface Vec3 {
  x: number
  y: number
  z: number
}

async function readHook(page: Page, name: '__fq_cam' | '__fq_player'): Promise<Vec3> {
  const value = await page.evaluate(
    (key) => (window as unknown as Record<string, Vec3 | undefined>)[key] ?? null,
    name,
  )
  expect(value, `${name} dev hook must be present`).not.toBeNull()
  return value as Vec3
}

/** The CameraRig's trance framing for a shrine, given the player's position
 * (same math as src/game/CameraRig.tsx — over-shoulder stand-off). */
function tranceFraming(player: Vec3, shrine: readonly [number, number, number]): Vec3 {
  let dx = player.x - shrine[0]
  let dz = player.z - shrine[2]
  const length = Math.hypot(dx, dz)
  if (length < 0.001) {
    dx = 0
    dz = 1
  } else {
    dx /= length
    dz /= length
  }
  return {
    x: shrine[0] + dx * TRANCE_BACKOFF,
    y: shrine[1] + TRANCE_HEIGHT,
    z: shrine[2] + dz * TRANCE_BACKOFF,
  }
}

function shrinePosition(qid: string): readonly [number, number, number] {
  const spec = STAGE1_LAYOUT.find((s) => s.kind === 'shrine' && s.qid === qid)
  if (spec === undefined) throw new Error(`no shrine for ${qid}`)
  return spec.position
}

const distance = (a: Vec3, b: Vec3): number =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

/**
 * Arm an in-browser watcher BEFORE kneeling: when the trance panel enters the
 * DOM, it snapshots __fq_cam on the next rendered frame. Frame-indexed, zero
 * protocol round-trips — immune to CPU-contention wall-clock skew, so "the
 * camera at the first kneel frame" means exactly that (review 8f).
 */
async function armKneelCameraWatcher(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as {
      __fq_cam?: { x: number; y: number; z: number }
      __fq_kneelCam?: { x: number; y: number; z: number } | null
    }
    w.__fq_kneelCam = null
    const observer = new MutationObserver(() => {
      if (document.querySelector('[data-testid="trance-panel"]') === null) return
      observer.disconnect()
      // sample on the next rendered frame: the R3F loop (registered earlier)
      // runs first in the same rAF batch, so the camera has moved for the
      // first trance frame by the time this reads it
      requestAnimationFrame(() => {
        const cam = w.__fq_cam
        if (cam !== undefined) w.__fq_kneelCam = { x: cam.x, y: cam.y, z: cam.z }
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })
  })
}

/** The camera position sampled on the first rendered frame after kneel. */
async function kneelCamera(page: Page): Promise<Vec3> {
  await page.waitForFunction(
    () => (window as unknown as { __fq_kneelCam?: Vec3 | null }).__fq_kneelCam !== null,
    undefined,
    { timeout: 10_000 },
  )
  const cam = await page.evaluate(
    () => (window as unknown as { __fq_kneelCam?: Vec3 | null }).__fq_kneelCam ?? null,
  )
  expect(cam).not.toBeNull()
  return cam as Vec3
}

test.describe.configure({ timeout: 120_000 })

test('reduced motion: boot, enter and exit a trance — instant cut, instant panel, no exceptions', async ({ page }, testInfo) => {
  const log = recordRun(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedFounderName(page)

  await page.goto('/')
  await waitForWorldReady(page)
  expect(
    await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
  ).toBe(true)
  await expect(page.getByTestId('onboarding-hint')).toBeVisible()
  await shot(page, 'reduced-before')

  // Tab to the threshold shrine, kneel
  await tabToChip(page, questionText('s1-th'))
  await expect(page.getByText(WORLD_COPY.prompts.shrine, { exact: true })).toBeVisible()
  const playerBefore = await readHook(page, '__fq_player')
  const framing = tranceFraming(playerBefore, shrinePosition('s1-th'))
  await armKneelCameraWatcher(page)
  const pressedAt = Date.now()
  await page.keyboard.press('KeyE')
  // no dolly wait: the panel is expected essentially immediately (2 s is the
  // hard ceiling for a headless software-GL container; measured ms annotated)
  await expect(page.getByTestId('trance-panel')).toBeVisible({ timeout: 2000 })
  const openMs = Date.now() - pressedAt
  testInfo.annotations.push({
    type: 'reduced-motion-panel-open-ms',
    description: `${openMs} ms from keypress to visible panel (headless container)`,
  })
  console.log(`[reduced-motion] trance panel visible ${openMs} ms after E`)

  // the CUT itself (review 8f): on the FIRST rendered frame after kneel the
  // camera is already AT the trance framing — no dolly, no easing
  const camAtKneel = await kneelCamera(page)
  expect(distance(camAtKneel, framing)).toBeLessThan(0.05)

  expect(await page.getByTestId('trance-panel').locator('h2').textContent()).toBe(
    questionText('s1-th'),
  )
  await expect(page.getByText(UI.trance.keysHint, { exact: true })).toBeVisible()
  await shot(page, 'reduced-trance-open')

  // Esc — stand up (draft kept); back to roam with no exceptions
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('trance-panel')).toBeHidden()
  await expect(page.getByTestId('onboarding-hint')).toBeVisible() // roaming again
  await shot(page, 'reduced-after-exit')

  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([])
})

test('normal motion: the trance camera DOLLIES — it is not at the framing right after kneel', async ({ page }) => {
  const log = recordRun(page)
  await seedFounderName(page)
  await page.goto('/')
  await waitForWorldReady(page)
  expect(
    await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
  ).toBe(false)

  await tabToChip(page, questionText('s1-th'))
  await expect(page.getByText(WORLD_COPY.prompts.shrine, { exact: true })).toBeVisible()
  const playerBefore = await readHook(page, '__fq_player')
  const framing = tranceFraming(playerBefore, shrinePosition('s1-th'))
  await armKneelCameraWatcher(page)

  await page.keyboard.press('KeyE')
  // the panel opens without waiting on the dolly…
  await expect(page.getByTestId('trance-panel')).toBeVisible({ timeout: 2000 })
  // …and on the FIRST rendered frame after kneel the ≈600 ms damped dolly has
  // barely begun: the camera is still well away from the trance framing (the
  // discriminator against the reduced-motion instant cut, review 8f)
  const camAtKneel = await kneelCamera(page)
  expect(distance(camAtKneel, framing)).toBeGreaterThan(0.5)
  // …and the dolly arrives at the same framing shortly after
  await page.waitForFunction(
    (target) => {
      const cam = (window as unknown as { __fq_cam?: { x: number; y: number; z: number } })
        .__fq_cam
      if (cam === undefined) return false
      return Math.hypot(cam.x - target.x, cam.y - target.y, cam.z - target.z) < 0.1
    },
    framing,
    { timeout: 10_000 },
  )

  await page.keyboard.press('Escape')
  await expect(page.getByTestId('trance-panel')).toBeHidden()

  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([])
})
