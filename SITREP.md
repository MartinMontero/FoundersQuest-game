# SITREP — Backlog Build-Out + Design Elevation (2026-07-13)

**Play it here:** https://claude-dev-environment-setup.founders-quest-game.pages.dev
(hash-verified against this exact build; the OLD unsuffixed founders-quest-game.pages.dev
link still serves an ancient build — don't use it, and I can't delete it from here.)

## The short version

The entire recorded backlog is now either BUILT or PARKED with a written reason you can
act on — nothing was quietly dropped. The big adds since your last report: **Field Mode**
(the phone-in-the-field side of the game: hunt list, courage lantern, field days, and a
"beam" that moves your field records to your desk by QR code, file, or paste), **the
Council temple** (where a player enters their own Anthropic key — live readings stay dark
until you resolve B-4; no Council text was invented), **sound** (synthesized on-device,
silent until the player opts in at the campfire), **offline + install** (the game now
works with the network gone and can be added to a phone's home screen), and the **design
elevation**: every world has its own landmark and ground palette, the world reacts to
dramatic beats, the Chart got per-world progress pips, the Raven is physically perched by
the first shrine during the tutorial, and there's an in-game credits page.

## Exit discipline (met)

Two consecutive fully-clean verification runs on the same commit: clean build, lint,
typecheck, 445/445 unit tests, all 35 end-to-end flows serially, secret scan over the
full history, dependency scan, and the offline-install smoke — every gate exit-code 0,
zero flaky retries, both runs. The run BEFORE the pair failed honestly and taught us
something (below) — that's the discipline working, not a blemish.

## Three catches worth your eyes (all fixed)

1. **The tutorial taught the law wrong.** The induction and the Legend said "only Deed
   and Gold move the Truth bar." The constitution — and the shipped math — say Word
   counts too (something a customer SAID TO YOU, verbatim). The copy now teaches what
   the code enforces. Worth a glance in your playthrough: the tiers beat and the Legend's
   Truth entry.
2. **The tutorial could ambush later worlds.** In states only test-seeding can construct
   (a wiped record standing in World 2+), the "Before you begin" card offered itself and
   swallowed keyboard input. It's now hard-gated to World 1. Real players were never
   affected, but it was wrong on paper.
3. **Import receipts could lie.** A field-records import from a FILE was being recorded
   in the audit trail as a PASTE. The trail now names the true transport. Small, but the
   audit trail is a privacy surface — it should never guess.

## Your QA route for the new layer (~20 min on top of the usual)

1. Fresh profile → notice the Raven perched by the first shrine during the intro (it
   flies ahead when you finish — find its rookery in World 2). The camera now drifts
   slowly during the intro; tell me if it reads cinematic or annoying.
2. Open the Chart (M) — watch the parchment unroll; check the per-world pips against
   what you've actually done. Open the Legend (L) → Truth → "more" → "even deeper".
3. Press F → Field Mode. Add a profile, log two attempts, resolve one with a quote,
   close the day. Then "Show as QR" — scan it with your PHONE's camera app if it has one
   (this is the one path I cannot test headless: no camera in the container). File and
   paste import are machine-tested.
4. At the campfire: sound sliders (it ships SILENT by design — raise master), the
   "This device" card (try installing on your phone; also untestable headless), and
   Credits from the export desk.
5. World 5: walk to the mirror lake — on your real GPU you should see actual
   reflections (untestable in the container; if it tanks your framerate, say so —
   there's a cheap fallback ready).
6. The Council temple (C): consent room reads first, key room takes a key you can
   visibly remove. Live readings are dark on purpose (B-4 needs your text or your
   approval of a draft).

## Honest nits and UNTESTED items

- Camera QR scanning uses the browser's built-in detector where it exists (Chrome
  desktop/Android — not Firefox); file + paste work everywhere. Camera loop untested in
  CI (no camera exists there); the frame-assembly logic under it is unit-tested.
- The install prompt and the W5 reflection: untestable headless, need your one glance.
- Set-piece feel shots still catch some landmarks at frame edge — capture artifact, they
  read fine in-world.
- Voice capture (F-12) is PARKED, not built: the browser's speech API ships your voice
  to Google/Apple servers — an unsanctioned service outside the consent architecture.
  Typed capture stays primary. It's K-14 in BLOCKERS if you want to revisit.

## Security posture (verified again this run)

BYOK unchanged: each player brings their own key, entered at runtime, stored device-side
under its own storage key, never serialized, never exported; browser talks to Anthropic
directly — no server exists anywhere in the product. NEW this run and worth knowing: the
offline layer (service worker) was built so it CANNOT touch the Council path — it never
intercepts non-GET or cross-origin requests, and a tripwire test fails the build if the
worker's code so much as names the API host. Imports (QR/file/paste) all pass the same
strict validation — a scanned code can't smuggle anything a paste couldn't. Secret scan
clean over all history; dependency scan clean; no telemetry, nothing phones home, ever.

## The numbers

445 unit tests · 35 e2e flows (serial, real browser) · 2 consecutive fully-clean full
runs · 6 feel packs archived (a3/a4/a5/worlds/e9/e10) · 14 parks in BLOCKERS, each with
a reason you can act on · 0 new runtime dependencies (one vendored MIT file, checksummed,
license-verified against the registry) · deploy hash-verified at the alias above.

---

# SITREP — Mind & Myth: the full inner game (2026-07-11)

Plain-English status for your one consolidated playthrough. Everything below was
built since the spine report (which still stands — it's the second half of this
file, and its route is still the right warm-up lap).

**Live (desktop-first):** https://claude-dev-environment-setup-sp4q.founders-quest-game.pages.dev

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
- e2e: **34 tests (31 live + 3 screenshot-pack, ~12 minutes serial)** — full
  induction, skip path, hunch lifecycle, both confrontation endings,
  skip→ghost→lay-to-rest, trough queueing, the five-phase Ego fight, and
  reload-persistence checks. Two consecutive fully-clean runs closed each phase.
- Feel packs archived per phase: docs/feel-packs/a3 · a4 · a5.

---

# SITREP — Founder's Quest, the 8-world spine (2026-07-10)

Plain-English status for your human-QA playthrough. What's playable, what's
deliberately not there yet, and the security posture — so you can judge it fairly
and hand me a punch-list.

**Live (desktop-first):** https://claude-dev-environment-setup-sp4q.founders-quest-game.pages.dev

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
