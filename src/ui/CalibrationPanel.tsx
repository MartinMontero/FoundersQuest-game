// src/ui/CalibrationPanel.tsx — "Your Gut's Record" (Mind & Myth A2; v3 §3.3
// block 6). A codex page: every provenance-tagged hunch, its resolution (held /
// broke) once its seeded guardian resolved at E2+, and the running hit-rate per
// provenance rung. Factual and warm — NO shaming states for a low hit-rate (the
// page says why it exists: nobody can introspect this). Pure read of the store;
// it never alters any metric (invariant-tested). Chart-adjacent surface — it
// docks onto the Cartographer's Chart when First Light (A3) lands.

import { useId, type ReactElement } from 'react'
import type { CalibrationEntry, EvidenceEntry, HunchProvenance } from '../core/schema'
import { useQuestStore } from '../state/store'
import { useUiStore } from '../state/ui'
import { UI } from '../strings'
import { DialogShell } from './TrancePanel'

const RUNGS: readonly HunchProvenance[] = ['earned', 'adjacent', 'wild', 'borrowed']

interface RungTally {
  held: number
  resolved: number
  total: number
}

/** Pure per-rung tally over calibration rows, joined to the hunch's CURRENT rung. */
export function tallyByRung(
  calibration: readonly CalibrationEntry[],
  evidence: readonly EvidenceEntry[],
): Record<HunchProvenance, RungTally> {
  const out: Record<HunchProvenance, RungTally> = {
    earned: { held: 0, resolved: 0, total: 0 },
    adjacent: { held: 0, resolved: 0, total: 0 },
    wild: { held: 0, resolved: 0, total: 0 },
    borrowed: { held: 0, resolved: 0, total: 0 },
  }
  for (const row of calibration) {
    const hunch = evidence.find((e) => e.id === row.hunchEvidenceId)
    const rung = hunch?.provenance
    if (rung === undefined) continue // untagged/missing hunch rows tally nowhere
    out[rung].total += 1
    if (row.outcome !== undefined) {
      out[rung].resolved += 1
      if (row.outcome === 'held') out[rung].held += 1
    }
  }
  return out
}

export function CalibrationPanel(): ReactElement {
  const calibration = useQuestStore((s) => s.data.calibration)
  const evidence = useQuestStore((s) => s.data.evidence)
  const closePanel = useUiStore((s) => s.closePanel)
  const titleId = useId()

  const tallies = tallyByRung(calibration, evidence)
  const rows = calibration
    .map((row) => ({ row, hunch: evidence.find((e) => e.id === row.hunchEvidenceId) }))
    .filter((x): x is { row: CalibrationEntry; hunch: EvidenceEntry } => x.hunch !== undefined)

  return (
    <DialogShell
      titleId={titleId}
      onClose={closePanel}
      layerClassName="z-panel"
      panelClassName="max-w-2xl"
      testId="calibration-panel"
    >
      <div
        aria-hidden="true"
        className="mb-3 h-px w-16 rounded-full bg-gradient-to-r from-ink-line/70 to-transparent"
      />
      <h2 id={titleId} className="quest-heading text-xl font-semibold">
        {UI.calibration.panelTitle}
      </h2>
      {/* why this page exists — the record replaces introspection, never grades it */}
      <p className="mt-2 text-xs text-ink-faint">{UI.calibration.intro}</p>

      {rows.length === 0 ? (
        <p data-testid="calibration-empty" className="mt-4 text-sm italic text-ink-faint">
          {UI.calibration.empty}
        </p>
      ) : (
        <>
          <ul className="mt-4 flex flex-col gap-2">
            {rows.map(({ row, hunch }) => (
              <li key={row.hunchEvidenceId} data-testid="calibration-row" className="quest-aside p-3">
                <p className="text-sm text-ink">{hunch.text}</p>
                <p className="mt-1 text-2xs tracking-wide text-ink-faint">
                  {hunch.provenance !== undefined
                    ? UI.hunch.provenanceOptions[hunch.provenance]
                    : UI.hunch.provenanceUntagged}
                  {UI.common.metaSeparator}
                  <span
                    data-testid="calibration-outcome"
                    className={row.outcome !== undefined ? 'font-semibold text-ink-soft' : ''}
                  >
                    {row.outcome === 'held'
                      ? UI.calibration.held
                      : row.outcome === 'broke'
                        ? UI.calibration.broke
                        : UI.calibration.awaiting}
                  </span>
                </p>
              </li>
            ))}
          </ul>

          {/* per-rung hit-rates — plain counts, no color-coded judgment */}
          <ul className="mt-5 flex flex-col gap-1 border-t border-ink-line/25 pt-3">
            {RUNGS.filter((r) => tallies[r].total > 0).map((rung) => (
              <li
                key={rung}
                data-testid={`calibration-rate-${rung}`}
                className="text-xs text-ink-soft"
              >
                <span className="quest-label mr-2 text-2xs">{IMPORTANT_RUNG_LABELS[rung]}</span>
                {UI.calibration.rateLine(tallies[rung].held, tallies[rung].resolved)}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-6">
        <button
          type="button"
          data-testid="calibration-close"
          onClick={closePanel}
          className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
        >
          {UI.common.close}
        </button>
      </div>
    </DialogShell>
  )
}

/** rung display names — the first word of each plain definition */
const IMPORTANT_RUNG_LABELS: Record<HunchProvenance, string> = {
  earned: UI.hunch.provenanceOptions.earned.split(' ')[0] ?? '',
  adjacent: UI.hunch.provenanceOptions.adjacent.split(' ')[0] ?? '',
  wild: UI.hunch.provenanceOptions.wild.split(' ')[0] ?? '',
  borrowed: UI.hunch.provenanceOptions.borrowed.split(' ')[0] ?? '',
}
