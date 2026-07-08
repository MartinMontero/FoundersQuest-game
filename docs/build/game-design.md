# Founder's Quest — game design document
*Phase 0 rulings pack. Canon order: 01-constitution > this document. Every mechanic below writes to the `founders-quest:v3` data model in `02-architecture.md` — no parallel state, no game-side save file. Question ids and text are `03-content-canon.md` verbatim; Council copy is `04-council.md` byte-for-byte. Grey-box first: every world ships playable in untextured primitives before any asset pack lands.*

## 0 · Register and scope

**Register:** Super Mario Bros / Ocarina of Time. Readable silhouettes, one-screen-one-idea worlds, shrines you kneel at, flagpoles you raise, doors you walk through. The work is the verb set; the myth is the chrome (law 6: plain language in the ask, myth in the chrome).

**Platform:** desktop/keyboard-first, full game completable with keyboard alone. Mobile: one build, same storage ladder, Council available per A-101. The mobile surface is A-101 Field Mode — hunt list, slot lifecycle, Field Day, beam, PWA/A2HS; `docs/build/a101-field-mode-spec.md` governs everything Field — plus read-only journal review. No 3D traversal on mobile (integrator ruling R2).

**Stack:** Vite 5 · React 18 · React Three Fiber · drei · @react-three/rapier · Zustand · Tailwind 3.4 core + injected `QuestStyles` · lucide. No `<form>` tags anywhere. All copy — questions, hints, Council strings, gate warnings, error text — from one strings module (`src/strings.js`), byte-matched to 03 and 04.
*Required canon update:* 02's stack section ("zero other runtime deps", single-file `App.jsx`) describes the pre-game standalone port; it must be amended in the same commit the game code lands. Flagged here so the operator rules on it at Phase 0, not silently later.

**Out of scope by name (D-scope, stop items):** D2, D5, Earned Hunch, i18n, Dinner UI (Family Dinner facilitation), sync endpoint. Dinner split per integrator ruling R3 — flagged as a ruling in the Phase 0 report (recommendation: accept; zero canon change needed): `dinnerCard` is the founder's OWN card (02: "Brief leads with `dinnerCard.text` when present") — in scope, with a minimal in-app editor and its Brief-lead behavior, canon 02 unchanged. `dinnerSession` and `dinnerLog` are the Family-Dinner-confidential keys: schema only (`EMPTY_DATA` defaults), no UI, never serialized — both serializer modes tested.

**Persistence:** one Zustand store hydrated through the `makeStore` storage ladder into `founders-quest:v3` (legacy v2 read-only migration per 02). The 3D world is a pure render of that store. Player's Anthropic key: own storage key via the same ladder, never inside `founders-quest:v3`, never serialized, visible remove control (decision log 2026-07-08).

---

## 1 · The eight worlds

### Overworld shape

One continuous path — the PIE rollercoaster map made literal terrain (lineage: 01). Elevation follows the emotional curve: World 1 rides high on uninformed optimism, the path descends through 4–5 (the trough of sorrow, where the Graveyard sits), climbs through 6–7, and crests at the Rocket. Three Act Gate doors stand across the path after Worlds 2, 5, and 7. The Council temple sits on a hill visible from every world, reachable by a spur path from each campfire. Toll portals (loops) stand at Worlds 5, 7, and 8.

The whole path is walkable from minute one. **Gates warn, never block** (01). The only hard locks are the three canonical sequence locks, which are content locks, not gates:

| Lock | Rule | Canon source |
|---|---|---|
| The Vault | Sealed till Stage 3; capture always works, opening does not | 01, 03 (Phoenix: "the Vault unseals") |
| The Mirror's demand | World 5 shrines locked until `s5-th` verdict recorded | 03 ("Answer before you interpret anything else") |
| The decision | `s5-dec` inscribe button locked until ≥1 citation | 03 |

Ariadne's Thread is not a lock (integrator ruling R4): the seal stone (`s4-th`) sits at the maze mouth; while it is unanswered, Labyrinth interior shrines warn with a seal-first line but remain answerable — warn, never block. The Mirror's verdict-first rule (`s5-th`) is canon and stands.

**Weather is literal.** The most recent `weather[]` value drives the global sky: 1 Storm (rain sheets, lightning, dark) · 2 Rain · 3 Grey (flat overcast) · 4 Breaks (god rays) · 5 Clear. No entry yet today → sky holds the last logged value and the weather totem at every campfire pulses. Trough (mean of last ≤3 values ≤ 2, computed per 02): Shadow silent, momentum frozen, side quest board lanterns light up, normalizing banner shown.

**Momentum** has a single source: the stored A-101 `momentum` key — `{ value 0..7, lastAttemptDate, lastTickDate }`, field-attempt increments, decay tick, trough freeze (`docs/build/a101-field-mode-spec.md`). The lantern the player carries is a pure renderer of `momentum.value`; no separate derived mechanic exists (integrator ruling R1). In the trough the tick freezes (frozen, not punished), per A-101.

