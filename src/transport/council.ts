// src/transport/council.ts — THE one module that talks to Anthropic.
// Canon: 02 "Council call contract" (BYOK direct, 2026-07-08) + 05 fallback ruling (2026-07-08).
//
// - Browser POSTs https://api.anthropic.com/v1/messages directly with the player's own key;
//   no server sits in the path. This is the ONLY module allowed to name that host
//   (repo-guard tested in tests/guards.spec.ts).
// - `claude-fable-5` is pinned; `claude-sonnet-4-6` is used only after the player has
//   accepted the fallback offer. Persisting that acceptance is the CALLER's store concern —
//   transport is pure and just honors the flag it is handed.
// - No retry loops (Phase 1: the UI decides) and no model-access auto-switch — the OFFER
//   is a UI flow; transport only classifies failures and honors `fallbackAccepted`.
// - The player's key appears ONLY in the `x-api-key` header of the fetch call.
//   It is never logged, never stored, and never echoed into results or errors.
// - No player-facing copy here — typed failure codes only; strings map them to canon 04 copy.

export const PRIMARY_MODEL = 'claude-fable-5'
export const FALLBACK_MODEL = 'claude-sonnet-4-6'
export const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

const ANTHROPIC_VERSION = '2023-06-01'
const MAX_TOKENS = 1000
const DEFAULT_TIMEOUT_MS = 60_000
/** 02 call contract: the serialized request body may not exceed 400KB. */
export const MAX_INPUT_BYTES = 400_000

/** The three canonical rendered error classes (02/04 copy maps exactly these). */
export type CouncilFailure = 'network' | 'key' | 'model-access'

/**
 * What convene() itself can return. 'input-too-large' is 02's LOCAL pre-flight
 * guard on the 400KB input cap — it is NOT one of the three canonical rendered
 * error classes above: no request is made, classifyFailure never sees it, and
 * the UI treats it locally (trim the journal / retry) rather than via the
 * canon 04 error copy.
 */
export type ConveneFailure = CouncilFailure | 'input-too-large'

export interface CouncilMessage {
  role: 'user' | 'assistant'
  content: string
}

export type ConveneResult =
  /** `model` ALWAYS reports the model attempted/used — readings record their producer. */
  | { ok: true; text: string; model: string }
  | { ok: false; failure: ConveneFailure; status?: number; model: string }

export interface FailureSignals {
  networkError?: boolean
  timedOut?: boolean
  status?: number
  errorType?: string
  errorMessage?: string
}

/**
 * Classify a failed Council call into the three canonical classes.
 *
 * Classification table (02 call contract + 05 ruling):
 *
 * | Signal                                                        | Class          |
 * |---------------------------------------------------------------|----------------|
 * | fetch rejection / timeout / abort                             | 'network'      |
 * | HTTP 5xx (incl. 529 overloaded_error)                         | 'network'      |
 * | 401 (authentication_error — any 401 is a key problem)         | 'key'          |
 * | 402 (credit / payment required)                               | 'key'          |
 * | 400 with billing/credit wording (e.g. "credit balance is too  | 'key'          |
 * |   low", billing_error)                                        |                |
 * | 404 not_found_error whose message names the model             | 'model-access' |
 * | 403 permission_error whose message names model access         | 'model-access' |
 * | anything else / unknown                                       | 'network'      |
 *
 * Unknown defaults to 'network' — the retryable, honest default: the player is told
 * the Council is not in session rather than blamed for a key that may be fine.
 */
export function classifyFailure(input: FailureSignals): CouncilFailure {
  if (input.networkError === true || input.timedOut === true) return 'network'

  const status = input.status
  if (status === undefined) return 'network'

  const type = (input.errorType ?? '').toLowerCase()
  const message = (input.errorMessage ?? '').toLowerCase()

  // 5xx and 529 overloaded — the service, not the player.
  if (status >= 500) return 'network'

  // Key failures — player-fixable: check the key or add credit (canon 04 copy).
  if (status === 401 || status === 402) return 'key'
  if (
    status === 400 &&
    (type.includes('billing') || message.includes('billing') || message.includes('credit'))
  ) {
    return 'key'
  }

  // Model-access — the key works, but not for the pinned model (05 fallback ruling).
  if (status === 404 && type === 'not_found_error' && message.includes('model')) {
    return 'model-access'
  }
  if (status === 403 && type === 'permission_error' && message.includes('model')) {
    return 'model-access'
  }

  // Unknown → retryable, honest default.
  return 'network'
}

