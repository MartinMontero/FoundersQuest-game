# A-101 · Field Mode — specification

*Phase 0 rulings-pack document. Reviewed by the operator before any code exists. Canon order applies: 01-constitution outranks this file; this file proposes, canon disposes. All player-facing copy below is draft; canonical copy lands in `03-content-canon.md` in the same commit that ships it.*

**What Field Mode is:** the mobile capture surface. Real-world customer conversations become evidence at the moment they happen — two taps, zero justification (law 10), typed verbatim quotes becoming real E2 entries in the existing ledger. It exists to *increase* contact with real humans (the human-contact test); every mechanic below pushes the founder toward a live person and rewards the attempt, not just the win.

**What Field Mode is not:** a CRM (no field asks for or requires an individual's identity; name-shaped labels are warned against, never blocked — gate philosophy), a sync product (no sync endpoint exists — D-scope, structural), a parallel scoring system (no field XP; Truth moves only through the existing evidence → assumption → resolution path), or a Dinner surface (zero Dinner UI; `dinnerSession`/`dinnerLog` stay schema-only and never serialize; `dinnerCard` — the founder's own desktop-owned card — is absent from `buildJournalMd` and surfaces only as the Quest Brief lead, per 02 and ruling R3).

---

## 1 · Schema extension — four new top-level keys

All four keys live inside `founders-quest:v3` and default in via the existing migration rule `{ ...EMPTY_DATA, ...loaded }`. **No existing key changes shape, semantics, or serialization. `tierOf(a)`, Truth, XP, and the guardian-tier derivation are untouched** — evidence created by Field Mode is appended to the existing `evidence[]` array and participates exactly like any other entry.

```ts
type ISODate = string;    // full ISO timestamp
type DayStamp = string;   // 'YYYY-MM-DD', founder-local

huntList: {
  profiles: Array<{
    id: string;                  // 'hp-…', generated at creation
    label: string;               // a PROFILE, never a person: "solo bakery owner nearby"
    fromQid: 's1-l1';            // provenance is always s1-l1 — see §2
    createdAt: ISODate;
    retiredAt?: ISODate;         // retire, never delete, once any slot was attempted
  }>;
  slots: Array<{
    id: string;                  // 'hs-…'
    profileId: string;
    kind: 'cold' | 'warm-intro';       // warm-intro = Evolution spawn, see §4
    spawnedByAttemptId?: string;       // set on warm-intro slots (provenance)
    state: 'open' | 'attempted' | 'hollow' | 'filled';
    createdAt: ISODate;
    attemptedAt?: ISODate;
    resolvedAt?: ISODate;
    attemptId?: string;                // set at open → attempted
  }>;
}

fieldJournal: {
  attempts: Array<{
    id: string;                  // 'fa-…'
    slotId: string;
    channel: 'in-person' | 'call' | 'video' | 'live-chat';   // taxonomy, §5
    startedAt: ISODate;          // written at the attempt, BEFORE any outcome exists
    outcome?: 'quote' | 'declined' | 'no-show' | 'no-story';
    resolvedAt?: ISODate;
    evidenceIds: string[];       // ids of entries this attempt created in the EXISTING evidence[]
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';       // display only, §4 — never computed against
    evolution?: { spawnedSlotId: string; note?: string };    // note is non-identifying, §4
    fieldDayId?: string;
    origin: 'local' | 'import';
    importedAt?: ISODate;
    beamId?: string;
    beamedAt?: ISODate;          // local bookkeeping only — stripped from beam payloads (§8); re-beaming is always safe (dedupe, §8)
  }>;
  imports: Array<{               // beam-level audit log; append-only
    beamId: string;
    importedAt: ISODate;
    via: 'qr' | 'file' | 'paste';
    counts: { attempts: number; evidence: number; slots: number; profiles: number;
              fieldDays: number; skippedExistingIds: number; conflicts: number };
    evidenceIds: string[];       // ids actually WRITTEN by this import, skipped ids excluded (§8 rule 5);
                                 // the ledger renders the "imported" badge from this
  }>;
}

momentum: {
  value: number;                 // integer 0..7
  lastAttemptDate: DayStamp | null;
  lastTickDate: DayStamp | null; // last day the decay tick processed; idempotence anchor, §6
}

fieldDay: {
  current: {
    id: string; date: DayStamp; goalAttempts: number;
    attemptIds: string[]; startedAt: ISODate; endedAt?: ISODate; retro?: string;
  } | null;
  log: Array<{ id: string; date: DayStamp; goalAttempts: number;
               attemptCount: number; filled: number; hollow: number; retro?: string }>;
}
```

