# SITREP — Mind & Myth: the full inner game (2026-07-11)

Plain-English status for your one consolidated playthrough. Everything below was
built since the spine report (which still stands — it's the second half of this
file, and its route is still the right warm-up lap).

**Live (desktop-first):** https://claude-dev-environment-setup.founders-quest-game.pages.dev

---

## The short version

The game now has its inner life. Since the spine report, four whole systems landed:

1. **First Light** — a real opening. A new player is invited (never forced) into an
   11-beat induction that produces *real* artifacts: their first captured idea, their
   first assumption with a sealed kill criterion, their first verbatim quote, and
   their first honest kill — then hands over the **Cartographer's Chart (M)** and
   **Legend (L)**. Skipping is one click, costs nothing, and a one-time prompt at the
   first shrine offers the way back in.
2. **The Earned Hunch** — your gut gets a ledger. Capture hunches with zero
   justification, optionally tag where they came from, and watch a private
   calibration record score your instincts *only* when real evidence settles them.
   Hunches never move Truth. Ever. That's tested, not promised.
3. **The Proving Circle (World 1)** — beliefs become someone you argue with. Cite
   only evidence you actually hold; hunches visibly bounce; the sealed kill
   criterion is a golden thread — record the real-world verdict and the finishing
   strike waits for you forever (it never expires, even across a reload). Both
   endings are wins: a dead belief gets a **funeral rite** (eulogy in the world's
   own words, a line for the stone, a tombstone); a proven one becomes a pillar.
   Skip the funeral and a ghost lingers — narrative only, no points lost — until
   you lay it to rest.
4. **The Ego (World 8)** — the final boss, and it's made of *you*. Its walls are
   the gate overrides you logged (it quotes your reasons back). Its summons are
   the funerals you skipped. Its strength is everything you left untested. It
   argues in five escalating registers — denial, rationalization, projection,
   sunk cost, identity fusion — and the last phase cannot be won by damage at
   all. You end it by writing one line: you are not your idea. That line goes in
   your Wisdom Codex, and you keep a permanent reward (a live "Distance" readout
   showing how far Action has outrun Truth).

One invariant outranks every formula, and it's enforced by a 200-state generated
test: **testing honestly can never make the boss harder.** Capture a belief and
resolve it with real evidence and you are never worse off than if you'd hidden it.

## Your QA route for the new layer

1. **Fresh start** (clear site data or a private window): name your founder, take
   the invitation, play all 11 beats. Then — separately — skip it once on another
   fresh run and check the skip feels respectful.
