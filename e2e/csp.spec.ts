import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { expect, test } from '@playwright/test'
import { parseHeaders, startCspServer } from './csp-server'

// THE Gate-2b field crash: 'call to WebAssembly.instantiate() blocked by CSP'.
// rapier physics loads a WASM module ~1s after the scene renders; the shipped
// CSP (script-src 'self', no wasm allowance) blocked it on EVERY browser, so
// the world rendered then died. No test caught it because vite dev/preview and
// the Playwright container never apply public/_headers — only Cloudflare Pages
// does. These specs serve the real dist under the real CSP and lock the fix in.

const DIST = new URL('../dist/', import.meta.url).pathname
const FIXED_PORT = 4271
const BROKEN_PORT = 4272

test.describe('production CSP', () => {
  test.describe.configure({ timeout: 120_000 })
  let fixed: Server
  let broken: Server

  test.beforeAll(() => {
    // build once so the spec exercises current source under the real policy
    if (!existsSync(join(DIST, 'index.html'))) execSync('npm run build', { stdio: 'ignore' })
  })

  test.afterAll(async () => {
    await new Promise<void>((r) => (fixed ? fixed.close(() => r()) : r()))
    await new Promise<void>((r) => (broken ? broken.close(() => r()) : r()))
  })

  test('the app boots under the SHIPPED CSP — rapier WASM instantiates', async ({ page }) => {
    // the real script-src must permit WebAssembly, or this fails exactly as the
    // field crash did
    expect(parseHeaders()['Content-Security-Policy']).toMatch(/wasm-unsafe-eval|unsafe-eval/)

    fixed = await startCspServer(FIXED_PORT)
    const cspErrors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error' && /content security policy|wasm|webassembly/i.test(m.text()))
        cspErrors.push(m.text())
    })
    page.on('pageerror', (e) => {
      if (/content security policy|wasm|webassembly/i.test(String(e))) cspErrors.push(String(e))
    })

    await page.goto(`http://localhost:${FIXED_PORT}/`)
    await expect(page.getByTestId('world-loading')).toBeHidden({ timeout: 60_000 })
    await expect(page.getByTestId('app-crashed')).toBeHidden()
    expect(cspErrors, 'no CSP/WASM error under the shipped policy').toEqual([])
  })

  test('REGRESSION GUARD: stripping the WASM allowance re-crashes the world', async ({ page }) => {
    // serve the same dist with the OLD broken CSP (script-src 'self' only) to
    // prove this test actually catches the failure — if someone removes
    // 'wasm-unsafe-eval', the world dies again and this turns red.
    const brokenCsp = "default-src 'self'; script-src 'self'; connect-src 'self'"
    broken = await new Promise<Server>((resolve) => {
      const srv = createServer((req, res) => {
        const rel = (req.url ?? '/').split('?')[0] === '/' ? 'index.html' : (req.url ?? '').slice(1)
        res.setHeader('Content-Security-Policy', brokenCsp)
        try {
          const body = readFileSync(join(DIST, rel))
          const type =
            extname(rel) === '.js'
              ? 'text/javascript'
              : extname(rel) === '.wasm'
                ? 'application/wasm'
                : extname(rel) === '.css'
                  ? 'text/css'
                  : 'text/html'
          res.setHeader('Content-Type', type)
          res.end(body)
        } catch {
          res.setHeader('Content-Type', 'text/html')
          res.end(readFileSync(join(DIST, 'index.html')))
        }
      })
      srv.listen(BROKEN_PORT, () => resolve(srv))
    })

    await page.goto(`http://localhost:${BROKEN_PORT}/`)
    // under the broken CSP the WASM instantiate throws → the error boundary
    await expect(page.getByTestId('app-crashed')).toBeVisible({ timeout: 60_000 })
  })
})