**Per-world furniture (every world):** a campfire waypoint (spawn point; weather totem; field-notes lectern → `fieldNotes[stageId]`; side quest board), shrines (one per question), milestone flagpoles (one per 03 milestone), and the stage's special set pieces below.

### World 1 · The Problem — Swirling Nebula
- **Visual identity:** floating stone islands in violet-blue nebula fog; the ground itself is unformed — edges dissolve into particles. Highest elevation on the rollercoaster. Grey-box: floating box platforms, fog, point-sprite swirl.
- **Layout:** a spiral of islands descending inward to the Five Whys well at the center. The Vault — a visible, chained chest — hovers over the spiral, watching (01: "captured, visible, and sealed").
- **Vault nudge:** any answer here containing solution words (app, platform, feature, AI, build, tool, SaaS…) triggers the gentle nudge → capture to `vault[]`, return to the problem (03 Stage 1 rule).
- **Shrines:** `s1-th` [story] "Tell the last time you watched someone hit this problem…" · `s1-l1` [names] "Who exactly has this problem?…" · `s1-l2` [fivewhys] "Why is that a problem for them?…" (the well: five descending rings, one why per ring, root glows at the bottom) · `s1-l3` [number] "What does one occurrence cost…" · `s1-l4` [list] "What do they do about it today?…" · `s1-l5` [story] "Why you?…" · `s1-fp` [quickadd] "Strip it bare…" (inline "This only works if ___" → guardian) · `s1-fx` [falsify] "If this problem weren't worth solving…"
- **Flagpoles (3):** story with a named person · three real people named · Five-Whys root reached.

### World 2 · Research — The Raven
- **Visual identity:** dusk forest and rookery; ravens on bare branches; ink-dark palette with paper-white accents. The field-rules banner from 03 hangs at the entrance arch: *"Talk about their life, not your idea. Past specifics, not future hypotheticals. Compliments are not data."*
- **Layout:** a main forest trail of five listening shrines; a firelit clearing off-trail — **The Fellowship** — with the four people shrines in a circle; the falsify shrine perched last, before the Act I Gate.
- **Shrines:** `s2-th` [verbatim] "Ask five people living this problem…" (+ "Log a quote as E2" shortcut) · `s2-l1` (prose) "What's their current 'good enough'…" · `s2-l2` (prose) "What did you hear that you didn't want to hear?…" · `s2-l3` [names] "Who profits from this problem existing?…" · `s2-l4` (prose) "Name the one external shift…" · `s2-l5` (prose) "Who has walked this exact terrain?…" · Fellowship: `s2-p1` [story] · `s2-p2` [story] · `s2-p3` [names] · `s2-p4` [list] · `s2-fx` [falsify] "What pattern across your five conversations…"
- **Flagpoles (3):** five E2+ conversations · one E3/E4 entry · riskiest guardian with kill criterion.
- **Act I Gate — The First Threshold** at the exit (see §4 gates).

### World 3 · Prototyping — The Phoenix
- **Visual identity:** ember canyon; ash drifts up, not down; a forge and a pyre; orange-on-charcoal. The Vault chest sits open on an altar — **`vaultUnlocked` flips true on first entry to this world**.
- **Layout:** forge path: JTBD anvil → open Vault altar → IF-THEN drafting table → the pyre (where the ego-feature list burns, `s3-l4`: "that's what goes into the flames") → the Spark of Joy shrine, a single warm lantern apart from the fire.
- **Shrines:** `s3-th` (prose) "Write your customer's sentence in their words…" · `s3-l1` [vault] "Open the Vault. Which captured idea attacks the root cause…" · `s3-l2` [ifthen] "State the logic before you build: IF ___ / THEN…" (+ "Register the IF as a guardian") · `s3-l3` (prose) "What's the smallest thing you can put in front of a real customer in 7 days…" · `s3-l4` [list] "Which features are for the customer, and which are for your ego?…" · `s3-l5` (prose) "Am I building to learn, or building to be admired?" · `s3-joy` [joy] "Beyond killing the pain — what one moment could make them smile…"
- **Flagpoles (3):** JTBD in their words · IF-THEN stated before building · 7-day artifact chosen.

### World 4 · Testing — The Labyrinth
- **Visual identity:** high hedge-stone maze under a low sky; a red thread runs from the entrance stone into the dark. Lowest-descending stretch of the rollercoaster begins.
- **Layout:** the seal stone (`s4-th`) stands at the maze mouth; the interior shrines are physically inside the maze. Thread unsealed, each interior shrine warns with a seal-first line on approach but still answers — warn, never block (R4). The thread renders on the floor after sealing — following it is the nav aid.
- **Shrines:** `s4-th` [seal] "Before anything runs: write the result that makes you stop or pivot. Seal it…" (timestamped, two-step confirm) · `s4-l1` (prose) "What behavior are you measuring…" · `s4-l2` (prose) "What does a costly yes look like…" · `s4-l3` [story] "Where did testers get lost…" · `s4-l4` [falsify] "If the test 'succeeds', what's the strongest boring explanation…" · `s4-l5` (prose) "What's the smallest step you can take today?"
- **Flagpoles (3):** thread sealed before testing · behavior metric defined · test run with real users.

