// src/strings/temple.ts — the Council temple's CHROME copy (C-1). The canon
// lines (key/consent/errors/caption — 04, byte-parity-tested) live in
// council.ts and are imported by the panel directly; this module holds only
// the surface's own labels. Live calls stay DARK until BLOCKERS B-4 resolves
// — the panel says so honestly.

export const TEMPLE = {
  title: 'The Council Temple',
  hudButton: 'Council (C)',

  key: {
    heading: 'Your key',
    placeholder: 'paste your Anthropic key',
    save: 'Keep on this device',
    saved: 'A key is kept on this device.',
    remove: 'Remove key',
    none: 'No key kept. The Council can also read by hand — see below.',
  },

  consent: {
    heading: 'Consent (once, stored)',
    grant: 'I understand — allow readings',
    granted: 'Consent recorded. You can withdraw it here anytime.',
    withdraw: 'Withdraw consent',
  },

  live: {
    heading: 'Convene the Council',
    dark: 'The live rite is not yet open — one canon passage still awaits its source (BLOCKERS B-4). Everything below works today, and your key will be ready.',
    button: 'Convene (not yet open)',
  },

  pasted: {
    heading: 'The reading, by hand',
    gloss: 'Copy your compact journal, carry it to your own Claude, and paste the reading back. Same rite, your own hands — no key needed.',
    copyJournal: 'Copy compact journal',
    copied: 'Copied.',
    pasteLabel: 'Paste the reading here',
    save: 'Keep this reading',
  },

  readings: {
    heading: 'Past readings',
    empty: 'No readings yet.',
    pastedBy: 'read by hand',
  },
} as const
