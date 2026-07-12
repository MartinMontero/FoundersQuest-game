# Vendored: qrcode-generator 2.0.4

- **Source:** registry.npmjs.org/qrcode-generator/-/qrcode-generator-2.0.4.tgz
  (`package/dist/qrcode.js` + `qrcode.d.ts`)
- **Local modification (exactly one):** a 4-line ESM-compat footer appended to
  `qrcode.js` (`export default qrcode;` + comment) — upstream is UMD-only and
  Vite serves the file as a native ES module, so without an export the import
  fails to link and the app cannot boot. Everything above the marked footer is
  byte-identical to upstream.
  - upstream sha256: `79ec86f82856005b1c887905cfccfcfbec3821ca61c7fd5a952faa5f778f791c`
  - vendored sha256: `6de108a5ab29c94f0c8a4419a990f878f88493ffa7de4d04107a5ab8b5ac0af4`
- **License:** MIT — Copyright (c) 2009 Kazuhiko Arase (header retained in the
  file; license text at the header's URL). Vendored per ruling **R-H
  (modified)**: "vendor a single-file MIT QR *encoder*".
- **Deps-review table entry:** name `qrcode-generator` · version `2.0.4` ·
  license `MIT` · role: QR ENCODE side of the Field-Mode beam (phone displays).
- **Decoder note (R-H second half):** NO clean small MIT decoder verified
  (jsqr 1.4.0 = Apache-2.0; qr-scanner 1.4.2 = MIT-labelled but its decode
  core derives from jsQR — mixed lineage). Scan side therefore uses the
  native BarcodeDetector where available; file/paste remain the universal
  import path. Logged in BLOCKERS (F-8 deps-review) 2026-07-12.
- 'QR Code' is a registered trademark of DENSO WAVE INCORPORATED.
