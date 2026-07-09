// tests/transport.spec.ts — pins the 02 call contract + 05 fallback ruling (both 2026-07-08).
// All fetches are injected fakes; NO real network. No real key exists anywhere (QA boundary) —
// the key below is fabricated for the leak-proof assertions only.

import { describe, expect, it } from 'vitest'
import {
  ANTHROPIC_URL,
  FALLBACK_MODEL,
  MAX_INPUT_BYTES,
  PRIMARY_MODEL,
  classifyFailure,
  convene,
  resolveModel,
} from '../src/transport/council'
import type { ConveneResult, CouncilMessage } from '../src/transport/council'

const FAKE_KEY = 'sk-ant-fabricated-test-key-not-real-0000'
const MESSAGES: CouncilMessage[] = [{ role: 'user', content: 'the journal, compact' }]

interface CapturedRequest {
  url: string
  method: string | undefined
  headers: Record<string, string>
  body: unknown
}

function okResponse(text = 'The reading.'): Response {
  return new Response(JSON.stringify({ content: [{ type: 'text', text }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function apiError(status: number, type: string, message: string): Response {
  return new Response(JSON.stringify({ type: 'error', error: { type, message } }), { status })
}

/** A fetch fake that records the request and returns the canned response. */
function fakeFetch(makeResponse: () => Response): {
  fetchImpl: typeof fetch
  captured: CapturedRequest[]
} {
  const captured: CapturedRequest[] = []
  const fetchImpl: typeof fetch = (input, init) => {
    captured.push({
      url: String(input),
      method: init?.method,
      headers: { ...(init?.headers as Record<string, string>) },
      body: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
    })
    return Promise.resolve(makeResponse())
  }
  return { fetchImpl, captured }
}

/** Never resolves; rejects with AbortError when the transport's timeout aborts the signal. */
const hangingFetch: typeof fetch = (_input, init) =>
  new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => {
      reject(new DOMException('This operation was aborted', 'AbortError'))
    })
  })

const rejectingFetch: typeof fetch = () =>
  Promise.reject(new TypeError('Failed to fetch'))

function conveneWith(
  fetchImpl: typeof fetch,
  over: { fallbackAccepted?: boolean; timeoutMs?: number } = {},
): Promise<ConveneResult> {
  return convene({
    apiKey: FAKE_KEY,
    system: 'You are the Council.',
    messages: MESSAGES,
    fallbackAccepted: over.fallbackAccepted ?? false,
    fetchImpl,
    timeoutMs: over.timeoutMs,
  })
}

describe('constants (02: the one module that names the host)', () => {
  it('exports the canonical endpoint and both ruled models', () => {
    expect(ANTHROPIC_URL).toBe('https://api.anthropic.com/v1/messages')
    expect(PRIMARY_MODEL).toBe('claude-fable-5')
    expect(FALLBACK_MODEL).toBe('claude-sonnet-4-6')
  })
})

describe('resolveModel (05: pinned unless the player accepted the fallback)', () => {
  it('pins fable-5 when the fallback is not accepted', () => {
    expect(resolveModel({ fallbackAccepted: false })).toBe(PRIMARY_MODEL)
  })

  it('uses the fallback sage only after acceptance', () => {
    expect(resolveModel({ fallbackAccepted: true })).toBe(FALLBACK_MODEL)
  })
})

describe('classifyFailure — the classification table', () => {
  it.each([
    [{ networkError: true }, 'network'],
    [{ timedOut: true }, 'network'],
    [{ status: 500, errorType: 'api_error', errorMessage: 'internal error' }, 'network'],
    [{ status: 529, errorType: 'overloaded_error', errorMessage: 'Overloaded' }, 'network'],
    [{ status: 401, errorType: 'authentication_error', errorMessage: 'invalid x-api-key' }, 'key'],
    [{ status: 401 }, 'key'],
    [{ status: 402, errorMessage: 'payment required' }, 'key'],
    [
      {
        status: 400,
        errorType: 'invalid_request_error',
        errorMessage: 'Your credit balance is too low to access the Anthropic API.',
      },
      'key',
    ],
    [{ status: 400, errorType: 'billing_error', errorMessage: 'billing problem' }, 'key'],
    [
      {
        status: 404,
        errorType: 'not_found_error',
        errorMessage: 'model: claude-fable-5',
      },
      'model-access',
    ],
    [
      {
        status: 403,
        errorType: 'permission_error',
        errorMessage: 'Your API key does not have access to the model claude-fable-5.',
      },
      'model-access',
    ],
    // Unknowns fall to the retryable, honest default.
    [{ status: 404, errorType: 'not_found_error', errorMessage: 'Not found' }, 'network'],
    [{ status: 403, errorType: 'permission_error', errorMessage: 'forbidden' }, 'network'],
    [{ status: 429, errorType: 'rate_limit_error', errorMessage: 'slow down' }, 'network'],
    [{ status: 400, errorType: 'invalid_request_error', errorMessage: 'bad shape' }, 'network'],
    [{}, 'network'],
  ])('classifies %j as %s', (signals, expected) => {
    expect(classifyFailure(signals)).toBe(expected)
  })
})

describe('convene — request shape', () => {
  it('POSTs the canonical URL with the exact headers, incl. the browser-access opt-in', async () => {
    const { fetchImpl, captured } = fakeFetch(() => okResponse())
    await conveneWith(fetchImpl)

    expect(captured).toHaveLength(1)
    expect(captured[0]?.url).toBe(ANTHROPIC_URL)
    expect(captured[0]?.method).toBe('POST')
    expect(captured[0]?.headers).toEqual({
      'content-type': 'application/json',
      'x-api-key': FAKE_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    })
  })

  it('sends max_tokens 1000, the system prompt, and the messages verbatim', async () => {
    const { fetchImpl, captured } = fakeFetch(() => okResponse())
    await conveneWith(fetchImpl)

    expect(captured[0]?.body).toEqual({
      model: PRIMARY_MODEL,
      max_tokens: 1000,
      system: 'You are the Council.',
      messages: MESSAGES,
    })
  })

  it('body.model is fable-5 when fallbackAccepted is false', async () => {
    const { fetchImpl, captured } = fakeFetch(() => okResponse())
    await conveneWith(fetchImpl, { fallbackAccepted: false })
    expect(captured[0]?.body).toMatchObject({ model: PRIMARY_MODEL })
  })

  it('body.model is the fallback sage when fallbackAccepted is true', async () => {
    const { fetchImpl, captured } = fakeFetch(() => okResponse())
    await conveneWith(fetchImpl, { fallbackAccepted: true })
    expect(captured[0]?.body).toMatchObject({ model: FALLBACK_MODEL })
  })
})

describe('convene — results (every reading records its producer)', () => {
  it('happy path on the pinned model', async () => {
    const { fetchImpl } = fakeFetch(() => okResponse('One page, dense.'))
    const result = await conveneWith(fetchImpl)
    expect(result).toEqual({ ok: true, text: 'One page, dense.', model: PRIMARY_MODEL })
  })

  it('happy path on the accepted fallback', async () => {
    const { fetchImpl } = fakeFetch(() => okResponse('A different voice.'))
    const result = await conveneWith(fetchImpl, { fallbackAccepted: true })
    expect(result).toEqual({ ok: true, text: 'A different voice.', model: FALLBACK_MODEL })
  })

  it('timeout aborts and classifies as network', async () => {
    const result = await conveneWith(hangingFetch, { timeoutMs: 5 })
    expect(result).toEqual({ ok: false, failure: 'network', model: PRIMARY_MODEL })
  })

  it('fetch rejection classifies as network (and never throws)', async () => {
    const result = await conveneWith(rejectingFetch)
    expect(result).toEqual({ ok: false, failure: 'network', model: PRIMARY_MODEL })
  })

  it('500 → network, with the status reported', async () => {
    const { fetchImpl } = fakeFetch(() => apiError(500, 'api_error', 'internal error'))
    const result = await conveneWith(fetchImpl)
    expect(result).toEqual({ ok: false, failure: 'network', status: 500, model: PRIMARY_MODEL })
  })

  it('529 overloaded → network', async () => {
    const { fetchImpl } = fakeFetch(() => apiError(529, 'overloaded_error', 'Overloaded'))
    const result = await conveneWith(fetchImpl)
    expect(result).toEqual({ ok: false, failure: 'network', status: 529, model: PRIMARY_MODEL })
  })

  it('401 → key', async () => {
    const { fetchImpl } = fakeFetch(() => apiError(401, 'authentication_error', 'invalid x-api-key'))
    const result = await conveneWith(fetchImpl)
    expect(result).toEqual({ ok: false, failure: 'key', status: 401, model: PRIMARY_MODEL })
  })

  it("404 not_found_error naming the model → model-access", async () => {
    const { fetchImpl } = fakeFetch(() => apiError(404, 'not_found_error', 'model: claude-fable-5'))
    const result = await conveneWith(fetchImpl)
    expect(result).toEqual({
      ok: false,
      failure: 'model-access',
      status: 404,
      model: PRIMARY_MODEL,
    })
  })

  it('403 permission_error with model wording → model-access', async () => {
    const { fetchImpl } = fakeFetch(() =>
      apiError(403, 'permission_error', 'Your API key does not have access to the model claude-fable-5.'),
    )
    const result = await conveneWith(fetchImpl)
    expect(result).toEqual({
      ok: false,
      failure: 'model-access',
      status: 403,
      model: PRIMARY_MODEL,
    })
  })

  it('failure results still label the attempted model when on the fallback', async () => {
    const { fetchImpl } = fakeFetch(() => apiError(401, 'authentication_error', 'invalid x-api-key'))
    const result = await conveneWith(fetchImpl, { fallbackAccepted: true })
    expect(result).toEqual({ ok: false, failure: 'key', status: 401, model: FALLBACK_MODEL })
  })

  it('2xx with a shape-broken body degrades to a retryable network failure', async () => {
    const { fetchImpl } = fakeFetch(
      () => new Response(JSON.stringify({ unexpected: true }), { status: 200 }),
    )
    const result = await conveneWith(fetchImpl)
    expect(result).toEqual({ ok: false, failure: 'network', status: 200, model: PRIMARY_MODEL })
  })
})

describe('convene — 02 input cap (local pre-flight, not a canonical error class)', () => {
  it('exports the 400KB cap', () => {
    expect(MAX_INPUT_BYTES).toBe(400_000)
  })

  it('an oversized messages payload returns input-too-large and never calls fetch', async () => {
    const { fetchImpl, captured } = fakeFetch(() => okResponse())
    const result = await convene({
      apiKey: FAKE_KEY,
      system: 'You are the Council.',
      messages: [{ role: 'user', content: 'x'.repeat(MAX_INPUT_BYTES + 1) }],
      fallbackAccepted: false,
      fetchImpl,
    })
    expect(result).toEqual({ ok: false, failure: 'input-too-large', model: PRIMARY_MODEL })
    expect(captured).toHaveLength(0)
  })

  it('an oversized system prompt is capped too, before any request', async () => {
    const { fetchImpl, captured } = fakeFetch(() => okResponse())
    const result = await convene({
      apiKey: FAKE_KEY,
      system: 's'.repeat(MAX_INPUT_BYTES + 1),
      messages: MESSAGES,
      fallbackAccepted: true,
      fetchImpl,
    })
    // the model label still reports what would have been attempted
    expect(result).toEqual({ ok: false, failure: 'input-too-large', model: FALLBACK_MODEL })
    expect(captured).toHaveLength(0)
  })

  it('the cap measures BYTES of the serialized body, not characters', async () => {
    const { fetchImpl, captured } = fakeFetch(() => okResponse())
    // '✓' is 3 UTF-8 bytes: ~134k chars stay under a char-count cap but exceed 400KB of bytes
    const result = await convene({
      apiKey: FAKE_KEY,
      system: 'You are the Council.',
      messages: [{ role: 'user', content: '✓'.repeat(140_000) }],
      fallbackAccepted: false,
      fetchImpl,
    })
    expect(result).toEqual({ ok: false, failure: 'input-too-large', model: PRIMARY_MODEL })
    expect(captured).toHaveLength(0)
  })

  it('a payload under the cap goes through to fetch as normal', async () => {
    const { fetchImpl, captured } = fakeFetch(() => okResponse())
    const result = await conveneWith(fetchImpl)
    expect(result.ok).toBe(true)
    expect(captured).toHaveLength(1)
  })
})

describe('convene — the key never leaks (02: zero logging is structural)', () => {
  it('the api key appears in no result, success or failure', async () => {
    const outcomes: ConveneResult[] = [
      await conveneWith(fakeFetch(() => okResponse()).fetchImpl),
      await conveneWith(fakeFetch(() => apiError(401, 'authentication_error', 'bad key')).fetchImpl),
      await conveneWith(fakeFetch(() => apiError(500, 'api_error', 'oops')).fetchImpl),
      await conveneWith(
        fakeFetch(() => apiError(404, 'not_found_error', 'model: claude-fable-5')).fetchImpl,
      ),
      await conveneWith(hangingFetch, { timeoutMs: 5 }),
      await conveneWith(rejectingFetch),
    ]
    for (const result of outcomes) {
      expect(JSON.stringify(result)).not.toContain(FAKE_KEY)
      expect(JSON.stringify(result)).not.toContain('sk-ant-')
    }
  })

  it('the key travels only in the x-api-key header — not in the body', async () => {
    const { fetchImpl, captured } = fakeFetch(() => okResponse())
    await conveneWith(fetchImpl)
    expect(JSON.stringify(captured[0]?.body)).not.toContain(FAKE_KEY)
    expect(captured[0]?.headers['x-api-key']).toBe(FAKE_KEY)
  })
})
