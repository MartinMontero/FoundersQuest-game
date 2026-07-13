// public/sw.js — Founder's Quest service worker, hand-rolled per ruling R-J
// (no workbox, no build plugin, no dependency). Registered in production only
// (src/pwa.ts), with updateViaCache:'none' so THIS file is always revalidated.
//
// Cache strategy — chosen so a stale shell can never poison the app:
//   navigations  network-first; the fresh index.html is cached only as an
//                offline fallback and refreshed on every successful load
//   /assets/*    cache-first: Vite content-hashes these filenames, so a hit
//                is immutable by construction
//   other GETs   network-first with cache fallback (textures/models/hdr are
//                unhashed — online always prefers the network copy)
//
// Two lines are load-bearing for the constitution (BYOK, consent):
//   non-GET requests and cross-origin requests are NEVER intercepted — the
//   Council path (browser direct to the Council's API, canon 02) does not
//   pass through here, so nothing in this file can observe, cache, or log
//   it. A guard test pins both early returns AND that this file never even
//   names that host.

const VERSION = 'fq-v1'
const SHELL = `shell-${VERSION}`
const RUNTIME = `runtime-${VERSION}`
// the mount point, derived from the registration scope: '/' at the root
// deploy, '/play/' under foundersquest.ca/play — never hardcoded
const BASE = new URL(self.registration.scope).pathname

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

async function networkFirstShell(request) {
  const cache = await caches.open(SHELL)
  try {
    const fresh = await fetch(request)
    if (fresh.ok) await cache.put(BASE, fresh.clone())
    return fresh
  } catch {
    const held = await cache.match(BASE)
    return held ?? Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME)
  const held = await cache.match(request)
  if (held !== undefined) return held
  const fresh = await fetch(request)
  if (fresh.ok) await cache.put(request, fresh.clone())
  return fresh
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME)
  try {
    const fresh = await fetch(request)
    if (fresh.ok) await cache.put(request, fresh.clone())
    return fresh
  } catch {
    const held = await cache.match(request)
    return held ?? Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return // never a POST — the Council path is untouchable
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // cross-origin is NEVER intercepted

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstShell(request))
  } else if (url.pathname.startsWith(`${BASE}assets/`)) {
    event.respondWith(cacheFirst(request))
  } else {
    event.respondWith(networkFirst(request))
  }
})
