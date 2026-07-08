import { expect, test } from '@playwright/test'

test('boots clean: shell renders, zero console errors, zero network to Anthropic', async ({ page }) => {
  const consoleErrors: string[] = []
  const anthropicCalls: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('request', (req) => {
    if (req.url().includes('api.anthropic.com')) anthropicCalls.push(req.url())
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: "Founder's Quest" })).toBeVisible()
  await expect(page.getByTestId('boot-status')).toBeVisible()

  expect(consoleErrors).toEqual([])
  // nothing may call Anthropic without a key and consent — booting must be silent
  expect(anthropicCalls).toEqual([])
})
