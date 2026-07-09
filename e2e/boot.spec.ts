import { expect, test } from '@playwright/test'
import { WORLD_COPY } from '../src/strings'

test('boots clean: shell renders, loading line appears then disappears, zero console errors, zero network to Anthropic', async ({ page }) => {
  const consoleErrors: string[] = []
  const anthropicCalls: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('request', (req) => {
    if (req.url().includes('api.anthropic.com')) anthropicCalls.push(req.url())
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: WORLD_COPY.appTitle })).toBeVisible()
  await expect(page.getByTestId('boot-status')).toBeVisible()

  // the async triad is honest (ruled fix 7): the loading line stands from
  // mount until the world's first rendered frame, then leaves
  const loading = page.getByTestId('world-loading')
  await expect(loading).toBeVisible()
  await expect(loading).toHaveText(WORLD_COPY.loading)
  await expect(loading).toBeHidden({ timeout: 90_000 })

  expect(consoleErrors).toEqual([])
  // nothing may call Anthropic without a key and consent — booting must be silent
  expect(anthropicCalls).toEqual([])
})
