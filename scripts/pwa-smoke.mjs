// scripts/pwa-smoke.mjs — F-9 verification: the standing e2e suite runs the
// DEV server, where the service worker is (deliberately) never registered.
// This script tests the PRODUCTION story end to end: build, serve the real
// dist over `vite preview`, then assert the worker registers, takes control,
// serves the manifest, and keeps the shell reachable OFFLINE.
// Run: npm run pwa:smoke   (exit 0 = pass)

import { execSync, spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const PORT = 5299
const BASE = `http://localhost:${PORT}`

function fail(msg) {
  console.error(`PWA SMOKE FAIL: ${msg}`)
  process.exitCode = 1
}

execSync('npx vite build', { stdio: 'inherit' })

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'pipe',
})

// wait for the preview server to listen
for (let i = 0; i < 60; i += 1) {
  try {
    const res = await fetch(BASE)
    if (res.ok) break
  } catch {
    await new Promise((r) => setTimeout(r, 500))
  }
  if (i === 59) {
    fail('preview server never came up')
    server.kill()
    process.exit(1)
  }
}

const browser = await chromium.launch()
try {
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(BASE)
  await page.evaluate(() => navigator.serviceWorker.ready)
  // clients.claim() runs on activate; give control one reload if it raced
  const controlled = await page.evaluate(() => navigator.serviceWorker.controller !== null)
  if (!controlled) {
    await page.reload()
    if (!(await page.evaluate(() => navigator.serviceWorker.controller !== null))) {
      fail('service worker never took control')
    }
  }

  const manifest = await page.evaluate(() => fetch('/manifest.webmanifest').then((r) => r.status))
  if (manifest !== 200) fail(`manifest returned ${manifest}`)

  // one controlled online load caches the shell + assets…
  await page.reload()
  await page.waitForLoadState('load')

  // …then the shell must survive with the network gone
  await context.setOffline(true)
  await page.reload()
  const title = await page.title()
  if (title !== "Founder's Quest") fail(`offline title was "${title}"`)
  const hasRoot = await page.evaluate(() => document.getElementById('root') !== null)
  if (!hasRoot) fail('offline shell has no #root')
  await context.setOffline(false)

  if (process.exitCode !== 1) console.log('PWA SMOKE PASS: registered, controlled, manifest 200, offline shell OK')
} finally {
  await browser.close()
  server.kill()
}
