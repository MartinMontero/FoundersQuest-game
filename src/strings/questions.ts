// src/strings/questions.ts — the full question bank, VERBATIM from docs/canon/03-content-canon.md.
// ALL player-facing copy lives in src/strings — no string literals in components.
// Edits to any question happen in 03 and here in the same change (03 header rule);
// tests/parity.spec.ts byte-compares this file's data against 03 and fails on any drift.
//
// Transcription rules (mirrored exactly by the parity test's parser):
// - A question line in 03 is `- id [tag] text` or `- id text`. `text` is stored verbatim,
//   excluding the id and the lowercase `[tag]` marker, INCLUDING any bold/emphasis markers
//   exactly as written (the joy questions keep their `**[...]**` labels in `text`).
// - A trailing italic parenthesized annotation ` *(...)*` is a UI mechanics note: it is
//   stripped from `text` and stored in `mechanic` as `(...)` (parentheses kept, the italic
//   asterisks and the separating space dropped).
// - s8-th's marker in 03 is `[spine, evidence-locked]`: the tag is the first comma token
//   ('spine'); the 'evidence-locked' qualifier is part of the marker, not of `text`, and is
//   intentionally not stored as data (the [unproven]-warning mechanic carries the behavior).
// - The two joy questions (s3-joy, s8-l3) carry a bold `**[...]**` label instead of a
//   lowercase marker; they are tagged 'joy' here, and their labels stay in `text` verbatim.
// - Stage headings are `## Stage N · name — *epithet* · world`; Stage 3's heading carries a
//   trailing italic ` *(the Vault unseals)*` stored in `note` as `(the Vault unseals)`.
// - A stage's rule/banner line directly under its heading is stored whole-line verbatim in
//   `rule` (Stage 1 `Rule: ...`, Stage 2 `Field rules banner: ...`).
// - Mid-stage bold section headers are stored whole-line verbatim in `sections`, anchored to
//   the question id they precede.
// - `Milestones: a · b · c.` → the trailing period dropped, split on ' · '.

import type { WeatherEntry } from '../core/schema'

export type QuestionTag =
  | 'story'
  | 'names'
  | 'fivewhys'
  | 'number'
  | 'list'
  | 'quickadd'
  | 'falsify'
  | 'verbatim'
  | 'vault'
  | 'ifthen'
  | 'seal'
  | 'verdict'
  | 'registry'
  | 'decision'
  | 'spine'
  | 'joy'

export interface Question {
  id: string
  /** null = untagged plain prose input (03 header rule) */
  tag: QuestionTag | null
  /** verbatim from 03, excluding id and [tag] marker, including bold/emphasis markers */
  text: string
  /** the trailing italic parenthesized UI-mechanics note from 03, when present */
  mechanic?: string
}

export interface StageSection {
  /** the question id this section header sits directly above in 03 */
  beforeQid: string
  /** the full 03 line, verbatim (bold markers and any italic annotation included) */
  heading: string
}

export interface Stage {
  stage: number
  name: string
  /** hero's-journey epithet (the italic part of the 03 heading) */
  epithet: string
  world: string
  /** trailing italic annotation on the stage heading, e.g. '(the Vault unseals)' */
  note?: string
  /** the verbatim rule/banner line directly under the stage heading, when present */
  rule?: string
  sections?: StageSection[]
  questions: Question[]
  /** verbatim milestone strings (03 `Milestones:` line, trailing period dropped, split on ' · ') */
  milestones: string[]
}

