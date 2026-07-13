// typed shim over the vendored UMD encoder (VENDORED.md) — declares only the
// minimal surface the game uses; the full upstream d.ts is kept for reference.
declare module '*/qrcode-generator/qrcode.js' {
  interface VendoredQr {
    addData(data: string): void
    make(): void
    createDataURL(cellSize?: number, margin?: number): string
  }
  const factory: (typeNumber: number, errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H') => VendoredQr
  export default factory
}
