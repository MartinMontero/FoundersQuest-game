// src/game/assets.ts — public-asset URLs, base-aware. BASE_URL is '/' on the
// root deploy and '/play/' when the game is mounted under foundersquest.ca/play
// (vite.config FQ_BASE); it always ends with a slash. Every public/ file
// referenced from code goes through here — a hardcoded '/models/…' breaks the
// path-mounted deploy silently (the request would hit the landing site).

export const asset = (path: string): string => `${import.meta.env.BASE_URL}${path}`