### World 5 · Feedback — The Mirror
- **Visual identity:** still black lake in a hall of standing mirrors; the player's reflection walks with them. The Graveyard — iron fence, bare tree, plots — adjoins the lake shore. Bottom of the rollercoaster.
- **Layout:** the verdict mirror (`s5-th`) blocks the causeway; it shows the sealed `s4-th` text on its face and demands the verdict before any other World 5 shrine wakes. After the verdict, the mirror hall opens; the Graveyard gate stands to the side; the decision lectern (`s5-dec`) sits before the Act II Gate. The Reality Check toll portal (5→1) shimmers by the shore. The verdict invites the Council (03) — the temple spur path lights up here.
- **Shrines:** `s5-th` [verdict] "Open the seal. Did Ariadne's Thread trigger — yes or no?…" (sealed text shown first) · `s5-l1` (prose) "What uncomfortable truths is the mirror showing me?" · `s5-l2` (prose) "Am I listening to the market, or protecting my own ego?" · `s5-l3` (prose) "What is the gap between my intention and their perception?" · `s5-l4` (prose) "Take the most inconvenient entry in your ledger and argue its case…" · `s5-l5` [registry] "Which Stage-1 belief is now dead? Hold the funeral…" · `s5-dec` [decision] "Pivot, or persevere? Cite the evidence that decides it." (locked until ≥1 citation)
- **Flagpoles (3):** verdict recorded · one funeral held · decision cited to evidence.
- **Act II Gate — The Mirror's Verdict** at the exit.

### World 6 · Refinement — The Sculptor
- **Visual identity:** white marble quarry and open-air atelier; half-carved statues; chisel-dust light. The climb back up begins.
- **Layout:** atelier floor with three working shrines; behind a rough-cut doorway, **The Unseen** — an unlit annex where four shadowed figures stand outside the light, one per ethics shrine.
- **Shrines:** `s6-th` (prose) "What do users actually do with it, versus what you built it for?…" · `s6-l1` [number] "What one action must a new user complete to feel the value?…" · `s6-l2` (prose) "If you fix one thing this week…" · The Unseen: `s6-u1` [names] "Who is affected but not in the room?…" · `s6-u2` (prose) "How would a bad actor use this exactly as designed?…" · `s6-u3` (prose) "What behavior does your revenue model reward at scale?…" · `s6-u4` (prose) "Whose data do you touch…"
- **Flagpoles (3):** cuts from observed use · time-to-value counted · one guardrail named.

### World 7 · Implementation — The Bridge
- **Visual identity:** rope-and-plank bridge across a chasm in morning light; each shrine is a plank station. One plank is visibly different — the SPOF plank (`s7-l2`), cracked and creaking.
- **Layout:** shrines in file across the span; the Re-Build toll portal (7→3) hangs at mid-span; the Act III Gate is the far-bank arch.
- **Shrines:** `s7-th` [number] "Walk one customer across the bridge — one month, real figures…" (+ quick-add guardian for every unknown number) · `s7-l1` (prose) "Has anyone paid, pre-paid, or given up something costly…" · `s7-l2` (prose) "Which single plank… drops the whole bridge if it snaps?…" · `s7-l3` [names] "Who is crossing with you…" · `s7-l4` [list] "If revenue halves for two quarters, what goes first, second, third?…" · `s7-l5` [list] "What are you deliberately not doing?…"
- **Flagpoles (3):** unit walk-through written · SPOF + 30-day plan · three deliberate nots.
- **Act III Gate — The Far Bank** at the exit.

### World 8 · Launch — The Rocket
- **Visual identity:** dawn launch pad on the crest of the rollercoaster; the rocket's hull is blank plating that fills with the engraved story spine as beats are cast. Kenney/Quaternius space-kit register later; grey-box: cylinder + fins.
- **Layout:** the spine engraving shrine at the rocket's base; three shrines around the pad; the Reset toll portal (8→1) behind the assembly building; the final flagpole on the gantry. When the spine is cast and the player raises the last flag they choose to raise, the launch sequence plays — the rocket flies; the world does not end (loops remain; the Reset is the canonical continue).
- **Shrines:** `s8-th` [spine, evidence-locked] "The elixir is the story… 'Once there was [named customer]…'" (every beat cites evidence or renders **[unproven]**) · `s8-l1` [number] "One number tells you it is flying…" · `s8-l2` [story] "What did this journey disprove that you believed at the start?…" · `s8-l3` [joy — survives every rewrite] "How will I celebrate crossing the final threshold?" · `s8-l4` (prose) "Are you ready to let go and let it fly?"
- **Flagpoles (3):** spine cast from cited evidence · one honest number and target · wisdom for the next founder.

---

## 2 · The shrine trance, frame by frame

