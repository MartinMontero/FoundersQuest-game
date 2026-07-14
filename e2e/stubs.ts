// Network stubs for all Anthropic traffic — the QA boundary made executable.
// No real key ever exists in tests; every Council state is machine-verified
// through these route interceptions (both models, all three error classes).
import type { Page, Route } from '@playwright/test'

const ANTHROPIC = 'https://api.anthropic.com/**'

export interface StubbedCall {
  model: string
  hasDirectBrowserHeader: boolean
  maxTokens: number
  /** the system prompt EXACTLY as it crossed the wire */
  system: string
  /** messages[0].content — the journal exactly as sent */
  userContent: string
}

export type StubMode =
  | { kind: 'ok'; model?: string; text?: string }
  | { kind: 'network' }
  | { kind: 'http'; status: number }
  | { kind: 'key-invalid' }
  | { kind: 'model-access' }

/** Install an Anthropic stub; returns the log of calls the app actually made. */
export async function stubAnthropic(page: Page, mode: StubMode): Promise<StubbedCall[]> {
  const calls: StubbedCall[] = []
  await page.route(ANTHROPIC, async (route: Route) => {
    const req = route.request()
    const body = req.postDataJSON() as {
      model: string
      max_tokens: number
      system?: string
      messages?: { content?: string }[]
    } | null
    calls.push({
      model: body?.model ?? '(none)',
      hasDirectBrowserHeader: req.headers()['anthropic-dangerous-direct-browser-access'] === 'true',
      maxTokens: body?.max_tokens ?? -1,
      system: body?.system ?? '',
      userContent: body?.messages?.[0]?.content ?? '',
    })
    switch (mode.kind) {
      case 'ok':
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: [{ type: 'text', text: mode.text ?? 'A stubbed reading.' }],
            model: mode.model ?? body?.model,
          }),
        })
      case 'network':
        return route.abort('failed')
      case 'http':
        return route.fulfill({ status: mode.status, contentType: 'application/json', body: '{}' })
      case 'key-invalid':
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }),
        })
      case 'model-access':
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ type: 'error', error: { type: 'not_found_error', message: 'model: claude-fable-5' } }),
        })
    }
  })
  return calls
}