Design notes, binding:
- **Evidence provenance is derived, not stored on evidence records.** The `evidence[]` record shape from 02 is not modified. An evidence entry is "imported" iff its id appears in any `fieldJournal.imports[].evidenceIds`; the ledger renders the badge from that lookup. Attempts (new-key records) carry `origin` directly. This keeps "without touching existing keys" strict. (Alternative — optional `origin?/importedAt?/beamId?` fields on evidence records — is *not* proposed; if the operator prefers it, that is a separate additive change to an existing key requiring its own approval line in the 02 addendum.)
- `rarity` is stored for display stability only. Nothing computes from it; tiers are read from `evidence[]` as ever.
- **`momentum` is the single stored momentum source (R1).** Field attempts increment it, the §6 tick decays it, the trough freezes it; the desktop lantern in `game-design.md` is a pure renderer of `momentum.value` — no separate derived momentum mechanic exists.
- Field-created evidence entries use the existing shape exactly: `{ id, tier, text, source, linkedAssumptionIds[], stageId, date }`. `source` is the founder-chosen non-identifying label (§2); `stageId` defaults to the founder's current stage at capture, editable later.
- The player's API key is unaffected: its own storage key, never inside `founders-quest:v3`, never serialized, never in any beam payload.

---

## 2 · Hunt list and slot lifecycle

**Profiles come from s1-l1 and are never individuals.** s1-l1 names three real people or organizations; Field Mode's onboarding walks the founder through generalizing each into a *profile* — the shape of a person, not the person ("solo bakery owner in my neighborhood," never "Maria Ortiz"). `fromQid` is always `'s1-l1'`. If a profile label contains what looks like a personal name (two consecutive capitalized words), the app warns — "Profiles are shapes, not people. Describe the role, not the name." — and, per the gate philosophy, warns but never blocks. The real person the founder actually approaches lives in their head and their own contacts app, never in Founder's Quest. The same rule binds warm-intro slots: the app stores the thread (`spawnedByAttemptId`), not the person; the optional `evolution.note` gets the same non-identifying guidance and warn.

Slot creation: each new profile spawns with **2 open cold slots** (tunable default); the founder adds more with two taps and zero justification (law 10). Open, never-attempted slots may be deleted. Everything from `attempted` onward is history and is never deleted.

### State machine (complete)

```
(create) ──────────────► open
   founder add · evolution spawn (kind:'warm-intro') · aging respawn offer

open ──────────────────► attempted
   logged AT THE MOMENT OF TRYING, before any outcome exists.
   Writes: attempt record { startedAt }, slot.attemptedAt, slot.attemptId.
   Momentum increments (first attempt of the day, §6).

attempted ─────────────► hollow
   outcome ∈ { declined, no-show, no-story }.
   A rejection still fills the slot: the slot is spent honorably, the attempt
   stands, and it counts on the Action side (§3). Writes outcome, resolvedAt.
   Creates NO evidence entry. Terminal for the slot.

attempted ─────────────► filled
   outcome = quote: founder types the verbatim quote → one real E2 entry appended
   to evidence[] with a founder-chosen non-identifying source label (required;
   guidance + examples: "bakery owner #2", "the Tuesday barista"; warn-never-block
   on name-shaped labels). Optional escalations in §4. Terminal for the slot.
```

- **No auto-resolution.** Only the founder moves `attempted` to an outcome. An attempt unresolved after 3 days gets one gentle nudge — "Close the loop on that attempt. Even 'they said no' fills the slot." — suppressed in the trough.
- **Aging of hollow slots:** a hollow slot older than **14 days** (from `resolvedAt`; tunable default) enters a derived *aged* display state — dimmed, with a one-tap offer to hunt that shape again, which spawns a fresh open cold slot for the same profile. The hollow record itself never changes and never disappears. The offer carries no pressure copy, and in the trough it is present but silent (no nudge, no badge count).
- **Evolution spawn:** resolving an attempt with a referral (§4) immediately spawns one open slot `{ kind:'warm-intro', spawnedByAttemptId }` on the same profile by default; the founder may reassign it to another profile or create a new one. Open warm-intro slots surface at the top of the hunt list; after 7 days untouched they get one gentle reminder (tunable; suppressed in the trough).
- **Profile retirement** sets `retiredAt`; its open slots may be deleted, its history stays.