export const STAGES: readonly Stage[] = [
  {
    stage: 1,
    name: 'The Problem',
    epithet: 'The Call to Adventure',
    world: 'Swirling Nebula',
    rule: 'Rule: the Vault is active — solution words (app, platform, feature, AI, build, tool, SaaS…) trigger a gentle nudge → capture to Vault, return to the problem.',
    questions: [
      {
        id: 's1-th',
        tag: 'story',
        text: 'Tell the last time you watched someone hit this problem. Who were they — name them — where were they, and what did they do next?',
      },
      {
        id: 's1-l1',
        tag: 'names',
        text: "Who exactly has this problem? Three real people or organizations. No personas, no 'busy professionals.'",
      },
      {
        id: 's1-l2',
        tag: 'fivewhys',
        text: 'Why is that a problem for them?',
        mechanic: '(chained ×5 to a visible root)',
      },
      {
        id: 's1-l3',
        tag: 'number',
        text: 'What does one occurrence cost — in minutes, dollars, or dignity? How often does it happen?',
      },
      {
        id: 's1-l4',
        tag: 'list',
        text: 'What do they do about it today? The workaround is your first competitor.',
      },
      {
        id: 's1-l5',
        tag: 'story',
        text: 'Why you? What have you lived, seen, or built that makes this problem yours to carry?',
      },
      {
        id: 's1-fp',
        tag: 'quickadd',
        text: 'Strip it bare. List only what you know from direct observation — not reports, not belief. Everything else goes to the Assumption Registry.',
        mechanic: '(inline "This only works if ___" → guardian)',
      },
      {
        id: 's1-fx',
        tag: 'falsify',
        text: "If this problem weren't worth solving, what would the world look like? Do you see any of that?",
      },
    ],
    milestones: ['story with a named person', 'three real people named', 'Five-Whys root reached'],
  },
  {
    stage: 2,
    name: 'Research',
    epithet: 'Meeting the Mentor',
    world: 'The Raven',
    rule: 'Field rules banner: *Talk about their life, not your idea. Past specifics, not future hypotheticals. Compliments are not data.*',
    sections: [
      {
        beforeQid: 's2-p1',
        heading:
          '**The Fellowship — People Over Idea** *(PIE: People 5× / Idea 2× / Enchantment 1.5×)*',
      },
    ],
    questions: [
      {
        id: 's2-th',
        tag: 'verbatim',
        text: 'Ask five people living this problem about the last time it happened — not whether they would use your idea. Paste what they said, word for word.',
        mechanic: '(+ "Log a quote as E2" shortcut)',
      },
      {
        id: 's2-l1',
        tag: null,
        text: "What's their current 'good enough' — the spreadsheet, the cousin, the doing-nothing? What does keeping it cost them?",
      },
      {
        id: 's2-l2',
        tag: null,
        text: "What did you hear that you didn't want to hear? Log that first.",
      },
      {
        id: 's2-l3',
        tag: 'names',
        text: 'Who profits from this problem existing? Who loses if it is solved?',
      },
      {
        id: 's2-l4',
        tag: null,
        text: 'Name the one external shift — a rule, a platform policy, a price, a technology — that could make this venture pointless or impossible within two years. How likely is it?',
      },
      {
        id: 's2-l5',
        tag: null,
        text: "Who has walked this exact terrain? What's the one question you'd ask them — and have you sent it?",
        mechanic: '(hint: experience over expertise — a veteran of the current workaround counts)',
      },
      {
        id: 's2-p1',
        tag: 'story',
        text: 'When did you last change your mind because someone pushed back? What did it cost you?',
      },
      {
        id: 's2-p2',
        tag: 'story',
        text: "What's the disagreement you and your cofounder keep not having? Have it — then write what each of you actually said. (Solo? Argue with the voice that disagrees, and transcribe.)",
      },
      {
        id: 's2-p3',
        tag: 'names',
        text: 'Who — besides you — is illogically enchanted by this? Name them. If no one, log that in the ledger too.',
      },
      {
        id: 's2-p4',
        tag: 'list',
        text: 'What are you bringing that helps everyone else succeed — before anyone helps you?',
      },
      {
        id: 's2-fx',
        tag: 'falsify',
        text: 'What pattern across your five conversations would tell you this problem is real but not urgent? Do you see it?',
      },
    ],
    milestones: ['five E2+ conversations', 'one E3/E4 entry', 'riskiest guardian with kill criterion'],
  },
  {
    stage: 3,
    name: 'Prototyping',
    epithet: 'The Approach',
    world: 'The Phoenix',
    note: '(the Vault unseals)',
    questions: [
      {
        id: 's3-th',
        tag: null,
        text: "Write your customer's sentence in their words from your ledger: 'When I [situation], I want to [motivation], so I can [outcome].'",
      },
      {
        id: 's3-l1',
        tag: 'vault',
        text: 'Open the Vault. Which captured idea attacks the root cause from your Five Whys — not a symptom of it?',
      },
      {
        id: 's3-l2',
        tag: 'ifthen',
        text: 'State the logic before you build: IF ___ / THEN when [named segment] meets [prototype], we will observe [behavior] / WITHIN [days].',
        mechanic: '(+ "Register the IF as a guardian")',
      },
      {
        id: 's3-l3',
        tag: null,
        text: "What's the smallest thing you can put in front of a real customer in 7 days that lets them answer with behavior — a sketch, a fake door, a concierge run you do by hand?",
      },
      {
        id: 's3-l4',
        tag: 'list',
        text: "Which features are for the customer, and which are for your ego? Write the second list — that's what goes into the flames.",
      },
      {
        id: 's3-l5',
        tag: null,
        text: 'Am I building to learn, or building to be admired?',
      },
      {
        id: 's3-joy',
        tag: 'joy',
        text: '**[The Spark of Joy]** Beyond killing the pain — what one moment could make them smile and tell a friend? Name the moment. Design it on purpose.',
      },
    ],
    milestones: ['JTBD in their words', 'IF-THEN stated before building', '7-day artifact chosen'],
  },
  {
    stage: 4,
    name: 'Testing',
    epithet: 'Crossing the Threshold',
    world: 'The Labyrinth',
    questions: [
      {
        id: 's4-th',
        tag: 'seal',
        text: "Before anything runs: write the result that makes you stop or pivot. Seal it. This is Ariadne's Thread.",
        mechanic: '(timestamped, locked; two-step confirm)',
      },
      {
        id: 's4-l1',
        tag: null,
        text: 'What behavior are you measuring — not opinions you are collecting? Clicks, sign-ups, prepayments, returns, time-on-task.',
      },
      {
        id: 's4-l2',
        tag: null,
        text: 'What does a costly yes look like — money, a deposit, a calendar hold, an intro to their boss? Compliments are not currency.',
      },
      {
        id: 's4-l3',
        tag: 'story',
        text: 'Where did testers get lost — and what did they do in the ten seconds before quitting?',
      },
      {
        id: 's4-l4',
        tag: 'falsify',
        text: "If the test 'succeeds', what's the strongest boring explanation — novelty, politeness, the wrong crowd? How do you rule it out?",
      },
      {
        id: 's4-l5',
        tag: null,
        text: "What's the smallest step you can take today?",
      },
    ],
    milestones: ['thread sealed before testing', 'behavior metric defined', 'test run with real users'],
  },
  {
    stage: 5,
    name: 'Feedback',
    epithet: 'Tests, Allies & Enemies',
    world: 'The Mirror',
    questions: [
      {
        id: 's5-th',
        tag: 'verdict',
        text: "Open the seal. Did Ariadne's Thread trigger — yes or no? Answer before you interpret anything else.",
        mechanic: '(shows the sealed text; verdict invites the Council)',
      },
      {
        id: 's5-l1',
        tag: null,
        text: 'What uncomfortable truths is the mirror showing me?',
        mechanic: '(v2 verbatim)',
      },
      {
        id: 's5-l2',
        tag: null,
        text: 'Am I listening to the market, or protecting my own ego?',
        mechanic: '(v2 verbatim)',
      },
      {
        id: 's5-l3',
        tag: null,
        text: 'What is the gap between my intention and their perception?',
        mechanic: '(v2 verbatim)',
      },
      {
        id: 's5-l4',
        tag: null,
        text: 'Take the most inconvenient entry in your ledger and argue its case like you are its lawyer. What if it is right?',
      },
      {
        id: 's5-l5',
        tag: 'registry',
        text: 'Which Stage-1 belief is now dead? Hold the funeral: mark it invalidated in the Registry — and take the XP.',
      },
      {
        id: 's5-dec',
        tag: 'decision',
        text: 'Pivot, or persevere? Cite the evidence that decides it.',
        mechanic: '(locked until ≥1 citation)',
      },
    ],
    milestones: ['verdict recorded', 'one funeral held', 'decision cited to evidence'],
  },
  {
    stage: 6,
    name: 'Refinement',
    epithet: 'The Ordeal',
    world: 'The Sculptor',
    sections: [{ beforeQid: 's6-u1', heading: '**The Unseen — Ethical Impact**' }],
    questions: [
      {
        id: 's6-th',
        tag: null,
        text: 'What do users actually do with it, versus what you built it for? Cut everything serving only the second.',
      },
      {
        id: 's6-l1',
        tag: 'number',
        text: 'What one action must a new user complete to feel the value? Count the steps, seconds, and decisions standing in the way.',
      },
      {
        id: 's6-l2',
        tag: null,
        text: 'If you fix one thing this week, what does the evidence — not your taste — say it is?',
      },
      {
        id: 's6-u1',
        tag: 'names',
        text: 'Who is affected but not in the room? Name them. What would they say if they read your plan?',
      },
      {
        id: 's6-u2',
        tag: null,
        text: 'How would a bad actor use this exactly as designed? What is the cheapest guardrail, built now while it is cheap?',
      },
      {
        id: 's6-u3',
        tag: null,
        text: 'What behavior does your revenue model reward at scale? Are you at peace with what it optimizes?',
      },
      {
        id: 's6-u4',
        tag: null,
        text: 'Whose data do you touch — and what is the least of it you can hold?',
      },
    ],
    milestones: ['cuts from observed use', 'time-to-value counted', 'one guardrail named'],
  },
  {
    stage: 7,
    name: 'Implementation',
    epithet: 'The Road Back',
    world: 'The Bridge',
    questions: [
      {
        id: 's7-th',
        tag: 'number',
        text: 'Walk one customer across the bridge — one month, real figures. What do they pay, what does serving them cost, what remains? Any number you do not know is an assumption: register it.',
        mechanic: '(+ quick-add guardian)',
      },
      {
        id: 's7-l1',
        tag: null,
        text: 'Has anyone paid, pre-paid, or given up something costly — time, data, a deposit, an introduction? What is the closest thing to money you have collected?',
      },
      {
        id: 's7-l2',
        tag: null,
        text: 'Which single plank — a person, a platform, a supplier, an API — drops the whole bridge if it snaps? What is your 30-day plan if it snaps tomorrow?',
      },
      {
        id: 's7-l3',
        tag: 'names',
        text: 'Who is crossing with you — and what commitment has each actually made, out loud?',
      },
      {
        id: 's7-l4',
        tag: 'list',
        text: 'If revenue halves for two quarters, what goes first, second, third? Decide while you are calm.',
      },
      {
        id: 's7-l5',
        tag: 'list',
        text: 'What are you deliberately not doing? Strategy is sacrifice — name three.',
      },
    ],
    milestones: ['unit walk-through written', 'SPOF + 30-day plan', 'three deliberate nots'],
  },
  {
    stage: 8,
    name: 'Launch',
    epithet: 'Return with the Elixir',
    world: 'The Rocket',
    questions: [
      {
        // 03 marker: [spine, evidence-locked] — tag is the first token; see file header.
        id: 's8-th',
        tag: 'spine',
        text: "The elixir is the story. Tell it with your customer as the hero and you as the guide: 'Once there was [named customer]. Every day, [struggle]. Until one day, [your work]. Because of that, [observed outcome]. Until finally, [transformation].' Every beat cites evidence, or it does not cast.",
        mechanic: '(uncited spine renders an [unproven] warning)',
      },
      {
        id: 's8-l1',
        tag: 'number',
        text: "One number tells you it is flying. Which one, why that one, and what is this month's honest target?",
      },
      {
        id: 's8-l2',
        tag: 'story',
        text: 'What did this journey disprove that you believed at the start? Write it for the next founder — that is the wisdom you return with.',
      },
      {
        id: 's8-l3',
        tag: 'joy',
        text: '**[Joy — survives every rewrite]** How will I celebrate crossing the final threshold?',
      },
      {
        id: 's8-l4',
        tag: null,
        text: 'Are you ready to let go and let it fly?',
      },
    ],
    milestones: [
      'spine cast from cited evidence',
      'one honest number and target',
      'wisdom for the next founder',
    ],
  },
]

