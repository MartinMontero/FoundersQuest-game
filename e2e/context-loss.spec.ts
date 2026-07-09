import { expect, test } from '@playwright/test'

// The Gate-2b field crash — "the world failed to hold together" — was a WebGL
// context loss (a mobile GPU under pressure) with no recovery, bubbling to the
// app error boundary. World.tsx now preventDefaults the loss and invalidates on
// restore. This proves a lost-then-restored context does NOT crash the app and
// the canvas survives. (SwiftShader can't reproduce a spontaneous mobile-GPU
// loss, so we induce one deterministically via WEBGL_lose_context.)

test('a lost-then-restored WebGL context recovers instead of crashing', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(String(e)))

  await page.goto('/?render=full')
  await expect(page.getByTestId('world-loading')).toBeHidden({ timeout: 60_000 })

  const result = await page.evaluate(async () => {
    const canvas = document.querySelector('canvas')
    const gl =
      (canvas?.getContext('webgl2') as WebGL2RenderingContext | null) ??
      (canvas?.getContext('webgl') as WebGLRenderingContext | null)
    const ext = gl?.getExtension('WEBGL_lose_context')
    if (!ext) return 'no-extension'
    ext.loseContext()
    await new Promise((r) => setTimeout(r, 400))
    ext.restoreContext()
    await new Promise((r) => setTimeout(r, 1200))
    return 'cycled'
  })

  // if the extension is unavailable in this engine, the recovery path is still
  // wired (unit of code) — skip rather than false-pass
  test.skip(result === 'no-extension', 'WEBGL_lose_context unavailable in this browser')

  await expect(page.getByTestId('app-crashed')).toBeHidden()
  expect(page.locator('canvas')).toBeTruthy()
  await expect(page.locator('canvas')).toHaveCount(1)
  expect(pageErrors, 'no unhandled error may escape a context loss').toEqual([])
})