/**
 * `claude-fable-5` pinned unless the player has accepted the fallback offer.
 * The persisted acceptance lives in the caller's store — transport is pure.
 */
export function resolveModel({ fallbackAccepted }: { fallbackAccepted: boolean }): string {
  return fallbackAccepted ? FALLBACK_MODEL : PRIMARY_MODEL
}

export interface ConveneOptions {
  apiKey: string
  system: string
  messages: CouncilMessage[]
  fallbackAccepted: boolean
  fetchImpl?: typeof fetch
  /** default 60000 */
  timeoutMs?: number
}

/**
 * Convene the Council: one POST to Anthropic, one classified result.
 * Never throws; never places the key anywhere but the request header.
 */
export async function convene(opts: ConveneOptions): Promise<ConveneResult> {
  const model = resolveModel({ fallbackAccepted: opts.fallbackAccepted })
  const fetchImpl = opts.fetchImpl ?? fetch
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS

  const bodyJson = JSON.stringify({
    model,
    max_tokens: MAX_TOKENS,
    system: opts.system,
    messages: opts.messages,
  })

  // 02's 400KB input cap, enforced as a LOCAL pre-flight guard: measured on the
  // exact serialized body, and the request is never sent when it is exceeded.
  // Not one of the three canonical error classes — the UI treats it locally.
  if (new TextEncoder().encode(bodyJson).byteLength > MAX_INPUT_BYTES) {
    return { ok: false, failure: 'input-too-large', model }
  }

  const controller = new AbortController()
  const timer: ReturnType<typeof setTimeout> = setTimeout(() => controller.abort(), timeoutMs)

  let response: Response
  try {
    response = await fetchImpl(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': opts.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: bodyJson,
      signal: controller.signal,
    })
  } catch {
    // Rejection: our own abort (timeout) or a transport-level failure. The caught error
    // is deliberately never inspected, logged, or rethrown — it could carry request detail.
    clearTimeout(timer)
    const signals: FailureSignals = controller.signal.aborted
      ? { timedOut: true }
      : { networkError: true }
    return { ok: false, failure: classifyFailure(signals), model }
  }
  clearTimeout(timer)

  if (!response.ok) {
    const { errorType, errorMessage } = await readErrorBody(response)
    return {
      ok: false,
      failure: classifyFailure({ status: response.status, errorType, errorMessage }),
      status: response.status,
      model,
    }
  }

  const text = await readResponseText(response)
  if (text === null) {
    // 2xx with an unreadable/shape-broken body — treat as retryable.
    return { ok: false, failure: 'network', status: response.status, model }
  }
  return { ok: true, text, model }
}

/** Best-effort read of the Anthropic error envelope { error: { type, message } }. */
async function readErrorBody(
  response: Response,
): Promise<{ errorType?: string; errorMessage?: string }> {
  try {
    const parsed: unknown = await response.json()
    if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
      const err: unknown = (parsed as { error: unknown }).error
      if (typeof err === 'object' && err !== null) {
        const rec = err as Record<string, unknown>
        return {
          errorType: typeof rec['type'] === 'string' ? rec['type'] : undefined,
          errorMessage: typeof rec['message'] === 'string' ? rec['message'] : undefined,
        }
      }
    }
  } catch {
    // Unreadable body — classify on status alone.
  }
  return {}
}

/** Extract content[0].text from a success body; null when the shape is not as expected. */
async function readResponseText(response: Response): Promise<string | null> {
  try {
    const parsed: unknown = await response.json()
    if (typeof parsed === 'object' && parsed !== null && 'content' in parsed) {
      const content: unknown = (parsed as { content: unknown }).content
      if (Array.isArray(content)) {
        const first: unknown = content[0]
        if (typeof first === 'object' && first !== null && 'text' in first) {
          const text: unknown = (first as { text: unknown }).text
          if (typeof text === 'string') return text
        }
      }
    }
  } catch {
    // fall through
  }
  return null
}
