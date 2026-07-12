// src/pwa.ts — service-worker registration + the install (A2HS) plumbing
// (F-9). Registration is PRODUCTION-ONLY: dev must never sit behind a cache
// while iterating. updateViaCache:'none' keeps sw.js itself always
// revalidated, so a shipped fix is never shadowed by an old worker.
//
// iOS/ITP honesty (§9): a browser may evict a guest's storage under
// pressure; installing raises persistence, and navigator.storage.persist()
// asks for the durable promise — but the TRANSFER (journal export, field
// beam) stays the real safety. The campfire copy says exactly that.

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = (): void => listeners.forEach((l) => l())

/** call once at boot (before the browser fires beforeinstallprompt) */
export function initPwa(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // no default mini-infobar — the campfire offers it calmly
    deferredPrompt = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {
      // an unregistered SW is a slower reload, not a broken game — stay quiet
    })
  })
}

/** subscribe/snapshot pair for useSyncExternalStore */
export function subscribeInstall(fn: () => void): () => void {
  listeners.add(fn)
  return (): void => void listeners.delete(fn)
}
export function installOffered(): boolean {
  return deferredPrompt !== null
}

/** the browser's own install flow — resolves when the founder chooses */
export async function promptInstall(): Promise<void> {
  const evt = deferredPrompt
  if (evt === null) return
  await evt.prompt()
  await evt.userChoice
  deferredPrompt = null
  notify()
}

/** ask the browser for the durable-storage promise (safe to re-ask) */
export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}

export async function isPersisted(): Promise<boolean> {
  try {
    return (await navigator.storage?.persisted?.()) ?? false
  } catch {
    return false
  }
}
