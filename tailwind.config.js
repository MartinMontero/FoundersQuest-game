// tailwind.config.js — Tailwind 3.4 core + QuestStyles theme tokens (canon 02 stack).
// The injected QuestStyles CSS layer itself lives in src/index.css.
//
// Phase 2b art direction: a diegetic founder's-journal skin. Parchment cards on
// deep indigo/violet space; warm amber/gold accents that LEAD; teal-cyan rune
// glow; desaturated warm stone. NOT neon — painted, soft, Ghibli-adjacent. All
// texture is generated in code (gradients) — no external asset/font downloads.

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ---- Palette tokens (deliverable): additive — built-in colors remain ----
      colors: {
        // warm parchment — the journal page / card surface
        parchment: {
          DEFAULT: '#ecdfc2',
          50: '#faf5e8',
          100: '#f4ecd7',
          200: '#ecdfc2',
          300: '#ddc99b',
          400: '#c9ad76',
        },
        // ink — text and the inked border on parchment
        ink: {
          DEFAULT: '#2c2216',
          soft: '#4c3d29',
          faint: '#7a6a50',
          line: '#6b4f2e',
        },
        // deep indigo/violet space — the dark ground beneath the journal chrome
        'slate-deep': {
          DEFAULT: '#161228',
          950: '#0c0918',
          900: '#141026',
          850: '#1b1533',
          800: '#221b3d',
          700: '#2f2656',
          600: '#3d3270',
        },
        // warm amber/gold — the light and the UI accent that leads
        'amber-accent': {
          DEFAULT: '#f2b64a',
          100: '#fbeecb',
          200: '#f8dda0',
          300: '#f5c974',
          400: '#f2b64a',
          500: '#dd9a2f',
          600: '#bd7d21',
        },
        // teal-cyan rune glow — the secondary accent (Action, rune light)
        'teal-rune': {
          DEFAULT: '#3fd9c8',
          100: '#cbf5ef',
          200: '#a4efe5',
          300: '#6fe3d6',
          400: '#3fd9c8',
          500: '#22b3a3',
          600: '#178a7e',
          /* ink-side rungs — teal that reads on parchment (E-0 typography) */
          700: '#116b62',
          800: '#0d5049',
        },
      },
      fontFamily: {
        // system serif display stack — no webfont downloads (canon: egress-blocked)
        display: [
          'ui-serif',
          'Georgia',
          '"Iowan Old Style"',
          '"Palatino Linotype"',
          'Palatino',
          '"Book Antiqua"',
          'serif',
        ],
      },
      fontSize: {
        // QuestStyles: text-2xs — prompt chips / annotations (11px)
        '2xs': ['11px', { lineHeight: '14px' }],
      },
      borderRadius: {
        // journal-card corner
        card: '1.1rem',
      },
      boxShadow: {
        // soft lifted card over the dark world
        card: '0 22px 55px -22px rgba(4,2,12,0.75), 0 4px 14px -6px rgba(4,2,12,0.5)',
        // the ornate HUD glass bar
        hud: '0 16px 40px -20px rgba(4,2,12,0.8), inset 0 1px 0 rgba(248,221,160,0.18)',
        // chunky corner-anchored HUD cluster (art-direction pillar 5): a lifted
        // drop + warm inset top highlight so it reads as a game HUD, not a card
        'hud-cluster':
          '0 18px 42px -18px rgba(4,2,12,0.85), 0 3px 10px -4px rgba(4,2,12,0.6), inset 0 1px 0 rgba(248,221,160,0.22)',
        // wax-seal emboss for the Inscribe button
        seal: '0 5px 12px -3px rgba(120,60,10,0.6), inset 0 1px 0 rgba(255,244,214,0.55), inset 0 -3px 6px rgba(120,60,10,0.4)',
        // soft accent glows (bloom-adjacent, cheap)
        'amber-glow': '0 0 18px rgba(242,182,74,0.5)',
        'rune-glow': '0 0 18px rgba(63,217,200,0.45)',
      },
      keyframes: {
        // enter: gentle fade + rise for panels
        'quest-rise': {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.99)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // enter: plain fade for HUD / hint / banner / backdrop
        'quest-fade': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // the Truth sigil's slow breathing glow
        'quest-sigil': {
          '0%,100%': { opacity: '0.9', filter: 'drop-shadow(0 0 3px rgba(242,182,74,0.55))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 9px rgba(242,182,74,0.9))' },
        },
        // banked Truth: a warm breathing ring while the Mirror's verdict pends
        'quest-truth-glow': {
          '0%,100%': {
            boxShadow: '0 0 0 2px rgba(245,201,116,0.6), 0 0 10px rgba(242,182,74,0.4)',
          },
          '50%': {
            boxShadow: '0 0 0 2px rgba(245,201,116,0.9), 0 0 20px rgba(242,182,74,0.65)',
          },
        },
        // the Chart unrolls like parchment, top to bottom (E-10) — enter only
        'quest-unfurl': {
          '0%': { clipPath: 'inset(0 0 96% 0)', opacity: '0.5' },
          '100%': { clipPath: 'inset(0 0 0% 0)', opacity: '1' },
        },
        // toast enter: TRANSFORM ONLY — never opacity. Under heavy load the
        // browser can hold a pending animation at its 0% frame for whole
        // seconds; a chip born at opacity 0 would be invisible exactly when
        // the feedback matters. Includes the -50% centering (animations
        // override the translate utility while they run).
        'quest-toast': {
          '0%': { transform: 'translate(-50%, 10px) scale(0.99)' },
          '100%': { transform: 'translate(-50%, 0) scale(1)' },
        },
        // the Action bar's one-shot teal flash when a milestone raises it
        'quest-action-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(63,217,200,0)' },
          '35%': { boxShadow: '0 0 0 2px rgba(63,217,200,0.7), 0 0 18px 4px rgba(63,217,200,0.5)' },
          '100%': { boxShadow: '0 0 0 0 rgba(63,217,200,0)' },
        },
      },
      animation: {
        // paired with motion-safe: — never runs under prefers-reduced-motion
        'quest-rise': 'quest-rise 220ms cubic-bezier(0.2,0.7,0.2,1)',
        'quest-fade': 'quest-fade 180ms ease-out',
        'quest-sigil': 'quest-sigil 2.6s ease-in-out infinite',
        // paired with motion-safe: on the banked Truth track
        'quest-truth-glow': 'quest-truth-glow 2.8s ease-in-out infinite',
        // paired with motion-safe: — the Chart's parchment unroll (E-10)
        'quest-unfurl': 'quest-unfurl 650ms cubic-bezier(0.25,0.8,0.3,1)',
        // paired with motion-safe: on the HUD toast (transform-only, see above)
        'quest-toast': 'quest-toast 220ms cubic-bezier(0.2,0.7,0.2,1)',
        // paired with motion-safe: on the Action track (one-shot, keyed remount)
        'quest-action-pulse': 'quest-action-pulse 900ms ease-out',
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