2. **World 1:** open the Registry, capture a hunch, tag it *Earned*, send it to
   the test bench. Then find the **Proving Circle** (east side) and fight the
   belief: strike (Space) to break its poise, or just wait — the window opens by
   itself (that's a rule, not a bug: skill accelerates, never gates). Cite a
   hunch to see the bounce. Record the verdict, strike the thread, hold the
   funeral. Then do it again on another belief and *skip* the funeral — watch
   the ghost and the HUD ember.
3. **World 8:** walk to the dark monolith at the far end. If your weather is
   low, it will tell you "not tonight" — that's the cadence law working. Face it
   when the skies clear. Check that its walls quote *your* override reasons.
4. **Anywhere:** log three low weather readings at the campfire and confirm the
   funeral ember and the Ego both hold fire until the skies lift.

## Honest nits (so you don't file them as bugs)

- The Proving Circle's stagger is press-Space-N-times, not timing-skill — the
  action layer is deliberately light in this slice.
- The arena set-piece feel-pack shot catches the circle at frame edge; in-game
  it reads fine when you walk to it.
- Chart labels still crowd at W7/W8 (known since A3). Per-world Truth/Action
  pips on the Chart are deferred. Per-stage funeral "buffs" from the research
  are deferred to the art pass.
- Ego fight progress is session-only *by design* (nothing in the save schema
  stores it): walk away and it re-forms. Your deliberate acts (returned tests,
  the integration line) do persist.

## Security posture (unchanged, re-verified)

- **Zero network in all of it.** The opening, hunches, combat, funerals, and the
  Ego are pre-written and local — no API call exists in any of these paths, and
  every e2e run asserts zero requests to api.anthropic.com. Your journal text,
  your key, your record: still device-only, still consent-gated for the one
  future feature (Council) that will ever send anything.
- **Key scan clean** (gitleaks) on every close. One honest note: the dependency
  vulnerability scanner (osv.dev) was unreachable from the build environment on
  the A4/A5 closes — but these phases added **zero** new dependencies, and the
  identical dependency tree scanned clean the same morning. Re-run on next
  network window.
- The Ego is derived fresh from your record each time — no profile of you is
  ever written anywhere ("egoRecord" deliberately has no storage key).

## The numbers

- Unit tests: **411** (was 334 at the spine report) — including the Ego's
  200-state invariant sweep, the bounce/finisher/funeral invariants, and the
  metrics-blindness proofs for hunches.
- e2e: **33 tests / 12-ish minutes serial** — full induction, skip path, hunch
  lifecycle, both confrontation endings, skip→ghost→lay-to-rest, trough
  queueing, the five-phase Ego fight, reload-persistence checks.
- Feel packs archived per phase: docs/feel-packs/a3 · a4 · a5.

---

# SITREP — Founder's Quest, the 8-world spine (2026-07-10)

Plain-English status for your human-QA playthrough. What's playable, what's
deliberately not there yet, and the security posture — so you can judge it fairly
and hand me a punch-list.

**Live (desktop-first):** https://claude-dev-environment-setup.founders-quest-game.pages.dev

---

## The short version

The whole journey is walkable and playable end to end. You can start in World 1,
travel all the way to World 8 and back, kneel at every shrine and answer it the
way that shrine is *meant* to be answered, cross the checkpoints, hold a funeral,
loop back when the evidence says so, and rest at the campfire to log the weather,
jot field notes, take side quests, edit your Dinner Card, and download your whole
journal. Every one of those actions writes into the one save file on your device —
nothing is faked, nothing is sent anywhere.

What's **not** there yet is the *art dressing*: each world has its own sky and
colour now, but not its own bespoke centrepiece (the fellowship circle, the forge,
the mirror causeway, the launch gantry). Those are a deliberate later pass, because
they're the kind of thing best shaped by your eyes, not guessed at blind. More on
that below so you don't report it as a bug.

---

## What to do on your playthrough (a route that hits everything)

1. **World 1 — the Problem.** Name your founder. Kneel at the shrines; try the
   Five-Whys well, the "name three real people" card, the strip-it-bare list. Drop
   a "solution word" (app, platform, AI…) into an answer and watch the Vault nudge
   appear. Raise a flag or two. There's now a **campfire** near your start — open it.
2. **Travel onward.** Walk to the glowing gate at the far edge, press **E**. Between
   Worlds 2→3, 5→6, and 7→8 you'll hit an **Act Gate** — a checkpoint. It tells you
   honestly whether you've met the bar; you can cross clean if you have, or cross
   anyway by writing a reason (it never *blocks* you — it just records the choice).
3. **World 3 — the Vault opens.** It was sealed until here. The "which captured
   idea attacks the root?" shrine now lets you pick from what you banked in World 1.
   Try the IF/THEN shrine and register the IF as a guardian in one tap.
4. **World 4 — seal the thread.** The "write the result that makes you stop or
   pivot" shrine is a two-step seal. Once sealed it locks — you can't edit it. Good.
5. **World 5 — the Mirror.** This is the densest. The other shrines here are
   **locked until you rule the verdict** (did your test trigger — yes or no?). Rule
   it, then: the **decision** shrine won't let you commit until you cite at least one
   piece of evidence; the **funeral** shrine lets you bury a World-1 belief (it's
   labelled "proven" or "unproven" depending on whether real evidence backs it).
   There's also a **loop portal** here — take it, write one line about what you
   learned, and it sends you back to World 1 to rethink.
6. **Worlds 6–7.** Refinement and the money walk-through. World 7 has its own loop
   back to World 3.
7. **World 8 — Launch.** The spine shrine: tell your customer's story in five beats.
   Any beat casts as **[unproven]** until you've cited evidence. There's a Reset
   loop back to World 1 — the journey continues.
8. **The campfire (every world).** Weather totem (tap a mood — every tap is kept),
   field notes for that world, the four side quests (accept, complete for +5 XP),
   **Download your journal** (a Markdown file, saved to your disk), and your
   **Dinner Card**.

Play it **keyboard-only** if you like — WASD/arrows to move, Tab to cycle what's
near, E to interact. It's built to be fully playable without a mouse, and it
honours "reduce motion" if your OS asks for it.

---

## What's solid (built and machine-verified)

Every item below is proven by an automated test that drives the *real* game and
reads the *real* save file — not just "it compiles."

- **Traverse all 8 worlds and back; the world you're in survives a reload.**
- **All nine shrine types** answer with their canon mechanism and write the exact
  save keys: verbatim quotes (+ "log as evidence"), the Vault pick, IF/THEN
  (+ guardian), the sealed thread, the verdict, the funeral, the citation-locked
  decision, the five-beat spine, and the joy beat.
- **The checkpoints:** the Vault unsealing at World 3, the Mirror's verdict-first
  lock, the decision's citation lock, and the three Act Gates (clean pass, or
  written override — both logged to your permanent trail).
