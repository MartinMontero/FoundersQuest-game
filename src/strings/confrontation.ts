// src/strings/confrontation.ts — the Confrontation loop + Funeral rite copy
// (Mind & Myth A4). Myth lives in the chrome; every ASK stays plain (canon 01
// register rule). No canon strings duplicated — the guardian's statement, the
// kill criterion, and eulogy evidence are the founder's OWN words, quoted back
// from the record at render time. All impact/counter lines are pre-written
// here: nothing in the arena is generated, nothing leaves the device.

export const CONFRONTATION = {
  eyebrow: 'The Proving Circle',

  /** the circle with no eligible guardian — an honest empty state, no fake foe */
  empty: {
    title: 'The circle stands empty',
    body: 'No belief of this world stands challenge right now. Register a guardian at the Assumption Registry — the circle will call the riskiest one.',
    leave: 'Step back',
  },

  challenge: {
    /** the guardian speaks the founder's own registered claim */
    opens: 'The guardian rises. It argues in your own voice:',
    hpLabel: 'Argument',
    composureLabel: 'Composure',
    /** B3 — a spent argument resolves nothing; the copy says exactly that */
    spent:
      'The argument is spent — it has nothing left to say. Chip damage never settles a belief: only the world can. Record the verdict below.',
  },

  ledger: {
    title: 'Cite your Ledger',
    hint: 'Real entries only — each coin spends once here.',
    cite: 'Cite',
    cited: 'Cited',
    empty:
      'Your Ledger holds nothing to cite. Evidence is gathered out in the world — talk to people, watch what they do, note what they pay.',
  },

  /** impact lines — the E0/E1 bounce teaches "this can't move Truth", nothing more */
  impact: {
    bounce: 'It bounces. A hunch cannot move Truth — and it cannot move this guardian.',
    hit: 'Their words land. The argument buckles under what people actually said.',
    heavy: 'What they DID cuts deeper than anything they said. A heavy blow.',
    shatter: 'Payment. The composure shatters outright — nothing argues with money spent.',
  },

  /** the guardian's pre-written bias defenses (counterattack beats, wrapper) */
  counters: [
    'It rallies: “Everyone I ask agrees with me.” — it cherry-picks, and the window closes.',
    'It digs in: “We have come too far to be wrong now.” — sunk cost hardens around it.',
    'It waves you off: “They just don’t get it yet.” — dismissal, and the window closes.',
  ],

  thread: {
    title: 'The Golden Thread',
    sealedIntro: 'The kill criterion you sealed wraps its core:',
    /** honest edge: a guardian registered without a sealed criterion */
    unsealed:
      'No kill criterion was sealed for this belief — the thread is unspun. Name the verdict plainly all the same:',
    verdictAsk: 'What did the world actually say? Record the verdict first — interpret after.',
    tripped: 'The criterion tripped',
    trippedGloss: 'the belief is dead',
    held: 'The criterion held',
    heldGloss: 'the belief stands proven',
    ignited:
      'Verdict recorded. The thread ignites — the finishing strike is yours, now or whenever you return. It does not expire.',
    strike: 'Strike the golden thread',
  },

  /** both outcomes are wins — equally authored (D-D) */
  outcome: {
    invalidated: {
      title: 'It shatters',
      body: 'The belief dies, and you are lighter for it. A monster is gone; the map just got truer.',
      xpProven: '+15 XP banked — invalidation pays half again more than proof.',
      xpUnproven:
        'No proven coin stands behind this death yet — the honors bank when real evidence does.',
      toRite: 'Hold the funeral',
      riteQueued:
        'The skies are low. The circle will hold the vigil when they lift — the funeral waits for you, not the other way around.',
    },
    validated: {
      title: 'The Truth shall set you free',
      body: 'The guardian does not die — it turns. What stood against you now stands FOR you: a proven pillar you can build on.',
      xpProven: '+10 XP banked.',
      xpUnproven:
        'Unproven still — the pillar stands on your word until real evidence bears its weight.',
    },
    leave: 'Leave the circle',
  },

  /** the action wrapper (D-C: skill accelerates, never locks) */
  wrapper: {
    poiseLabel: 'Poise',
    pressHint:
      'It presses its case. Strike — Space — to break its poise and open the window early. Or hold your ground: every argument runs out of breath on its own.',
    windowOpen: 'An opening. The citation window is yours.',
    strike: 'Strike (Space)',
  },
} as const

export const RITE = {
  eyebrow: 'The Funeral Rite',

  vigil: {
    title: 'Vigil',
    quiet: 'The world quiets.',
    beliefLabel: 'Belief',
    /** composed with the world name / the date at render */
    born: 'Born',
    died: 'Died',
    continue: 'Keep the vigil',
  },

  eulogy: {
    title: 'Eulogy',
    intro: 'What killed it — in the world’s own words:',
    unproven:
      'No proven evidence stands behind this death. It goes to the grave on your word alone — an honest, unproven funeral.',
    continue: 'Speak the last word',
  },

  committal: {
    title: 'Committal',
    ask: 'One line for the stone — what this belief taught you.',
    placeholder: 'It was never everyone. It was…',
    seal: 'Seal the grave',
  },

  grant: {
    title: 'The inheritance',
    xpProven: '+15 XP — the 1.5× honors, inherited from the dead belief.',
    xpUnproven: 'No XP yet — the honors bank when proven evidence stands behind the death.',
    wisdom: 'Your line is written to the Wisdom Codex.',
    tombstone: 'A tombstone stands in this world now.',
    done: 'Rise',
  },

  /** the skip: a single warning, always allowed, narrative-only consequence */
  skip: {
    offer: 'skip the rite',
    warning:
      'You can skip — nothing is taken from you, ever. But an unmourned belief lingers as a ghost, and the Ego remembers every one. You can return and lay it to rest whenever you choose.',
    confirm: 'Skip anyway',
    cancel: 'Stay',
  },

  /** the HUD ember — the queued rite offer (never shown in the trough) */
  hud: {
    pending: 'A funeral awaits',
    ghost: 'A ghost lingers',
  },
} as const
