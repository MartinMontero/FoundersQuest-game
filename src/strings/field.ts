// src/strings/field.ts — Field Mode copy (A-101). Myth in the chrome, plain
// asks. Profiles are PROFILES, never persons (§2) — the copy says so.

export const FIELD = {
  title: 'Field Mode',
  hudButton: 'Field (F)',

  hunt: {
    heading: 'The Hunt List',
    hint: 'Profiles, never persons — a kind of someone, not a name.',
    placeholder: 'e.g. ops lead at a 20-50 person startup',
    add: 'Add profile',
    empty: 'No profiles yet. Name the kind of person who lives this problem.',
    slotOpen: 'open',
    slotAttempted: 'out there',
    slotHollow: 'hollow',
    slotFilled: 'filled',
    logAttempt: 'Log attempt',
    /** channels (A-101 §5 — introvert-inclusive) */
    channels: {
      'in-person': 'In person',
      call: 'Call',
      video: 'Video',
      'live-chat': 'Live chat',
    },
    resolve: 'Resolve',
    outcomes: {
      quote: 'Got a story (quote)',
      declined: 'Declined',
      'no-show': 'No-show',
      'no-story': 'No story',
    },
    hollowNote: 'A no is still a rep. Hollow counts on the Action side — honestly.',
  },

  lantern: {
    heading: 'The Lantern',
    gloss: 'Courage banked by trying — capped at 7, never a streak.',
    held: 'held — low weather freezes the flame',
  },

  day: {
    heading: 'Field Day',
    goalLabel: 'Attempts to aim for',
    start: 'Light the day',
    running: (done: number, goal: number): string => `${done}/${goal} attempts today`,
    retroPlaceholder: 'One line about how it went…',
    end: 'Close the day',
  },

  beam: {
    heading: 'Beam home',
    gloss: 'Copy this on your phone, paste it at your desk. The file contains their quotes — worth knowing before it travels.',
    copy: 'Copy beam',
    copied: 'Copied.',
    importHeading: 'Import a beam',
    pasteLabel: 'Paste a beam here',
    preview: 'Preview',
    confirm: (n: number): string => `Import ${n} ${n === 1 ? 'entry' : 'entries'}`,
    cancel: 'Cancel',
    nothingNew: 'Already have all of it — nothing new to import.',
    conflictNote: (n: number): string =>
      `${n} ${n === 1 ? 'record' : 'records'} skipped: same id, different content — never overwritten.`,
    blankedNote:
      'Some links pointed at beliefs this device does not hold — blanked; re-link at the Registry.',
    importedBadge: 'imported',
    showQr: 'Show as QR',
    hideQr: 'Hide QR',
    qrFrame: (part: number, of: number): string => `frame ${part} of ${of}`,
    qrPrev: 'Previous frame',
    qrNext: 'Next frame',
    fileLabel: 'Or import a beam file',
    /** camera scan — only offered where the browser has BarcodeDetector */
    scan: 'Scan a beam (camera)',
    scanStop: 'Stop scanning',
    scanHint: 'Frames are read on this device only — nothing is uploaded, nothing leaves.',
    scanLooking: 'Looking for beam frames…',
    scanProgress: (got: number, of: number): string => `${got} of ${of} frames caught`,
    scanDenied: 'Camera declined or unavailable — the file and paste paths always work.',
    counts: (c: Record<string, number>): string =>
      `profiles ${c['profiles'] ?? 0} · slots ${c['slots'] ?? 0} · attempts ${c['attempts'] ?? 0} · evidence ${c['evidence'] ?? 0} · field days ${c['fieldDayLog'] ?? 0}`,
  },
} as const