- **Funerals** pay full honours (1.5× the XP of a "validated") *only* when real
  evidence stands behind them — an honest funeral vs. an "unproven" one.
- **The loops** demand a learning line before they send you back.
- **The campfire furniture:** weather (every tap kept), field notes, side quests
  (+5 XP on completion), the journal download, and the Dinner Card.
- **It holds together on weak hardware:** a failed 3D-model download degrades to a
  simple stand-in instead of crashing; a lost graphics context recovers.

**The numbers:** type-check clean · linter clean · **334 unit tests** · **22
end-to-end tests** (the full suite, run one-at-a-time). Zero console errors and
**zero network calls to Anthropic** on every route tested.

---

## What's deliberately NOT there yet (don't file these as bugs)

These are known, intentional gaps — the *art and celebration* layer that I held
back for your eyeball, plus a couple of small refinements:

1. **Per-world centrepieces.** Each world has a distinct sky, fog, and accent
   colour, so it reads as its own place. But the bespoke central set-pieces — the
   Raven's fellowship circle, the Phoenix forge, the Labyrinth maze, the Mirror
   causeway, the graveyard, the Bridge span, the launch gantry — are **not built**.
   They're a per-world art pass, and they're the thing that most benefits from your
   direction rather than my guess.
2. **The World-8 launch celebration.** The launch *mechanics* work (the spine casts,
   the final flags raise, the Reset loop stands). But there's no fireworks-moment
   visual yet — no rocket-engraving or lift-off sequence. Deferred with the art.
3. **The Reset loop's extras.** Every loop takes a learning line. The Reset (World
   8→1) is *supposed* to also ask for a cycle retro and an "undefended critique."
   That extra prompt isn't wired yet.
4. **Weather doesn't tint the sky.** You can log the weather; it just doesn't yet
   change the literal sky colour.
5. **World 1 gained a campfire.** When you last eyeballed World 1 it had no campfire;
   it does now (the rest hub lives in every world). Its existing shrines/Vault/
   Registry are untouched and still play exactly as before — but flag it if the
   campfire's placement bothers you.
6. **A 3.6 MB character model.** It loads fine on good connections and degrades
   gracefully on bad ones, but compressing it is a queued follow-up.

---

## Security & privacy — the part that matters most

The design principle is *data minimisation*, and the spine holds to it:

- **Everything lives on your device.** Every answer, guardian, piece of evidence,
  gate override, learning line, weather tap, field note, side quest, and Dinner
  Card is written to a single local save in your browser. Nothing is uploaded.
- **The spine makes zero network calls.** This isn't a hope — every automated test
  asserts that no request goes to Anthropic (or anywhere) while you play. The live
  "Council" feature (talking to an AI) is a *separate, later* phase, and even then
  it's **bring-your-own-key**: you'd paste your own Anthropic key, it stays on your
  device under its own storage slot, and it travels only from your browser straight
  to Anthropic — there is no server of ours in the middle that could ever see it.
- **No telemetry, none.** Nothing measures you. The only "analytics" is your own XP
  and Truth meter, computed locally from your own entries.
- **Export is a download, not an upload.** "Download your journal" writes a Markdown
  file to your disk. It leaves your device only if *you* then choose to share that
  file. The confidential "Family Dinner" session data is structurally excluded from
  every export by design.
- **Two canon rulings you made today are recorded** in the decision log: the launch
  spine's "unproven" warning stays whole-spine for now (no schema change), and the
  weather totem keeps every same-day tap.

The one honest caveat: because it's all local, **your record lives only in this
browser on this device.** Clearing site data wipes it. The journal download is your
backup. (A future sync is explicitly out of scope and would need its own consent.)

---

## What I need from your QA report

Play it as a first-time founder and tell me, in whatever form is easy:

- Anything that **felt wrong, confusing, or ugly** — copy that misreads, a control
  that fought you, a gate that nagged, a shrine whose point wasn't clear.
- Anything that **broke** (a crash, a stuck state, a thing that didn't save).
- Where the **worlds should differ more** — this directly feeds the set-piece art
  pass. "The forge should feel hot," "the Mirror should feel like glass" — that
  kind of steer is gold.
- The launch moment: what would make **World 8 feel like an arrival**.

I'll turn your punch-list straight into fixes and the next build cycle.