// ---- Act Gates (03; gates warn, never block — canon 01) ----

export interface ActGate {
  /** matches the QuestData.gates keys in src/core/schema.ts */
  id: 'act1' | 'act2' | 'act3'
  /** the bold heading content, verbatim (⛩ included) */
  name: string
  afterStage: number
  /** everything after the colon on the 03 gate line, verbatim */
  criteria: string
}

export const ACT_GATES: readonly ActGate[] = [
  {
    id: 'act1',
    name: '⛩ Act I Gate — The First Threshold',
    afterStage: 2,
    criteria:
      'Stage-1 threshold answered · ≥5 E2+ entries · ≥1 E3/E4 · a guardian with a written kill criterion. Warn, never block; override = written reason, logged, exported.',
  },
  {
    id: 'act2',
    name: "⛩ Act II Gate — The Mirror's Verdict",
    afterStage: 5,
    criteria: 'verdict recorded · pivot/persevere decided with ≥1 citation.',
  },
  {
    id: 'act3',
    name: '⛩ Act III Gate — The Far Bank',
    afterStage: 7,
    criteria: 'unit walk-through answered · SPOF question answered.',
  },
]

// ---- Named loops (03) ----

/** the italic annotation on the `## Named loops` heading, verbatim (parentheses kept) */
export const NAMED_LOOPS_RULE =
  '(every loop demands one learning line; The Reset adds the cycle retro + undefended Critique the Quest)'

