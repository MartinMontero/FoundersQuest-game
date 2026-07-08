// App shell — intentionally minimal (Phase-2 integration point).
// Mounts <GameRoot/> (the 3D world) with <UiRoot/> (the DOM UI layer) beside
// it: HUD, trance, panels, Shadow, banners. All copy from src/strings.

import { GameRoot } from './game'
import { WORLD_COPY } from './strings'
import { UiRoot } from './ui/UiRoot'

export function App() {
  return (
    <main className="relative h-full w-full overflow-hidden">
      <h1 className="sr-only">{WORLD_COPY.appTitle}</h1>
      <p data-testid="boot-status" className="sr-only">
        {WORLD_COPY.bootStatus}
      </p>
      <GameRoot />
      <UiRoot />
    </main>
  )
}
