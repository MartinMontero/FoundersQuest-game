// src/strings/temple.ts — the Council temple's CHROME copy (C-1). The canon
// lines (key/consent/errors/caption — 04, byte-parity-tested) live in
// council.ts and are imported by the panel directly; this module holds only
// the surface's own labels. The live rite is OPEN (B-4 resolved 2026-07-13):
// one press, one page, the reading names its model.

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
    gloss:
      'One page: what the record shows, what it is silent on, and the road ahead. Your journal travels once, directly to Anthropic, with your own key.',
    button: 'Convene the Council',
    busy: 'The Council is reading…',
    needsKey: 'Keep a key above and the Council can convene from here.',
    tooHeavy:
      'The journal is too heavy for a single reading — trim your longest answers or field notes and convene again.',
    fallbackButton: 'Convene the fallback sage',
  },

  commitment: {
    label: 'One thing I will change',
    save: 'Seal it',
    sealed: (text: string): string => `Committed: ${text}`,
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