The trance is the question bank. One shrine = one 03 question. All question text and hints render from the strings module, byte-identical to 03; hints follow law 3 (typed-answer hint under each input).

| Frame | Time | What happens |
|---|---|---|
| F0 approach | — | Shrine idle: unanswered = faint glow; answered = inked/lit; sequence-locked = chained, with a one-line plain-language reason on approach. Prompt chip: "E — kneel". Shrines are Tab-focusable with a visible ring (§3). |
| F1 kneel | 0 ms | Player presses E/Enter. Input captured from the character controller; rapier simulation for the player body pauses; the world holds its breath (ambient particles slow). |
| F2 push-in | 0–600 ms | Camera dollies from follow-cam to a close over-shoulder framing of the shrine; vignette + depth fog close down the periphery. `prefers-reduced-motion`: no dolly — a 150 ms crossfade to the framed shot. |
| F3 panel rise | 600–800 ms | The writing panel rises: a DOM overlay (Tailwind + `QuestStyles`), not in-canvas text. Question text verbatim; answer-type hint beneath the input; keyboard focus lands in the first input automatically. No `<form>` tag — explicit key handling (textarea Enter = newline; Ctrl+Enter = inscribe; Esc = stand up, draft kept for the session in component state only). |
| F4 write | — | The typed input per answer-type (§2.1). Type-specific validation is structural, not word-count (law 7): fivewhys wants five rungs, decision wants a citation, seal wants the two-step. |
| F5 inscribe | commit | One "Inscribe" button. The commit is a single store transaction: the answer write plus all same-gesture side effects (guardian spawn, E2 evidence log, seal timestamp — §4). Store persists through the ladder immediately. |
| F6 consequence | +0–1500 ms | The world reacts only to what actually changed in the store: shrine flips to inked; a spawned guardian materializes on the world path at its weight-size; a logged E2+ coin drops into the HUD ledger with its metal; a seal sets with a stone thunk and the shrine becomes read-only. Derived metrics recompute (Truth, XP, riskiest guardian); the HUD moves only if they moved. |
| F7 release | +≤2000 ms | Camera pulls back (or crossfades under reduced motion); physics resumes; the prompt chip returns. Milestone flagpoles never auto-raise here — Action is self-reported only (§4). |

### 2.1 · Typed inputs — every answer-type tag in 03 gets a real control

| Tag | Control | Write on inscribe (exact 02 keys) |
|---|---|---|
| *(untagged)* | plain textarea | `answers[stageId][qid].text` |
| `story` | multiline textarea, story hint | `.text` |
| `names` | repeatable name rows (adds rows; `s1-l1` asks for three) | `.text` (newline-joined) |
| `fivewhys` | five chained inputs; each unlocks after the previous; fifth marked "root" | `.whys[]` (length 5) |
| `number` | numeric field + unit + context line | `.text` |
| `list` | add-row list builder | `.text` (newline-joined) |
| `quickadd` | textarea + inline "This only works if ___" row with dies/wobbles/shrugs picker | `.text`; each quickadd pushes `assumptions[]` `{ id, statement, originStageId, importance, status:'untested', killCriterion:'', createdAt }` |
| `falsify` | textarea framed by the falsification hint | `.text` |
| `verbatim` | quote cards (quote + who said it), each with a "Log a quote as E2" button | `.text`; each logged quote pushes `evidence[]` `{ id, tier:2, text, source, linkedAssumptionIds[], stageId, date }` (optional guardian-link picker) |
| `vault` | read-only cards of `vault[]` entries; pick one, then write | `.text`; reads `vault[]`, never mutates it |
| `ifthen` | structured IF / THEN / WITHIN-days fields + "Register the IF as a guardian" button | `.ifPart`, `.thenPart`, `.withinDays`; button pushes `assumptions[]` as in quickadd |
| `seal` | textarea → "Seal it" → second confirm ("A seal does not reopen") → locked | `.text`, `.sealedAt` (timestamp); input read-only forever after |
| `verdict` | sealed `answers.s4['s4-th'].text` displayed read-only first; then a yes/no verdict pair; interpretation text unlocks after | `.verdict`, then `.text` |
| `registry` | embedded Assumption Registry filtered to `originStageId:'s1'`; pick a belief → funeral rite (§4) | updates that `assumptions[]` entry: `status:'invalidated'`, `resolvedAt` |
| `decision` | pivot / persevere pair + evidence citation picker over `evidence[]`; Inscribe locked until ≥1 citation | `.decision`, `.citedEvidenceIds[]` |
| `spine` | five beat fields (Once there was / Every day / Until one day / Because of that / Until finally), each with its own citation picker; an uncited beat renders an **[unproven]** badge in the panel, on the rocket hull, and in exports | `.text` (beats), `.citedEvidenceIds[]` — per-beat mapping is OPEN QUESTION 3 |
| `joy` | single warm line, celebratory chrome (confetti honors reduced motion) | `.text` |

Drafts live in React component state for the current trance only — abandoning a shrine keeps nothing persistent. The store is the only persistence.

