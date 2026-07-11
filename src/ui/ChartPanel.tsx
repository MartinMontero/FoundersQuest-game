// src/ui/ChartPanel.tsx — the Cartographer's Chart, map face (M key; Mind &
// Myth A3). One winding pilgrimage road across parchment: eight waypoints
// (mythic + stage names from canon STAGES), the founder's position, the three
// Act Gates as archways (thresholds, never padlocks), future worlds mist-veiled
// (softer — never locked-forbidden), the W4–W6 trough dip drawn per D-K
// (normalizing, load-bearing chrome), and tombstones of laid-to-rest beliefs
// per world. Carries the D-H consent line verbatim: the Chart is free/offline;
// the Cartographer speaks only at the Council. Pre-written greet on first open
// this session — never live AI (D-E).

import { useId, useRef, type ReactElement } from 'react'
import { useJourneyStore } from '../state/journey'
import { useQuestStore } from '../state/store'
import { useUiStore } from '../state/ui'
import { ACT_GATES, FIRST_LIGHT, STAGES, UI } from '../strings'
import { DialogShell } from './TrancePanel'

/** Road x/y per world (SVG viewBox 0 0 800 300): rises, dips W4–W6, climbs to W8. */
const ROAD_POINTS: readonly { x: number; y: number }[] = [
  { x: 60, y: 150 },
  { x: 160, y: 120 },
  { x: 260, y: 105 },
  { x: 360, y: 170 }, // the dip begins (Labyrinth)
  { x: 460, y: 205 }, // its floor (Mirror)
  { x: 560, y: 180 }, // climbing out (Sculptor)
  { x: 660, y: 110 },
  { x: 750, y: 70 },
]

function roadPath(): string {
  const [first, ...rest] = ROAD_POINTS
  if (first === undefined) return ''
  let d = `M ${first.x} ${first.y}`
  for (let i = 0; i < rest.length; i += 1) {
    const prev = i === 0 ? first : rest[i - 1]!
    const next = rest[i]!
    const cx = (prev.x + next.x) / 2
    d += ` C ${cx} ${prev.y}, ${cx} ${next.y}, ${next.x} ${next.y}`
  }
  return d
}

/** session-only: the Cartographer's pre-written greet shows once per session */
let greetShown = false

