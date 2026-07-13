// src/ui/FieldScan.tsx — the camera side of the F-8 beam: desktop scans the
// frames a phone displays. Native BarcodeDetector ONLY (no dependency — the
// R-H decoder fallback, deps-review in BLOCKERS): the button never renders on
// browsers without it, and file/paste stay the universal path. Everything the
// camera reads is handed to the SAME validateBeam('qr') pipeline as paste —
// the camera cannot import anything a paste couldn't. Frames never leave the
// device; the stream is torn down on close/unmount.
//
// UNTESTED in CI (honest label): headless Linux Chromium has neither a camera
// nor the Shape Detection API. The frame-assembly core (assembleFrames) is
// unit-tested; this component is the thin sensor in front of it.

import { useEffect, useRef, useState, type ReactElement } from 'react'
import { assembleFrames } from '../core/fieldImport'
import { FIELD } from '../strings'

interface DetectedBarcode {
  rawValue: string
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>
}
type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorLike

function detectorCtor(): BarcodeDetectorCtor | null {
  const w = window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }
  return w.BarcodeDetector ?? null
}

/** feature gate — the scan button only exists where this is true */
export function canScanBeams(): boolean {
  return (
    typeof window !== 'undefined' &&
    detectorCtor() !== null &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  )
}

const FRAME_RE = /^FQB1:[^:]+:(\d+):(\d+):/

export function FieldScan({
  onRaw,
  onClose,
}: {
  /** a fully assembled beam (envelope JSON) — parent runs validateBeam('qr') */
  onRaw: (raw: string) => void
  onClose: () => void
}): ReactElement {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const caught = useRef(new Map<number, string>())
  const [progress, setProgress] = useState<{ got: number; of: number } | null>(null)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    const Detector = detectorCtor()
    const video = videoRef.current
    if (Detector === null || video === null) return
    let stream: MediaStream | null = null
    let timer: number | null = null
    let done = false

    const tick = async (): Promise<void> => {
      if (done || video.readyState < 2) return
      let found: DetectedBarcode[] = []
      try {
        found = await new Detector({ formats: ['qr_code'] }).detect(video)
      } catch {
        return // a bad frame is not an error — the next tick tries again
      }
      let of: number | null = null
      for (const code of found) {
        const m = FRAME_RE.exec(code.rawValue)
        if (m === null) continue // stray QR in view — ignore
        caught.current.set(Number(m[1]), code.rawValue)
        of = Number(m[2])
      }
      if (of !== null) setProgress({ got: caught.current.size, of })
      if (of !== null && caught.current.size >= of) {
        const out = assembleFrames([...caught.current.values()])
        if (out.ok) {
          done = true
          onRaw(out.raw)
        } else {
          caught.current.clear() // cross-beam mix — start clean, keep scanning
          setProgress(null)
        }
      }
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        stream = s
        video.srcObject = s
        void video.play()
        timer = window.setInterval(() => void tick(), 250)
      })
      .catch(() => setDenied(true))

    return (): void => {
      done = true
      if (timer !== null) window.clearInterval(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [onRaw])

  return (
    <div data-testid="field-scan" className="quest-aside mt-2 flex flex-col items-center gap-1.5 p-3">
      {denied ? (
        <p data-testid="field-scan-denied" role="alert" className="text-sm text-ink-soft">
          {FIELD.beam.scanDenied}
        </p>
      ) : (
        <>
          {/* muted + playsInline: never audible, never fullscreen-hijacked */}
          <video ref={videoRef} muted playsInline className="h-52 w-52 rounded object-cover" />
          <p className="text-2xs text-ink-faint">
            {progress === null
              ? FIELD.beam.scanLooking
              : FIELD.beam.scanProgress(progress.got, progress.of)}
          </p>
          <p className="text-2xs italic text-ink-faint">{FIELD.beam.scanHint}</p>
        </>
      )}
      <button
        type="button"
        data-testid="field-scan-stop"
        onClick={onClose}
        className="quest-btn quest-btn-quiet px-2 py-0.5 text-2xs"
      >
        {FIELD.beam.scanStop}
      </button>
    </div>
  )
}