export interface NamedLoop {
  name: string
  from: number
  to: number
}

export const NAMED_LOOPS: readonly NamedLoop[] = [
  { name: 'The Reality Check', from: 5, to: 1 },
  { name: 'The Re-Build', from: 7, to: 3 },
  { name: 'The Reset', from: 8, to: 1 },
]

// ---- Side Quests (03) ----

/** the italic annotation on the `## Side Quests` heading, verbatim (parentheses kept) */
export const SIDE_QUESTS_RULE = '(+5 XP each; surfaced in the trough)'

export interface SideQuest {
  name: string
  /** the parenthesized description, verbatim (without the parentheses) */
  note: string
}

export const SIDE_QUESTS: readonly SideQuest[] = [
  { name: 'The 404', note: '24h — what you are NOT; PIE-derived' },
  { name: 'The Obituary', note: 'pre-mortem; killers become guardians' },
  { name: 'The Fan Letter', note: 'ledger-constrained joy' },
  { name: 'The Swap', note: 'trade Briefs; lawyer/Shadow reads' },
]

// ---- Family Dinner (03) ----
// Ships as strings for future use ONLY. NO UI reads this in this build, and Family Dinner
// data is schema keys only — never serialized, structurally excluded from every export
// (CLAUDE.md / canon 02). Do not wire this constant to any component in Phase 1.

