// tailwind.config.js — Tailwind 3.4 core + QuestStyles theme tokens (canon 02 stack).
// The injected QuestStyles CSS layer itself lives in src/index.css.

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        // QuestStyles: text-2xs — prompt chips / annotations (11px)
        '2xs': ['11px', { lineHeight: '14px' }],
      },
      zIndex: {
        // QuestStyles z-layer ladder — components use these names, never ad-hoc numbers.
        hud: '10', //     persistent meters + tier tallies over the canvas
        panel: '20', //   vault / registry panels
        trance: '30', //  the shrine writing panel (world frozen beneath)
        shadow: '40', //  the stubbed Shadow overlay
        toast: '50', //   consequence toasts
        banner: '60', //  degraded-storage banner — always on top
      },
    },
  },
  plugins: [],
}
