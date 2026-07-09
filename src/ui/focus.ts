// src/ui/focus.ts — keyboard-focus plumbing shared by the dialog surfaces.
// A commit action often unmounts or disables the very control that held focus
// (Log as E2, Register guardian, Seal it in, row removes); the keyboard must
// never be stranded on <body> afterwards (adversarial review 2). Kept in its
// own module so panels AND inputs can use it without an import cycle through
// TrancePanel (which owns the dialog chrome).

/**
 * After a commit action unmounts/disables the control that held focus, move
 * focus somewhere deliberate (the next logical control) once React has
 * re-rendered.
 */
export function focusAfterCommit(get: () => HTMLElement | null): void {
  requestAnimationFrame(() => {
    get()?.focus()
  })
}
