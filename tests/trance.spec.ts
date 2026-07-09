// tests/trance.spec.ts — trance-panel pure helpers. The quickadd prefill must
// re-attach guardians registered in an earlier trance (matching on statement +
// originStageId) so "This only works if ___" is never re-offered for an
// already-registered entry (Phase 2 review, ruled fix 8c).

import { describe, expect, it } from 'vitest'
import type { Assumption } from '../src/core/schema'
import { UI } from '../src/strings'
import { reattachQuickaddEntries } from '../src/ui/TrancePanel'

function guardian(id: string, statement: string, originStageId = 's1'): Assumption {
  return {
    id,
    statement,
    originStageId,
    importance: 'wobbles',
    status: 'untested',
    killCriterion: '',
    createdAt: '2026-07-01T00:00:00.000Z',
  }
}

const PREFIX = UI.trance.quickaddStatementPrefix

describe('reattachQuickaddEntries', () => {
  it('re-attaches a guardian whose statement matches "This only works if <entry>" in the same stage', () => {
    const g = guardian('guardian-7', `${PREFIX}cafés track their waste`)
    const entries = reattachQuickaddEntries(
      ['cafés track their waste', 'a line with no guardian'],
      's1',
      [g],
    )
    expect(entries).toEqual([
      { text: 'cafés track their waste', guardianId: 'guardian-7' },
      { text: 'a line with no guardian' },
    ])
  })

  it('does NOT match across stages — originStageId is part of the key', () => {
    const g = guardian('guardian-2', `${PREFIX}cafés track their waste`, 's2')
    const entries = reattachQuickaddEntries(['cafés track their waste'], 's1', [g])
    expect(entries).toEqual([{ text: 'cafés track their waste' }])
  })

  it('does NOT match a statement without the exact prefix or with different ink', () => {
    const bare = guardian('guardian-3', 'cafés track their waste')
    const other = guardian('guardian-4', `${PREFIX}something else entirely`)
    const entries = reattachQuickaddEntries(['cafés track their waste'], 's1', [bare, other])
    expect(entries).toEqual([{ text: 'cafés track their waste' }])
  })

  it('empty inputs stay empty', () => {
    expect(reattachQuickaddEntries([], 's1', [])).toEqual([])
  })
})
