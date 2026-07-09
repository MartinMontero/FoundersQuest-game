// A minimal static server that serves the built dist/ with the SAME CSP that
// Cloudflare Pages applies from public/_headers. Neither `vite dev` nor `vite
// preview` apply _headers, so the production CSP was never exercised by a test
// — which is exactly how a CSP that blocks rapier's WebAssembly.instantiate()
// shipped and crashed real phones (Gate-2b field report). This server closes
// that hole: the csp.spec boots the real build under the real policy.

import { createServer, type Server } from 'node:http'
import { readFileSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const ROOT = new URL('../dist/', import.meta.url).pathname
const HEADERS_FILE = new URL('../public/_headers', import.meta.url).pathname

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
}

/** Parse the `/*` header block out of public/_headers into a header map — the
 * real policy, so the test tracks whatever the shipped file actually says. */
export function parseHeaders(): Record<string, string> {
  const text = readFileSync(HEADERS_FILE, 'utf8')
  const out: Record<string, string> = {}
  let inGlob = false
  for (const raw of text.split('\n')) {
    if (raw.startsWith('/')) {
      inGlob = raw.trim() === '/*'
      continue
    }
    const m = /^\s+([A-Za-z-]+):\s*(.+)$/.exec(raw)
    if (inGlob && m && m[1] && m[2]) out[m[1]] = m[2]
  }
  return out
}

/** Start the static server on `port`, applying the parsed _headers to every
 * response. Resolves once listening. */
export function startCspServer(port: number): Promise<Server> {
  const headers = parseHeaders()
  const server = createServer((req, res) => {
    const urlPath = (req.url ?? '/').split('?')[0] ?? '/'
    const rel = urlPath === '/' ? 'index.html' : normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
    const file = join(ROOT, rel)
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v)
    try {
      const body = readFileSync(file)
      res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream')
      res.end(body)
    } catch {
      // SPA fallback → index.html (mirrors Pages)
      try {
        res.setHeader('Content-Type', 'text/html')
        res.end(readFileSync(join(ROOT, 'index.html')))
      } catch {
        res.statusCode = 404
        res.end('not found')
      }
    }
  })
  return new Promise((resolve) => server.listen(port, () => resolve(server)))
}