---

## 3 · Controls and camera

### Keyboard (full-play requirement: the entire game — every shrine, gate, portal, funeral, flagpole, temple visit, and export — completes with keyboard alone)

| Input | Action |
|---|---|
| WASD / arrows | move |
| Shift | walk (precision) |
| Q / E-hold or ←→ + Alt | camera yaw orbit |
| E / Enter | interact (kneel, raise flag, open door, pay toll, touch totem) |
| Tab / Shift+Tab | cycle nearby interactables; selected one gets a 3D focus ring and a name chip |
| Esc | stand up / close panel / pause menu |
| J | journal (read view of `answers`, `fieldNotes`, `evidence`, exports) |
| M | map (rollercoaster path, gate marks, portal and graveyard locations) |
| G | Assumption Registry (guardians list, riskiest first) |
| L | Evidence Ledger |
| Ctrl+Enter | inscribe (inside a trance) |

No action is mouse-only; the mouse adds pointer-orbit and click-to-interact as conveniences. Gamepad is a nice-to-have, not scoped.

**Visible focus:** every DOM control uses a 2px high-contrast `focus-visible` ring from `QuestStyles`; no `outline: none` without a replacement. 3D interactables show a ground ring + name chip when Tab-selected — the same affordance the walk-up prompt uses, so keyboard and walk-up players read one language.

### Camera
- Third-person follow: 6 m behind, 2 m up, ~50° FOV, slight downward pitch; collision-aware (raycast pull-in so geometry never occludes the player).
- Trance: 600 ms dolly to over-shoulder shrine framing (frame F2); pull-back on release.
- No Z-targeting needed; no free-look on foot beyond yaw orbit.
- **Reduced motion (`prefers-reduced-motion`, honored via the existing `QuestStyles` reduced-motion layer):** camera dollies become crossfade cuts; no screen shake anywhere; particle systems drop to static sprites or off; weather renders as sky tint + audio instead of particle sheets; portal transit is a fade; confetti becomes a still burst; the Shadow appears without approach animation.
- Mobile: no 3D camera, no 3D traversal — the only mobile rule this document owns (R2). Everything Field defers to A-101 by name (`docs/build/a101-field-mode-spec.md`): hunt list, slot lifecycle, Field Day, beam, PWA/A2HS. One build, same storage ladder, Council available per A-101; plus read-only journal review.

---

## 4 · Mechanics → data-model writes (02 keys exactly; no parallel state)

