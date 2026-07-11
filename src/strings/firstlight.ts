// src/strings/firstlight.ts — ALL First Light copy (Mind & Myth A3): the
// invitation, the 11-beat induction script, the Cartographer's Chart + Legend,
// skip/re-entry prompts. Authored chrome per the voice laws: plain, warm,
// second person; never shame, never flatter; myth in the chrome, plain language
// in the asks. The mentor is the Raven (D-H) — it NEVER claims Council or
// Cartographer authorship, and the Chart carries the consent line verbatim.

export const FIRST_LIGHT = {
  /** Beat 1 — the invitation (required-but-escapable door; quiet, findable skip). */
  invitation: {
    title: 'Before you begin.',
    body: [
      'You could drop straight into the work. Most founders who do get lost — not because the work is hard, but because no one showed them the rules of this place.',
      'Let me show you. It takes about ten minutes. You’ll do real work — your first real assumption, your first real evidence — not a rehearsal. Everything I show you, you can call back any time with the map and the legend.',
    ],
    accept: 'Walk with me',
    skip: 'skip for now',
  },

  /** the mentor's name — the Raven (D-H); the app's diegetic face, pre-written only */
  mentor: 'The Raven',

  /** Beats 2–11 — dialogue lines (typewriter, instant-complete on input, never timed). */
  beats: {
    coldOpen: [
      'A nebula, still swirling. Nothing here is settled yet — not the ground, not the story.',
      'That is the point. You arrive before the truth does.',
    ],
    mentorMeet: [
      'I am the Raven. I fly ahead and report what I see — no more, no less.',
      'Walk with the arrow keys or WASD. Go on — take a few steps. I’ll wait.',
    ],
    mentorMeetDone: 'Good. The world answers your feet. Everything else answers your evidence.',
    vaultAsk: 'Now — what did you come here to build? Name it plainly. One line.',
    vaultSealed: [
      'It’s real, and it’s yours. And a blade drawn too early cuts the wielder.',
      'I’m keeping it safe in the Vault — captured, visible, sealed until World 3. Nothing is lost. We come back to it when the problem has earned it.',
    ],
    tiersIntro: [
      'Five kinds of knowing, five coins: Whisper — a hunch. Rumor — you heard it somewhere. Word — they said it to you. Deed — you watched them do it. Gold — they paid.',
      'Only Deed and Gold — seen and paid — move the Truth bar. Hunches never move it, no matter who whispers them.',
    ],
    classifyAsk:
      'Try it. A founder tells me: “People will pay for this — my friends all said so.” Which coin is that?',
    classifyRight: 'Rumor. Heard, not seen. The bar holds — and now you know why.',
    classifyWrong:
      'Close — but it’s Rumor: heard from friends, not said by a customer to you, not seen, not paid. The bar holds.',
    assumptionAsk: [
      'Now the real work. Name the one belief your venture leans on hardest — the thing that, if it breaks, the whole plan breaks with it.',
    ],
    killCriterionAsk:
      'Before you look for proof, decide what would prove it WRONG. Write the result that kills this belief. We seal it now, before any evidence exists — so later, no one can move the goalposts. Not even you.',
    assumptionSealed: 'Sealed and timestamped. That is Ariadne’s Thread — you’ll meet it again at the Labyrinth.',
    evidenceAsk: [
      'Bring me one thing someone actually SAID to you about this problem. Their words, word for word — not your summary of them. Verbatim is Word; a paraphrase is only Rumor.',
    ],
    evidenceSourceAsk: 'Who said it?',
    evidenceLogged:
      'Logged: Word. Watch the Truth bar — it holds. Evidence banks; the verdict comes later, at the Mirror. Banked is not proven.',
    killAsk: [
      'One more belief — this one every founder carries in the door: “I already know who my customer is.”',
      'Have you watched three of them try to solve this problem with their own hands and money?',
    ],
    killAdmit: 'Not yet — I’ve only heard',
    killSeen: 'I have — I’ve watched them',
    killCelebrate: [
      'Then the belief dies — and that is a WIN. You just learned something true about what you know. Wrong maps get founders lost; you made yours truer on day one.',
    ],
    killXp: '+15 First-Light XP — banked.',
    killSeenResponse:
      'Then you walk in rare company — that is Deed-level sight. The Registry will hold you to it, kindly.',
    legendHandoff: [
      'This is the Legend — every rune on your screen, named plainly. Call it any time with L. Nothing I taught you today is lost; it lives here.',
    ],
    chartHandoff: [
      'And this is the Chart — eight worlds on one road. You are here. The road dips in the middle for everyone; when it dips for you, the game eases off. That is the map’s promise, not your failure.',
      'I fly ahead now — you’ll find me at the Raven, World 2, where the real research begins.',
    ],
    threshold: 'The fence is down. The nebula is yours. Walk to the first shrine and kneel.',
  },

  /** shared dialogue chrome */
  chrome: {
    continueHint: 'any key — finish the line · Enter — continue',
    continueButton: 'Continue',
    inputContinue: 'That’s mine — continue',
    alreadyDone: 'already done on your first walk — continue',
    replayNote: 'You’ve walked this before. Nothing here will be written twice.',
  },

  /** skip re-entry (v1: one-time World-1 shrine prompt + campfire replay) */
  reentry: {
    promptTitle: 'You skipped the orientation.',
    promptBody: 'Want it now, or carry on? Ten minutes, real work — offered once, then I’ll hold my tongue.',
    accept: 'Show me now',
    decline: 'Carry on',
    campfireReplay: 'Return to First Light',
  },

  /** the Cartographer's Chart (M) — the map face */
  chart: {
    title: 'The Cartographer’s Chart',
    youAreHere: 'You are here',
    gateLabel: 'Act Gate',
    troughLabel: 'the road dips here — for everyone',
    tombstoneLabel: (n: number): string => (n === 1 ? '1 belief laid to rest' : `${n} beliefs laid to rest`),
    /** D-H consent line, verbatim from the ruling */
    consentLine:
      'The Chart is yours — it works offline and costs nothing. The Cartographer only speaks when you convene the Council.',
    /** pre-written first-open greet (never live AI) */
    firstOpenGreet: 'Every road looks long from the start. Walk it a waypoint at a time.',
    keyHint: 'M — chart · L — legend',
    /** HUD button labels once the Chart is handed over */
    hudChart: 'Chart (M)',
    hudLegend: 'Legend (L)',
  },

  /** the Legend (L) — 7 HUD elements, plain glosses; depth behind "more" */
  legend: {
    title: 'The Legend',
    entries: [
      {
        id: 'tiers',
        name: 'The five coins (E0–E4)',
        gloss: 'Whisper: a hunch. Rumor: you heard it. Word: they said it to you. Deed: you saw them do it. Gold: they paid.',
        more: 'Tier codes never change. A guardian’s tier is derived from the evidence linked to it — never declared. Only E2 and above can ever move Truth.',
      },
      {
        id: 'truth',
        name: 'The Truth bar',
        gloss: 'Only Deed and Gold — seen and paid — move this bar. Hunches never move it, no matter who whispers them.',
        more: 'Truth can sit at 0% while evidence banks. That is not a bug: evidence banked means the verdict is still ahead — it comes at the Mirror, World 5. Banked is not proven.',
      },
      {
        id: 'action',
        name: 'The Action bar',
        gloss: 'What you’ve done — milestones, self-reported. It moves easily. That’s the danger.',
        more: 'Action never feeds Truth or XP. When Action runs far ahead of Truth, the Shadow stirs.',
      },
      {
        id: 'shadow',
        name: 'The Shadow',
        gloss: 'When you do much but know little — high Action, low Truth — a rival stirs. Not to punish you. To remind you.',
        more: 'The Shadow holds fire in the trough (when your last three weather readings average low). It quotes only your own words back to you.',
      },
      {
        id: 'weather',
        name: 'The Weather Trail',
        gloss: 'Your mood, logged at the campfire. The road dips in the middle for everyone. When it dips, the game eases off.',
        more: 'Every tap is kept. The trough is read from your last three readings — it suppresses pressure, never adds it.',
      },
      {
        id: 'vault',
        name: 'The Vault',
        gloss: 'Sealed until World 3. Your ideas are safe. They are not lost.',
        more: 'Capture always works — two taps, no justification asked. Opening waits until the problem has earned a solution.',
      },
      {
        id: 'xp',
        name: 'XP',
        gloss: 'You earn more for killing a belief than confirming one. Fifteen for a kill, ten for a confirm. Wrong maps get you lost.',
        more: 'Only beliefs resolved with E2+ evidence pay. Side quests pay five. XP never moves Truth.',
      },
    ],
    moreLabel: 'more',
    lessLabel: 'less',
  },
} as const
