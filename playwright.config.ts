import { defineConfig, devices } from '@playwright/test'

// Chromium comes pre-baked at PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
// (revision 1194 = @playwright/test 1.56.x). NEVER run `playwright install`
// in the remote container — browser CDNs are egress-blocked. CI installs its own.
export default defineConfig({
  testDir: 'e2e',
  // Real 3D assets (HDR image-based lighting, shadows, a rigged glTF character,
  // the full post-fx stack) make each world instance heavy, and the headless CI
  // renderer is CPU software-GL (SwiftShader). Two heavy WebGL contexts at once
  // starve each other into spurious timeouts — proven: every failing test passes
  // when run alone. So the WebGL specs run SERIALLY (workers: 1); each gets the
  // whole rasteriser. Deterministic, at the cost of a few minutes' wall time.
  fullyParallel: false,
  workers: 1,
  // the full-tier scene (HDR IBL, shadows, rigged character + textures, post-fx)
  // can take ~30 s to boot on the CI's CPU software-GL renderer — well past the
  // 30 s default. A generous global budget keeps real-GPU-fast paths honest while
  // giving SwiftShader room (individual specs may still raise it further).
  timeout: 90_000,
  // The long stage-1 self-play journey drives ~40 keyboard interactions over a
  // heavy WebGL scene on the CI's variable-fps software-GL renderer; at the low,
  // jittery frame rate rapier's fixed timestep occasionally drifts a beat and a
  // step just misses its window. A retry absorbs that genuine timing jitter (and
  // the CSP spec's extra-server contention) without masking a real, repeatable
  // failure — a repeatable break fails every attempt.
  retries: process.env.CI ? 2 : 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5199',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 5199 --strictPort',
    port: 5199,
    reuseExistingServer: !process.env.CI,
  },
})