---

## 3 · The A-101 accounting — hollow → Action, and what never touches Truth

Stated precisely. These four rules are the contract:

**A1 — What logging an attempt increments.** `open → attempted` writes exactly: the attempt record, the slot fields, the momentum increment (§6), and the active Field Day counter if one is running. Nothing else.

**A2 — Hollow is Action only.** Every attempt — hollow or filled — increments the **field-attempt tally**, a derived count rendered on the Action side of the dual-progress display (with a 7-day trailing figure). The Action *formula* from 02 (milestone fraction, self-reported) is **unchanged**: Field Mode never auto-checks a milestone. When field activity plainly satisfies an existing milestone (e.g. Stage 2's "five E2+ conversations" once five slots are filled), the app *prompts* the founder to check it themselves — self-reported stays self-reported (the 2026-07-05 fabricated-checkmark decision generalizes).

**A3 — What never touches Truth.** Hollow slots, attempts, momentum, fieldDay, huntList, rarity tags, evolution referrals, and import provenance **never** create evidence entries, never enter `tierOf(a)`, never enter the Truth numerator or denominator, and never grant XP. A hollow slot produces no `evidence[]` record under any circumstances. Truth moves only when an `evidence[]` entry of tier ≥ 2 is linked to an assumption and that assumption resolves — the existing mechanics, byte-for-byte.

**A4 — Field Mode grants zero XP of its own.** XP still comes only from assumption resolutions (validated +10, invalidated +15) and completed Side Quests (+5). Rarity is chrome; the Legendary payout is the registry's own invalidation payout (§4), not a field bonus.

Filled slots are the only bridge to Truth, and they cross it on the existing plank: filled → E2+ entry in `evidence[]` → founder links it to guardians → resolution moves Truth.

---

## 4 · Rarity ladder and the Legendary funeral path

Rarity maps onto the existing evidence tiers. It is derived at fill time, stored on the attempt for display stability, and **used in no computation anywhere**.

| Rarity | Trigger during the encounter | What gets written | Truth/XP path |
|---|---|---|---|
| **Common** | Typed verbatim quote about their past | one E2 entry in `evidence[]` | existing: link → resolve |
| **Rare** | Founder also *saw* the behavior — they opened the spreadsheet, showed the workaround | additionally an E3 entry (text = what was seen) | existing |
| **Epic** | They *paid* — money, deposit, a costly commitment made then and there | additionally an E4 entry | existing |
| **Legendary** | A **disconfirming** quote — any E2+ entry the founder flags as cutting against a registered assumption | the E2+ entry, linked to that assumption at capture | **the funeral**: deep-link into the existing Registry invalidation flow (the s5-l5 ritual). Marking the assumption invalidated pays **+15 XP through the existing registry mechanics** — that *is* the 1.5×. No parallel XP source exists; Field Mode's only contribution is the flag, the link, and the celebration chrome. |
| **Evolution** | A referral: they name someone else living the problem | `evolution: { spawnedSlotId, note? }` on the attempt; one open `warm-intro` slot spawned (§2) | none — a referral is a lead, not evidence |

Rulings:
- Rarity resolves to the **highest tier written**, with Legendary overriding for display when the disconfirming flag is set. Evolution is an **orthogonal modifier**, not a rung that excludes the others — a paid, disconfirming encounter that ends in a referral is Legendary with an Evolution badge. (The kickoff lists Evolution on the ladder; co-occurrence is the ruling because referrals arrive alongside any outcome.)
- Law 8 (reward disconfirmation) is why Legendary sits above Epic in the chrome even though E4 outranks E2 in the tiers: a killed assumption makes the map truer, and the ladder should say so out loud.
- The referral's identity is never stored (§2). The `note` is non-identifying context ("her supplier, same pain, different scale").

---

## 5 · Encounter taxonomy — introvert-inclusive

The rule in one line: **synchronous, one human, about *their* story, counts. Async broadcast doesn't.**

An encounter fills a hunt slot only when all three hold:
1. **Synchronous** — both people present in the same exchange, responding within the same sitting. Real-time text counts fully.
2. **One human** — a person, not an audience.
3. **About their story** — past specifics, Mom Test: what they did, the last time it happened. A synchronous conversation that never leaves your pitch produces no quote worth filling with (compliments are not data — the Stage 2 field-rules banner governs).

**Counts** (channels, all equal in standing):
- `in-person` — including a shadowing session where you watch them run the workaround (that is where E3/Rare lives)
- `call` — voice
- `video` — video call
- `live-chat` — a live DM or chat exchange in the same sitting. This is the introvert-inclusive load-bearing entry: a founder who never makes a phone call can fill every slot over text, and a 10-minute exchange counts exactly as much as an hour.

Introvert-inclusive by construction, not by exemption: rejection counts as a full attempt (A2), goals are attempt-based and founder-set (§7), there is no streak-shaming (§6), and no mechanic requires cold-approaching strangers in person.

**Doesn't count** (never fills a slot):
- **Async broadcast**: surveys, polls, mailing-list blasts, social posts, feedback forms — no matter how many replies come back.
- **Async 1:1** (an email thread, voice notes traded across days): fails the synchrony test, so it fills no slot. Quotes from it remain loggable in the ordinary ledger under existing rules, outside A-101 — Field Mode takes no position on their tier.
- **Passive audience** (hearing someone tell their story to a room): synchronous but no exchange. Talk to them afterward and *that* is an in-person encounter.

Boundary ruling: "same sitting" means the exchange holds both people's attention as one conversation. A chat answered days later is async; a slow but continuous hour of messages is synchronous.

---

## 6 · Momentum and the trough freeze

Momentum is a **cadence meter, nothing more**. It never touches Truth, XP, the Action formula, or Shadow triggering. It exists so the founder can see their own field rhythm — and so the app can honor the constitution's cadence law: pressure belongs on the upswing, never in the trough. The stored key is the single momentum source (R1): game-design's lantern is a pure renderer of `momentum.value`; nothing recomputes momentum from dated writes.

Mechanics (defaults tunable at Phase 0 sign-off):
- `value` is an integer 0–7; it initializes to 0, with both dates `null`.
- **Increment:** the first attempt logged on a given day sets `value = min(7, value + 1)` and `lastAttemptDate = today`. Further attempts the same day add volume to the tally (§3), not momentum — momentum is rhythm, not throughput.
- **Decay tick** — runs on app open and before logging an attempt; idempotent via `lastTickDate`; processes every full day strictly before today not yet processed:

```
for D in (lastTickDate .. yesterday]:
  if hasAttempt(D):            continue            # attempts already incremented live
  if troughAt(D):              continue            # FROZEN — see below
  if isDayAfterAttemptDay(D):  continue            # one grace day, always
  value = max(0, value - 1)
lastTickDate = yesterday
```

- **First tick:** a `null` `lastTickDate` is set to yesterday and no decay is applied — the meter starts counting from first use, never retroactively.
- **Imports never mutate momentum.** No momentum field crosses the beam, and an import writes nothing to this key (§8 rule 4).
- **The trough freeze:** `troughAt(D)` uses 02's definition exactly — mean of the last ≤ 3 weather values recorded on or before D is ≤ 2. Any day inside a trough causes **no decay**. Display shows a held state: *"Momentum holds — the map predicted this valley."* No nudges, no decay copy, no field prompts fire in the trough; the existing trough behavior (Shadow holds fire, normalizing banner, Side Quests surfaced) is unchanged and Field Mode adds nothing on top of it.
- Decay copy outside the trough is neutral, never shaming (law 9): *"Momentum eased. It comes back with one attempt."*
- Momentum is serialized into the journal (§11) as a single line; the Council's cadence paragraph already knows how to read weather and activity together.

---

## 7 · Field Day

A founder-declared capture sprint: one day, one attempt goal, the hunt list front and center. **Field Day contains no confidential class of data** — everything in `fieldDay` serializes into the journal and exports like any ordinary key. It is explicitly *not* Dinner-like; a test asserts its presence in `buildJournalMd` output (§12).

- **Start:** founder sets `goalAttempts` (suggestion defaults to 5 — the Stage 2 milestone's number). One active Field Day at a time; `current` holds it.
- **During:** capture-first mobile UI — big attempt/outcome buttons, counter `attempts/goal`, hunt list sorted warm-intros first, then open slots by profile. Every attempt logged while active gets `fieldDayId` and joins `attemptIds`.
- **End:** founder ends it (or it auto-closes at local midnight, unresolved attempts staying `attempted` per §2 — nothing auto-resolves). Writes a `log` entry `{ date, goalAttempts, attemptCount, filled, hollow, retro? }` and offers one optional retro line. `current` returns to `null`.
- **No shortfall commentary.** Ending under goal renders the tally plainly — *"You logged 3 attempts. Every one counts."* — because attempts are the unit of courage here (introvert-inclusive, A2). In the trough, Field Day remains fully available (founder-initiated effort is not pressure) but goal-shortfall copy is absent entirely.
- **Transfer-first hook:** ending a Field Day on mobile surfaces the beam prompt (§9).

---

## 8 · Import integrity — QR beam, file, pasted fragment

Three transports, one pipeline, one rule-set. Direction of the QR beam: **phone displays → desktop webcam scans.** There is no server, no sync endpoint (D-scope), no radio channel — transfer is manual, device-to-device, founder-operated.

### Envelope (all three transports)

```ts
{
  kind: 'founders-quest/field-beam',
  v: 1,
  beamId: string,
  createdAt: ISODate,
  payload: {
    profiles:    HuntProfile[],
    slots:       HuntSlot[],         // terminal only: hollow | filled
    attempts:    FieldAttempt[],     // resolved attempts only (terminal)
    evidence:    EvidenceEntry[],    // the existing shape; tier 2–4 for beam payloads
    fieldDayLog: FieldDayLogEntry[], // Field Day closure records (§7 log entries; never `current`)
  }
}
```

**Terminal records only (R6).** The payload carries resolved attempts, hollow/filled slots, their evidence, and Field Day closure records. Open slots, unresolved attempts, and an active Field Day never travel. Local-only bookkeeping fields (`beamedAt`) are stripped from every payload record before encoding and are excluded from rule 4's content comparison.

### The integrity rules (binding, in order)

1. **Schema validation, strict.** `kind` and `v` must match exactly. Only allowlisted fields per record type; **any unknown key anywhere → reject with a named error.** Tiers bounded 2–4 for beamed evidence; text ≤ 4,000 chars; source label ≤ 120 chars; ids bounded strings. Any Dinner-named key in a payload is rejected outright — defense in depth on top of the structural exclusion (the envelope simply has no Dinner, answers, milestones, gates, council, weather, vault, trail, assumptions, or key fields; import *cannot* express a write to them).
2. **Size cap.** File/paste: 256 KB. QR path: 64 KB total envelope (larger → use file). Oversize → named error, nothing parsed further. (Caps tunable at Phase 0.)
3. **Preview + explicit confirm.** Before anything is written: counts per record type, then per evidence entry a tier badge, the first 120 chars of the quote, the source label, the date, and any retained assumption links (rule 7); per attempt a summary line; per Field Day closure record a one-line tally (date, attempts/goal). The confirm button carries exact counts ("Import 7 entries"). Cancel discards everything.
4. **Append-only, dedupe by id, never overwrite.** Merge order profiles → slots → attempts → evidence → fieldDay log entries. An incoming id that already exists is **skipped** (counted in `skippedExistingIds`); an existing id whose content differs is skipped and counted as a `conflict` — **never overwritten, never merged**. The content comparison ignores local-only bookkeeping fields: a record differing only in `beamedAt` is a skip, not a conflict. Re-scanning the same beam is therefore always safe and reports "already have all N." An import writes only payload records plus the rule-5 audit entry; it never mutates `momentum` (§6).
5. **Provenance.** Imported attempts get `origin:'import'`, `importedAt`, `beamId`. One `fieldJournal.imports` audit record is appended per import with `via`, counts, and `evidenceIds` — the ids actually **written** by that import; skipped ids are excluded. Slot and profile provenance is deliberately counts-only. The Evidence Ledger renders an **imported** badge on every entry whose id appears there (derived lookup, §1).
6. **Imported quotes render as data everywhere — including Council-bound journal text.** Imported text is never interpreted: plain text in the UI (no HTML/Markdown rendering), and inside `buildJournalMd` it appears as quoted material with backtick fences neutralized so a quote can never break out of its block or masquerade as journal structure. The Council prompt already treats the journal as material, not instructions; this rule keeps that true for text that arrived by beam.
7. **Assumption links validate against the home registry.** On import, each evidence entry's `linkedAssumptionIds` is checked against the local `assumptions[]`: any id not present is blanked; retained links surface in the rule-3 preview; blanked links prompt re-linking at home after import. A Legendary captured on a registry-less device is flag-only at capture — the disconfirming flag rides the evidence entry; the guardian link and the funeral (the existing 1.5× mechanics, §4) happen at home after linking.

### QR beam flow

- **Phone:** Field journal → "Beam home" → selects every terminal record not yet marked `beamedAt` (founder can widen to all; re-beaming is safe per rule 4). Envelope → JSON → base64url → chunks. Frame text: `FQB1:<beamId>:<part>:<of>:<chunk>`, chunk ≤ ~1 KB. Phone cycles frames automatically, looping.
- **Desktop:** import panel → webcam via the native **`BarcodeDetector`** API (Chromium). Shows collected `k/n`, assembles, decodes, then enters the pipeline at rule 1. Browsers without `BarcodeDetector` fall back to file or paste — the beam is a convenience, not the only road.
- **After desktop confirms**, the founder taps "beamed" on the phone, setting `beamedAt` — bookkeeping only, with no correctness weight.
- **File:** phone exports `field-beam-<date>.json` (a plain browser download; the founder moves it however they like — the file contains their quotes, and the app says so before export). Desktop: file picker → same pipeline. **Fragment:** copy JSON on the phone → paste into the desktop import box → same pipeline.

---

## 9 · Mobile persistence — PWA, A2HS, transfer-first, eviction warning

Field Mode is the same app (same build, same storage ladder, BYOK Council works identically on the phone) installed as a PWA. Each device is its own full instance; the desktop copy is home, the phone is the capture surface.

- **PWA manifest:** `manifest.webmanifest` — name "Founder's Quest", `display: standalone`, `start_url: /`, icons, theme colors.
- **Service worker, hand-rolled:** precaches the built shell (index.html, JS, CSS) with cache-first for same-origin GETs; **no fetch handling at all for POST or cross-origin requests** — calls to `api.anthropic.com` pass untouched, never cached, never observed (structural, matching the zero-logging stance). Versioned by build hash; an update shows "A newer build is ready — reload." Hand-rolled keeps runtime deps at zero; see OPEN QUESTIONS for the build-tooling note.
- **Offline:** capture works fully offline (storage is local). The Council needs the network and already has its canonical error copy.
- **iOS A2HS onboarding:** when running in an iOS Safari *tab* (not standalone), an onboarding card teaches Add to Home Screen via the share sheet, and says why plainly: **home-screen apps escape Safari's 7-day storage eviction; tabs don't.** Detection: iOS UA + `navigator.standalone === false` / `display-mode` media query.
- **Eviction warning** (shown on capture surfaces in tab mode; draft copy):
  > **The app never deletes — Safari can.** Installed home-screen apps keep their storage; a browser tab left alone for 7 days can be wiped by Safari itself. Install the app, or beam your captures home. This covers your API key too — if Safari clears it, nothing is broken: just re-enter it.

  The key line is load-bearing: eviction of the key is self-healing (re-enter), stated so a wiped key reads as an inconvenience, not a breach.
- **Transfer-first after capture:** ending a Field Day, or filling a slot in a mobile session, surfaces a non-blocking "Beam it home" card; a persistent chip shows the un-beamed count. Data minimization is the stated design choice: the phone holds captures only as long as the founder wants it to.

---

## 10 · Voice capture

Typed is always primary; voice is a hands-busy convenience that lands in the same text box.

- **Opt-in**, per capture surface. Off by default.
- **On enabling:** the app checks the Web Speech API. On Chromium it requests **on-device processing (`processLocally`)** and verifies it, waiting up to **10 seconds** total (including any on-device model readiness). Verified-local → mic starts with an "on-device" badge. Not verified within 10s → **fall back to typed**, with a plain note.
- **Consent line where not verified-local:** if the founder explicitly chooses voice on a browser where local processing is not verified, this consent line shows first (draft copy):
  > On-device transcription isn't verified in this browser. If you use voice anyway, your audio is handled by the browser's speech service and may leave this device. Typing keeps everything local.
- **Typed always primary:** the transcript fills the ordinary text field and must be reviewed and edited before save — the typed text is the record. **Audio is never stored, never serialized, and has no schema representation.** Nothing in §1 can hold it.
- iOS Safari has no verified-local path; there, voice is the consent-line path or typed-only — same rule, no special case.

---

## 11 · Council-visible journal text and the Dinner exclusion

`buildJournalMd(data, mode)` remains the single serializer. A-101 writes Council-visible journal text in exactly two places:

1. **The Evidence Ledger section (existing):** evidence entries created by filled slots serialize like any others — quote text, non-identifying source label, tier, date — plus an `(imported)` marker where §8 provenance applies, rendered as data per rule 6.
2. **A new `## Field journal` section (proposed in §13's companion note):**
   - *full mode:* per-profile lines (label + open/hollow/filled tallies), attempt totals by outcome and channel, the momentum line (value + held-in-trough flag), and Field Day log lines (date, attempts/goal, retro) — beamed closure records included (§8), so Field Day history reaches the home copy's journal.
   - *compact mode* (Council input): totals and the momentum line only — no per-attempt detail, mirroring the compact-readings philosophy.

What never reaches the serializer, either mode: individuals' names (never stored, §2), raw audio (never exists, §10), the API key (own storage key, structural), and **Family Dinner data**. A-101 ships **zero Dinner UI** — the mobile surface adds nothing Dinner-shaped — and `dinnerCard`, `dinnerSession`, and `dinnerLog` remain excluded from `buildJournalMd` in **both serializer modes, `'full'` and `'compact'`, with tests asserting both** (§12). `dinnerCard` — the founder's own card, not dinner-session data — keeps its single sanctioned surface outside the serializer: the Quest Brief lead ("Going wrong right now"), per 02 and ruling R3. The import validator additionally rejects Dinner-named keys in any payload (§8 rule 1). Confidentiality stays structural, not policy.

The 04 consent copy already covers what travels ("Your journal may contain names and quotes from real people; that is worth knowing before it travels") — field quotes change nothing about that sentence. The thin-ink guard is unchanged.

---

## 12 · Tests required at ship (minimum set)

1. Dinner exclusion: `buildJournalMd(data,'full')` and `buildJournalMd(data,'compact')` both contain no Dinner content, with populated Dinner keys present in state.
2. `fieldDay` presence: a logged Field Day appears in `'full'` journal output (no confidential class).
3. Hollow creates no evidence: resolving hollow leaves `evidence[]` byte-identical; Truth and XP unchanged.
4. Guardian derivation untouched: `tierOf(a)` over a mix of local and imported evidence matches the 02 formula; nothing in the four new keys affects it.
5. Import idempotence: importing the same beam twice yields zero new records the second time and a correct `skippedExistingIds` count; a same-id/different-content record increments `conflicts` and overwrites nothing.
6. Import rejection: unknown keys, Dinner-named keys, tier outside 2–4, and oversize payloads each fail with named errors before any write.
7. Momentum freeze: decay ticks across a trough window (02 definition) leave `value` unchanged; the same window without the trough decays.
8. Legendary pays once: the funeral path yields exactly the registry's +15 and no other XP delta.
9. Fence-neutralization: an imported quote containing ``` sequences cannot alter journal structure in either serializer mode.
10. Beam terminality: a built payload contains only terminal records — resolved attempts, hollow/filled slots, their evidence, Field Day closure records — and no `beamedAt` or other local-only field; a record differing from its local copy only in `beamedAt` imports as a skip, not a conflict.

---

## 13 · Proposed 02 data-model addendum

**Do not apply now.** This rides the Phase 0 canon approval; canon copies update in the same commit as the change they describe, and this spec does not edit canon. Exact diff text against the data model block of `docs/canon/02-architecture.md`:

```diff
   sideQuests: { [id]: { text, startedAt, completedAt } },
   dinnerCard: { text, updatedAt },
   dinnerSession: { date, cards:[{id,name,text,bucket,match,spoke}], timer } | null,
-  dinnerLog: [{ date, cards, spoke, matches }]
+  dinnerLog: [{ date, cards, spoke, matches }],
+  huntList: { profiles: [{ id, label /*a profile, never a person*/, fromQid:'s1-l1',
+              createdAt, retiredAt? }],
+              slots: [{ id, profileId, kind:'cold|warm-intro', spawnedByAttemptId?,
+              state:'open|attempted|hollow|filled', createdAt, attemptedAt?,
+              resolvedAt?, attemptId? }] },
+  fieldJournal: { attempts: [{ id, slotId, channel:'in-person|call|video|live-chat',
+              startedAt /*logged before outcome*/, outcome?:'quote|declined|no-show|no-story',
+              resolvedAt?, evidenceIds[], rarity?:'common|rare|epic|legendary' /*display only*/,
+              evolution?:{spawnedSlotId,note?}, fieldDayId?, origin:'local|import',
+              importedAt?, beamId?, beamedAt? }],
+              imports: [{ beamId, importedAt, via:'qr|file|paste', counts,
+              evidenceIds[] /*ledger provenance badge is derived from here*/ }] },
+  momentum: { value:0-7, lastAttemptDate, lastTickDate },  // cadence only; never Truth, XP,
+                                                           // or the Action formula; the single
+                                                           // stored source — the lantern
+                                                           // renders this value
+  fieldDay: { current: { id, date, goalAttempts, attemptIds[], startedAt, endedAt?,
+              retro? } | null,
+              log: [{ id, date, goalAttempts, attemptCount, filled, hollow, retro? }] }
 }
```

Companion edits landing in the same approval (sentences, not diffed here because they sit outside the data model block): (a) the migration-rule paragraph already covers the four keys via `{ ...EMPTY_DATA, ...loaded }` — one sentence noting A-101 keys default in; (b) the Serialization section gains one sentence: *"`buildJournalMd` adds a `## Field journal` section (compact = totals + momentum only); hollow attempts are Action-side tallies only; evidence from filled slots lives in `evidence[]` under existing rules; imported records are append-only, deduped by id, provenance rendered from `fieldJournal.imports`. Dinner exclusion unchanged."* (c) Computed metrics gains: *"Field-attempt tally = derived count of `fieldJournal.attempts` (with 7-day trailing figure), displayed with Action; the Action formula itself is unchanged."*

---

## 14 · OPEN QUESTIONS (embedded rulings requested at Phase 0)

1. **QR encoding vs "zero other runtime deps."** Scanning uses the native `BarcodeDetector` (no dep), but *generating* QR frames on the phone requires either a vendored single-file MIT encoder committed to the repo or a new runtime dependency — both collide with 02's "zero other runtime deps." Ruling needed: vendor, add dep, or ship file/paste-only first and beam later.
2. **Attempts in the Action formula.** This spec rules that hollow/filled attempts render as a tally beside the Action bar and never enter the milestone-fraction formula (§3, A2). If the operator instead wants attempts *inside* the Action percentage, that changes a computed metric in 02 and needs its own decision-log entry.
3. **Tunable defaults, sign-off as a batch:** hollow aging 14 days; warm-intro reminder 7 days; unresolved-attempt nudge 3 days; 2 open slots per new profile; momentum cap 7 / one grace day / −1 per day; Field Day goal suggestion 5; import caps 256 KB file / 64 KB QR; QR chunk ~1 KB.
4. **Service-worker build tooling:** hand-rolled `sw.js` is specified to keep runtime deps at zero; if the operator prefers `vite-plugin-pwa` (devDependency only), say so — it touches the build, not the bundle.
5. **Momentum display chrome:** numeric value + held state is specified; any mythic naming for momentum bands is content-canon work (03) and is deliberately not invented here.