/** the italic annotation on the `## Family Dinner` heading, verbatim (parentheses kept) */
export const FAMILY_DINNER_ANNOTATION =
  '(facilitator mode; structurally excluded from all serialization)'

/** the full 03 rules line, verbatim (bold bucket markers included) */
export const FAMILY_DINNER_RULES =
  "Rules of the table: no bragging · share what's going wrong · everyone talks · if you can help, help. Buckets: **Been there** (pair them) · **Now that's interesting** (rally) · **Do not pass Go** (intractable — route around it). Ninety minutes, tops. What's said at dinner stays at dinner."

// ---- Weather (03) ----

/** the italic annotation on the `## Weather` heading, verbatim (parentheses kept) */
export const WEATHER_ANNOTATION = '(one tap, once a day, founder-owned)'

/** scale labels, keyed by the stored WeatherEntry value (schema contract) */
export const WEATHER_LABELS: Readonly<Record<WeatherEntry['value'], string>> = {
  1: 'Storm',
  2: 'Rain',
  3: 'Grey',
  4: 'Breaks',
  5: 'Clear',
}

/** the trough sentence from the 03 weather line, verbatim */
export const WEATHER_TROUGH_RULE =
  'Trough = last-3 mean ≤ 2 → Shadow holds fire; normalizing banner; Side Quests offered.'

// ---- Hints ----
// Placeholder ONLY: hints are authored in Phase 3 as a canon diff (03 keeps hints out of the
// doc for budget; they live in code and follow question-design law 3). Keyed by question id.

export const HINTS: Readonly<Record<string, string>> = {}
