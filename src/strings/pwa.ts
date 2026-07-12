// src/strings/pwa.ts — "this device" copy (F-9): install (A2HS), storage
// persistence, and the transfer-first framing. Honest about eviction — the
// browser is a guest room until it promises otherwise, and the real safety
// is a copy that leaves the browser entirely.

export const DEVICE = {
  legend: 'This device',
  hint: 'Your quest lives in this browser’s storage. Browsers treat sites like guests — under disk pressure, a guest’s things can be evicted.',
  persisted: 'This browser has made the durable-storage promise: your journal is a resident here, not a guest.',
  notPersisted: 'No durable-storage promise yet from this browser — eviction under disk pressure is possible.',
  install: 'Install the quest on this device',
  installHint: 'Installing (add to home screen) is the strongest promise a browser gives — on iOS it is also what lifts the seven-day storage clock.',
  transferFirst: 'The real safety is a copy OUTSIDE the browser: export your journal at this campfire, or beam your field records home. Paper burns; copies don’t.',
} as const
