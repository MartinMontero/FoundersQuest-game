// src/strings/ego.ts — the Ego's pre-written dialogue (Mind & Myth A5).
// D-E is law here: EVERY line the Ego speaks is authored in this file — the
// fight is complete with zero API spend, nothing generated, nothing sent.
// The Ego quotes the founder's RECORD (override reasons, ghost names, the
// untested beliefs) — their own words, drawn locally at render time.

export const EGO = {
  eyebrow: 'The Ego',

  /** D-F: arriving in the trough DELAYS the offer — never blocks, never nags */
  trough: {
    title: 'Not tonight',
    body: 'It is here — it has always been here — but it will not meet you in low weather. Rest. Log the skies. The threshold keeps.',
    leave: 'Step back',
  },

  /** the offer, when the skies allow */
  offer: {
    title: 'Everything you did not test is waiting',
    body: 'It wears your face. It argues with your voice. It is made of every gate you pushed through, every ghost you left restless, every belief you never put to the world. You can walk away — it will keep. Or you can face it.',
    enter: 'Face it',
    leave: 'Not yet',
  },

  /** HUD-visible fight chrome */
  fight: {
    hpLabel: 'Conviction',
    shieldsLabel: 'Walls',
    /** each shield names the founder's own logged override reason */
    shieldIntro: 'A wall you built:',
    shieldBreaks: 'The wall comes down. It was only ever a reason.',
    ghostsLabel: 'The unmourned',
    ghostLine: 'It summons what you never laid to rest.',
    ledgerHint: 'Cite what you hold. The phase decides what can land.',
    ledgerEmpty: 'You hold no evidence at all. It smiles with your mouth.',
    /** M-4 — the heavy attack, scaled by the DERIVED Action-Truth divergence */
    pressureNone: 'It circles, finding no opening — your Action never outran your Truth.',
    pressureLow: 'It presses: “You moved faster than you knew.” The gap is small. It knows it.',
    pressureHigh:
      'It swings the whole distance at you: “LOOK how far you ran ahead of what you tested.” The heaviest thing it holds is your own gap.',
    cite: 'Cite',
    cited: 'Cited',
    /** B2 holds against the Ego too — the bounce teaches, nothing more */
    bounce: 'It bounces. A hunch cannot move Truth — and the Ego is made of yours.',
  },

  /** the defense-mechanism ladder — entry line, deflect line, land line */
  phases: {
    denial: {
      title: 'Denial',
      enter: '“There is no problem here. Your data is wrong.”',
      deflect: 'It waves the words away. Denial only yields to what people DID and PAID — cite Deeds or Gold.',
      land: 'It flinches. It cannot argue with what happened.',
    },
    rationalization: {
      title: 'Rationalization',
      enter: '“That result doesn’t count. The sample was off. The timing was bad.”',
      deflect: 'It re-frames everything loose. Only evidence bound to a SEALED criterion holds its shape — cite against the thread.',
      land: 'The excuse dies against the timestamp. Sealed is sealed.',
    },
    projection: {
      title: 'Projection',
      enter: '“The market isn’t ready. The customers are wrong.”',
      body: 'It hurls your own untested beliefs at you, one by one. Do not dodge them. Take each one back — and commit it to a test.',
      returnOne: 'Return it as a test',
      returned: 'Taken back. It is yours to test now — the Ego cannot throw what you carry deliberately.',
      empty: 'It reaches for your untested beliefs — and finds none. There is nothing left to project.',
    },
    sunkCost: {
      title: 'Sunk cost',
      enter: '“Look how far we have come. We cannot stop now.”',
      deflect: 'The chains thicken with everything you have spent. They are cut only by proof an investment was not returning — or by Gold.',
      land: 'A chain snaps. What you spent was tuition, not debt.',
    },
    fusion: {
      title: 'Identity fusion',
      enter: '“To kill this idea is to kill you. We are the same thing.”',
      body: 'No citation lands here. There is no damage left to deal. It has your face now, and only one thing ends this: say the true thing, in your own words.',
      ask: 'Write it — you are not your idea:',
      placeholder: 'I am not my idea. I am…',
      seal: 'Say it',
    },
  },

  /** the integration ending — won, not killed (Celeste/Persona grounding) */
  integration: {
    title: 'It stops fighting',
    body: 'It does not die. It sits down beside you. Every gate, every ghost, every untested guess — still yours, none of it in your way. You tested honestly. That is the whole victory.',
    capstone: 'Cartographer’s Distance — you now see Truth and Action drift apart the moment it starts. The Chart carries the reading from here on.',
    done: 'Rise',
  },

  /** the permanent HUD readout the capstone unlocks */
  capstone: {
    hudLabel: 'Distance',
    hudTitle: 'Cartographer’s Distance — how far Action has outrun Truth',
    hudValue: (pp: number): string => `${pp} pp apart`,
  },
} as const