| Mechanic | In-world form | Trigger | Exact write |
|---|---|---|---|
| Shrine answers | kneel + trance | inscribe | `answers[stageId][qid]` fields per §2.1 (`stageId` = `s1`…`s8`, matching 03 qid prefixes — OPEN QUESTION 4 confirms constants against v3 source) |
| Guardians (Assumption Registry) | mini-boss figures standing on the world path near their origin stage; size by importance (dies=3 large / wobbles=2 / shrugs=1 small); metal aura by derived tier | quickadd, ifthen-register, Obituary killers, registry edits | push/update `assumptions[]` `{ id, statement, originStageId, importance, status, killCriterion, createdAt, resolvedAt }`. Tier is **derived** via `tierOf(a)` = max linked evidence tier — never stored, never self-declared (decision log 2026-07-05) |
| Riskiest guardian | crowned, larger idle animation, first in G-menu | derived | computed: max `weight × (4 − tier)` among `status:'untested'|'testing'`; weights dies=3/wobbles=2/shrugs=1. No write |
| Evidence tiers as currency metals | ledger coins: E0 Whisper (mist) · E1 Rumor (tin) · E2 Word (silver) · E3 Deed (steel) · E4 Gold. Tier codes E0–E4 never translate | verbatim shortcut, ledger entry UI at campfires | push `evidence[]` `{ id, tier:0-4, text, source, linkedAssumptionIds[], stageId, date }`. Only E2+ moves Truth |
| Truth (HUD, leads) | left/top meter, metal fill | derived | Σ weight(resolved with tier≥2) / Σ weight; `null` (unlit meter) when no assumptions. No write |
| Action (HUD, follows) | right/lower meter, flag fill | derived from `milestones` | no write beyond flagpoles |
| Milestone flagpoles | one pole per 03 milestone, at its world; player walks up and raises it — a self-report, never auto-granted | E at pole; lower again anytime | `milestones[id] = true|false` (Action only; never touches Truth) — id constants OPEN QUESTION 4 |
| The Shadow | dark twin appearing on the path behind the player when Action runs far ahead of Truth; speaks only the founder's own words — quotes drawn locally from `answers` / `evidence` text tied to the riskiest guardian's origin stage; zero network | derived divergence check (threshold OPEN QUESTION 1), suppressed in trough | **no write.** Every appearance pairs with exactly one low-friction next action (deep-link: kneel at the riskiest guardian's kill-criterion, or log one E2). Dismissable; never blocks |
| Funerals | Graveyard rite: chosen guardian walks to a plot, headstone raises with its `statement` as epitaph and the disproving evidence beneath; 1.5× XP toast only when derived tier≥2 — below that the rite plays, the headstone stands, and the toast claims no XP (an unproven funeral) | registry invalidation (`s5-l5` or G-menu) | update `assumptions[]` entry: `status:'invalidated'`, `resolvedAt`. XP derived per 02: +15 if tier≥2 (vs +10 validated — the 1.5×); tier<2 yields no XP and the toast says so; headstones render from `assumptions` where `status:'invalidated'` |
| Act Gates | free-standing doors after W2/W5/W7; walking through when 03 criteria are met = pass; unmet = the door speaks a warning and asks for a written reason to proceed. Passed doors turn bright on the map; overridden doors bear a visible scar and the reason on inspection. Appears in exports | walk-through | `gates.act1|act2|act3 = { status:'passed'|'overridden', reason?, date }` + push `trail[]` `{ type:'gate-pass'|'gate-override', name, date }` |
| The Vault | chained chest in W1, altar-open in W3 | solution-word nudge / capture anywhere; opens on first W3 entry | push `vault[]` `{ id, text, date }`; `vaultUnlocked = true` on first Stage 3 entry |
| Ariadne's Thread | seal stone at the Labyrinth mouth; red floor-thread renders after sealing | `s4-th` two-step seal | `answers.s4['s4-th'] = { text, sealedAt }`; W4 interior seal-first warn keys off `sealedAt` absence — warn, never block (R4) |
| The Mirror's verdict | verdict mirror blocking the W5 causeway; shows sealed text first | `s5-th` | `.verdict`, then `.text`; W5 shrine lock keys off `verdict` presence; verdict invites the Council (temple spur lights) |
| Loops (toll portals) | Reality Check portal W5→W1 · Re-Build W7→W3 · Reset W8→W1; the toll is one learning line typed at the portal; The Reset also demands the cycle retro + the undefended Critique the Quest before transit | pay toll, walk through | push `trail[]` `{ type:'loop', name, fromId, toId, learning, date }` (+ `critique` on The Reset); set `lastLoop` |
| Weather totem | carved totem at every campfire; five faces; one tap a day, founder-owned | E at totem | push `weather[]` `{ id, date, value:1-5 }` (same-day retap: OPEN QUESTION 5). Drives the literal sky; trough per 02 |
| Side quests | notice board at campfires; lanterns light in the trough; The 404 · The Obituary (killers → `assumptions[]` pushes) · The Fan Letter (ledger-constrained) · The Swap | accept / complete | `sideQuests[id] = { text, startedAt, completedAt }`; +5 XP each on completion (derived) |
| Field notes | lectern at each campfire | write | `fieldNotes[stageId]` |
| The Council | three-sage temple (Mirror, Shadow, Cartographer — 04) on the hill; **live transport module**: browser → `api.anthropic.com` direct, BYOK, `claude-fable-5` pinned in client code, CORS opt-in header, `max_tokens: 1000` (02 call contract). Antechamber: key entry with visible remove control (key under its own storage key) → consent screen (04 copy verbatim) before first convening → live-record or pasted-journal lectern → thin-ink guard (<3 answers + empty ledger → 04's "needs more ink" string) → **walk-as-loading**: the nave corridor is walked while the request is in flight; sages speak when it lands; 04's canonical error/key-failure strings on failure; third failure state (integrator ruling R5): model-access failure → canonical offer string (pending the Phase 0 canon diff) → one-tap accept of `claude-sonnet-4-6`, acceptance persists → reading rendered → commitment gate (04 copy) before the follow-up box unlocks. Every saved reading records and displays its model | convene | `councilConsent = true` (once); push `council[]` `{ id, date, reading, commitment?, followups:[{q,a}], journal /*snapshot — mode pending operator ruling, see Phase 0 report (recommendation: compact, the journal as sent)*/, source:'live'|'pasted' }` + `model` recorded and displayed on every saved reading (schema key: OPEN QUESTION 2). Standing caption from 04 on every reading |
| Exports | journal desk at campfires; plain browser downloads | download | reads only — `buildJournalMd(data, mode)` single serializer; `dinnerSession`/`dinnerLog` structurally excluded; Brief leads with `dinnerCard.text` when present (02); player key never serialized |
| Dinner Card | minimal in-app editor — the founder's OWN card (R3); Brief leads with its text when present (02) | edit | `dinnerCard = { text, updatedAt }` |
| Family Dinner (`dinnerSession`, `dinnerLog`) | **nothing.** Confidential keys exist in `EMPTY_DATA` only | — | no UI, no world object, never serialized — both serializer modes tested (R3) |

**Whiplash ritual** (05 shipped list: "whiplash ritual in the Ledger"; PIE mentor-whiplash lineage per 01) — IN SCOPE, SOURCE NEEDED: the v3 upgrade doc holding its spec is not in this repo; requested in the Phase 0 report. Not built until the source arrives; explicitly not descoped.

Consent boundary (01, CLAUDE.md): the only network call in the entire game is the Council's BYOK call, behind key entry + stored consent. Everything else — Shadow, metrics, weather, exports — is local. Nothing exists that could log a body or a key.

---

## 5 · CC0 asset shortlist (glTF; grey-box placeholders first)

Grey-box ships first: `drei` primitives + Kenney Prototype Textures grid materials; every mechanic must read clearly with zero packs installed. Packs below are candidates — **verify CC0 license and glTF availability per pack at import time**; no pack is a dependency of any mechanic. License marks: KayKit rows are **VERIFY-ONLINE** — license unconfirmed from training; at minimum the Medieval Hexagon Pack and Halloween Bits must be checked at the source before import. Kenney and Quaternius rows: training-confirmed CC0; re-verify at import.

| Need | Candidate packs |
|---|---|
| Player + Shadow (same rig, dark material swap) | KayKit Character Pack: Adventurers (VERIFY-ONLINE) (Quaternius Ultimate Modular Men as fallback) |
| Guardians (3 sizes, metal-tint auras) | KayKit Skeletons Character Pack (VERIFY-ONLINE) · Quaternius Animated Monsters |
| Shrines, gates, temple, dungeon chrome | KayKit Dungeon Pack Remastered (VERIFY-ONLINE) · Kenney Castle Kit |
| Graveyard (headstones, fence, bare tree) | Kenney Graveyard Kit · KayKit Halloween Bits (VERIFY-ONLINE) |
| Terrain, rocks, trees (W1–W7) | Kenney Nature Kit · Quaternius Ultimate Stylized Nature · KayKit Medieval Hexagon Pack (world tiles) (VERIFY-ONLINE) |
| The Bridge (planks, ropes, chasm props) | Kenney Nature Kit ropes/planks · KayKit Medieval Hexagon bridge pieces (VERIFY-ONLINE) |
| The Rocket + launch pad | Kenney Space Kit · Quaternius Ultimate Space Kit |
| Vault chest, lecterns, boards, furniture | KayKit Furniture Bits (VERIFY-ONLINE) · Kenney props |
| Grey-box materials, particles, UI | Kenney Prototype Textures · Kenney Particle Pack · Kenney UI Pack (icons stay lucide) |

Pipeline: glTF → `gltf-transform` optimize (draco/meshopt + KTX2 when packs land) → `drei` `useGLTF`. Attribution page in-game even for CC0 — courtesy, and the PIE CC BY 4.0 line (01) lives there too.

---

## 6 · Why this is not chocolate-covered broccoli

Chocolate-covered broccoli bolts a reward loop *beside* the work and pays out regardless of it. Here the reward loop and the work are one state machine; strip either and nothing remains of the other.

- **The answer types are the game verbs.** There is no jump-collect-fight loop that advances anything. The only verbs that change the world are inscribe, cite, seal, log, bury, override, pay the toll, raise the flag — and each is a real write to `answers`, `evidence`, `assumptions`, `gates`, `trail`. A player who "just wants to play" does the validation work, because playing *is* writing the journal. There is no second track.
- **Consequences are irreversible where the method demands it.** `sealedAt` never reopens — the Thread is sealed before results exist (01). A funeral sets `resolvedAt` and the headstone stands. A gate override is logged to `trail` and surfaces in every export. `s5-dec` will not take a decision without a citation. The game cannot be save-scummed because the game *is* the record.
- **The honest currency cannot be farmed.** Truth moves only on E2+ evidence linked to guardians, and tiers are derived, never declared. Flagpoles — the fun, Mario-register currency — are self-reported and touch only Action. The game visibly refuses to let its cheap currency buy its expensive one; the gap between them literally walks up behind you and quotes your own journal.
- **Disconfirmation pays best.** The single most rewarded act (1.5× XP, a rite, a monument) is proving yourself wrong — the exact behavior a founder in love avoids and the method requires (law 8).
- **The chrome never replaces the ask.** Questions render in plain language, verbatim from 03 (law 6). Myth is the shrine's stone, never the sentence you answer.
- **The human-contact test holds.** No NPC simulates a customer. The verbatim shrine demands words from five real people; the Council reads only what the founder brought back from real contact and says so (04's standing caption).
- Remove the 3D world and every write still makes sense — it is the same v3 data model. Remove the writes and the world is an empty diorama with locked doors. The work is the only way to move.

---

## 7 · Audio plan (CC0)

CC0 only; no CC-BY tracks. Sources: Kenney audio packs (Interface Sounds, Impact Sounds, RPG Audio, Music Jingles) as the base kit; ambience gaps filled from CC0-filtered OpenGameArt/freesound with per-file license verification at import — no specific third-party track is named here until verified. Audio is reinforcement only: every cue has a visual twin; the game is fully playable muted.

| Event | Cue |
|---|---|
| Trance enter/exit | low airy pad in, resolve chord out |
| Inscribe | quill scratch + soft chime |
| Evidence logged | coin drop, pitch by metal (Whisper breath → Gold ring) |
| Guardian spawns | short low drum, weight-scaled |
| Seal (`sealedAt`) | heavy stone thunk + latch — deliberately final |
| Funeral | single bell, soil, distant wind; 1.5× XP shimmer after |
| Gate pass / override | door swing / creak + quill scratch (the reason being written) |
| Toll portal | coin toll + transit whoosh (fade-only under reduced motion) |
| Flagpole | rope run + fabric snap + short jingle (Music Jingles) |
| Shadow appears | near-silent low drone; silent by definition in the trough |
| Council | three-voice pad in the nave; page-turn when the reading lands |
| Weather | literal: rain/storm/wind beds per `weather` value, storm thunder gated by reduced-motion setting |
| Joy answers | warm bell burst |

Per-world ambient beds (nebula hum, rookery, forge, maze wind, still water, chisel taps, rope creak, pad wind). Mix: master/music/SFX sliders + mute in pause menu; settings persist under their own storage key via the `makeStore` ladder, following the BYOK key precedent — never inside `founders-quest:v3` (OPEN QUESTION 6 for 02 wording). Implementation: three.js `AudioListener`/`PositionalAudio` from R3F; no external audio service; no audio on the mobile Field Mode capture path (A-101).

---

## 8 · Performance notes (60 fps grey-box target)

Target: 60 fps at 1080p on mid-range integrated GPU (baseline: 2020 laptop iGPU), grey-box scenes.

- **Scene budget:** only the active world + shared furniture mounted (per-world `React.lazy` code-split); ≤150 draw calls, ≤100k triangles grey-box; `InstancedMesh` for repeated props (shrine bodies, headstones, flag hardware, maze wall modules).
- **Lights:** one directional + one hemisphere. No runtime shadow maps in grey-box (blob shadows); at most a single 1024 cascade when assets land. No postprocessing in grey-box; weather via sky color, fog, and pooled particles.
- **DPR and adaptation:** clamp DPR 1–1.5; drei `AdaptiveDpr` + `PerformanceMonitor` to degrade particles → shadows → DPR in that order. `frameloop="demand"` in trance (world paused, DOM panel active) — the biggest single win, since writing is most of a session.
- **Physics:** rapier fixed step 1/60; static trimesh/cuboid colliders for the world, one kinematic capsule for the player; guardians are static sensors, not dynamic bodies; collider set swapped per world; simulation paused during trance and in DOM panels.
- **React discipline:** mutate in `useFrame`, never `setState` per frame; Zustand transient subscriptions for HUD meters; HUD/panels are DOM outside the canvas (no per-frame canvas text); derived metrics (Truth, XP, riskiest, trough) memoized on store version, not polled.
- **Assets (later):** draco/meshopt + KTX2 via `gltf-transform`; per-world `useGLTF.preload` on gate approach; texture atlas per pack.
- **Storage:** ladder writes debounced (~500 ms) and on `visibilitychange`; `buildJournalMd` runs on demand only (export, Council), never per frame.
- **Measurement:** `r3f-perf` in dev builds only — stripped from production; no telemetry of any kind (CLAUDE.md).

---

## 9 · OPEN QUESTIONS (embedded; canon and brief silent — need operator ruling, not invention)

1. **Shadow divergence threshold.** **RULED (R-F, 2026-07-08):** starting values — summon when Action − Truth ≥ 40 percentage points with ≥3 registered assumptions, never in the trough. Code tunable constants only; no numbers enter canon. Revisited after the operator plays the Gate 2 slice.
2. **Council model label key.** **RESOLVED:** `council[].model` is canon (Phase 0 diff item 5, applied `530cfb0`).
3. **Spine per-beat citations.** OPEN — needed by Phase 3. `s8-th` renders **[unproven]** per beat, but 02 stores one flat `citedEvidenceIds[]` per answer with no beat→evidence mapping. Needs either a ruled convention within existing keys or a 02 amendment (e.g. array-of-arrays for spine answers only).
4. **Id constants from v3 source.** **RULED (R-K, 2026-07-08):** this greenfield build defines the milestone/side-quest/stage id constants. The operator is uploading `founders-quest-v3.jsx` + the v3 upgrade doc to `docs/reference/` when convenient — ids cross-checked against them on arrival; the whiplash ritual stays source-blocked until then.
5. **Weather same-day retap.** OPEN — needed by Phase 3. 03: "one tap, once a day." Does a second tap on the same date replace that date's entry, or is the totem inert until tomorrow? Canon silent.
6. **Settings storage wording in 02.** Pattern proceeds in code (own storage key via the `makeStore` ladder, following the BYOK key precedent); the 02 wording sentence is QUEUED for the next canon commit alongside the i18n-queue coherence rider (operator's approve-the-posted-text rule).
7. **Council snapshot mode.** **RESOLVED (R-C, 2026-07-08):** snapshot = the compact journal exactly as sent; clarifying line applied to 02 in `530cfb0`.
