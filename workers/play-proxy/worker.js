// workers/play-proxy/worker.js — mounts the game at foundersquest.ca/play.
// Hand-rolled, zero dependencies: a GET/HEAD-only static proxy from the zone
// route foundersquest.ca/play* to the game's own Pages deployment (the `play`
// branch of founders-quest-game, built with FQ_BASE=/play/ so every asset URL
// already lives under /play/). Everything else on the domain never touches
// this worker — the landing site's Pages project keeps serving it.
//
// Constitutional lines (canon 01/02, same discipline as public/sw.js):
//   - the Council path (browser direct to the Council's API) does NOT pass
//     through here — the game's CSP connect-src pins that call to the API
//     host, which this route never serves;
//   - non-GET/HEAD is refused outright: nothing that could carry a body — a
//     journal line, a key — is ever accepted, so nothing can be observed,
//     cached, or logged;
//   - no cookies are read or forwarded (the game sets none), nothing is
//     logged, and the upstream's own headers (CSP included) pass through
//     untouched.

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('method not allowed', { status: 405 })
    }
    const url = new URL(request.url)
    // bare /play → /play/ so the document's relative URLs resolve correctly
    if (url.pathname === '/play') {
      return Response.redirect(`${url.origin}/play/${url.search}`, 301)
    }
    const upstream = new URL(url.pathname + url.search, 'https://play.founders-quest-game.pages.dev')
    return fetch(upstream, {
      method: request.method,
      headers: { accept: request.headers.get('accept') ?? '*/*' },
    })
  },
}