export function ChartPanel(): ReactElement {
  const currentStage = useJourneyStore((s) => s.currentStage)
  const assumptions = useQuestStore((s) => s.data.assumptions)
  const closePanel = useUiStore((s) => s.closePanel)
  const titleId = useId()
  const greet = useRef(!greetShown)
  greetShown = true

  // tombstones: beliefs laid to rest, counted at their origin world
  const tombstones = new Map<number, number>()
  for (const a of assumptions) {
    if (a.status !== 'invalidated') continue
    const stage = Number.parseInt(a.originStageId.slice(1), 10)
    if (Number.isFinite(stage)) tombstones.set(stage, (tombstones.get(stage) ?? 0) + 1)
  }

  return (
    <DialogShell
      titleId={titleId}
      onClose={closePanel}
      layerClassName="z-panel"
      panelClassName="max-w-3xl"
      testId="chart-panel"
    >
      <div
        aria-hidden="true"
        className="mb-3 h-px w-16 rounded-full bg-gradient-to-r from-amber-accent-500/70 to-transparent"
      />
      <h2 id={titleId} className="quest-heading text-xl font-semibold">
        {FIRST_LIGHT.chart.title}
      </h2>
      {greet.current ? (
        <p data-testid="chart-greet" className="mt-1 text-xs italic text-ink-faint">
          {FIRST_LIGHT.chart.firstOpenGreet}
        </p>
      ) : null}

      {/* the road — one winding line, dipping W4–W6 (D-K) */}
      <div className="quest-aside mt-4 overflow-x-auto p-2">
        <svg
          viewBox="0 0 800 300"
          role="img"
          aria-label={FIRST_LIGHT.chart.title}
          className="h-auto w-full min-w-[640px]"
        >
          {/* the walked road (solid) and the road ahead (faint, mist-veiled — never a padlock) */}
          <path d={roadPath()} fill="none" stroke="rgba(107,79,46,0.25)" strokeWidth="7" strokeLinecap="round" />
          <path
            d={roadPath()}
            fill="none"
            stroke="rgba(107,79,46,0.75)"
            strokeWidth="3.5"
            strokeDasharray="6 5"
            strokeLinecap="round"
            pathLength={100}
            strokeDashoffset={0}
            style={{
              // reveal the walked fraction of the road; the rest stays the faint under-stroke
              strokeDasharray: `${((currentStage - 1) / (STAGES.length - 1)) * 100} 100`,
            }}
          />

          {/* the trough label under the dip (W4–W6) */}
          <text x="460" y="245" textAnchor="middle" className="fill-[#7a6a50]" fontSize="12" fontStyle="italic">
            {FIRST_LIGHT.chart.troughLabel}
          </text>

          {/* Act Gate archways after W2 / W5 / W7 — thresholds, never locks */}
          {ACT_GATES.map((gate) => {
            const from = ROAD_POINTS[gate.afterStage - 1]
            const to = ROAD_POINTS[gate.afterStage]
            if (from === undefined || to === undefined) return null
            const gx = (from.x + to.x) / 2
            const gy = (from.y + to.y) / 2
            return (
              <g key={gate.id} data-testid={`chart-gate-${gate.id}`}>
                <path
                  d={`M ${gx - 9} ${gy + 8} L ${gx - 9} ${gy - 6} A 9 9 0 0 1 ${gx + 9} ${gy - 6} L ${gx + 9} ${gy + 8}`}
                  fill="none"
                  stroke="rgba(189,125,33,0.85)"
                  strokeWidth="2.5"
                />
                <title>{gate.name}</title>
              </g>
            )
          })}

          {/* the eight waypoints */}
          {STAGES.map((stage, i) => {
            const p = ROAD_POINTS[i]
            if (p === undefined) return null
            const walked = stage.stage <= currentStage
            const here = stage.stage === currentStage
            const stones = tombstones.get(stage.stage) ?? 0
            return (
              <g key={stage.stage} data-testid={`chart-world-${stage.stage}`} opacity={walked ? 1 : 0.45}>
                <circle cx={p.x} cy={p.y} r={here ? 11 : 8} fill={here ? '#f2b64a' : walked ? '#8c7659' : '#b3a68f'} stroke="#6b4f2e" strokeWidth="1.5" />
                {here ? (
                  <circle cx={p.x} cy={p.y} r={16} fill="none" stroke="rgba(242,182,74,0.6)" strokeWidth="2" data-testid="chart-here" />
                ) : null}
                <text x={p.x} y={p.y - (here ? 24 : 18)} textAnchor="middle" fontSize="13" fontWeight="600" className="fill-[#2c2216]">
                  {stage.world}
                </text>
                <text x={p.x} y={p.y + 28} textAnchor="middle" fontSize="10" className="fill-[#7a6a50]">
                  {stage.name} · {stage.epithet}
                </text>
                {stones > 0 ? (
                  <g data-testid={`chart-tombstones-${stage.stage}`}>
                    <text x={p.x + 16} y={p.y + 6} fontSize="12" className="fill-[#4c3d29]">
                      ⚰︎ {stones}
                    </text>
                    <title>{FIRST_LIGHT.chart.tombstoneLabel(stones)}</title>
                  </g>
                ) : null}
              </g>
            )
          })}
        </svg>
      </div>

      <p className="mt-2 text-2xs text-ink-faint">
        {FIRST_LIGHT.chart.youAreHere}
        {' — '}
        {STAGES.find((s) => s.stage === currentStage)?.world ?? ''}
      </p>

      {/* the D-H consent boundary, verbatim — free/offline Chart vs the paid Council */}
      <p data-testid="chart-consent" className="mt-3 border-t border-ink-line/25 pt-3 text-xs text-ink-soft">
        {FIRST_LIGHT.chart.consentLine}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-2xs italic text-ink-faint">{FIRST_LIGHT.chart.keyHint}</p>
        <button
          type="button"
          data-testid="chart-close"
          onClick={closePanel}
          className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
        >
          {UI.common.close}
        </button>
      </div>
    </DialogShell>
  )
}
