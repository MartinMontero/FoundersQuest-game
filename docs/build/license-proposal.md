# Licensing proposal — Founder's Quest

*Phase 0 rulings-pack document. The operator reviews this before any code exists. Canon order applies: 01-constitution outranks this file; this file proposes, canon disposes. Nothing here is in force until ratified; license files land in Phase 1 after ratification.*

## 1 · The ruling requested

Adopt the split 01 already names, with exact SPDX identifiers:

- **Code** — `AGPL-3.0-or-later`
- **Content** (question bank, recipes, docs) — `CC-BY-4.0`, via the Founder's Quest Cookbook

Constitutional basis (01, Lineage & obligations, verbatim):

> **Licensing:** content (question bank, recipes, docs) CC BY 4.0 via the Founder's Quest Cookbook; code AGPL-3.0 recommended per AOS practice. The license split is deliberate: recipes travel friction-free; code stays free all the way down.

One refinement needs explicit ratification: 01 says "AGPL-3.0 recommended"; this proposal (per the build brief) specifies **`AGPL-3.0-or-later`**. The "-or-later" clause lets the code move to a future AGPL version without relicensing every contribution. If ratified, 01's licensing line is updated to name the exact SPDX expression **in the same commit** that adds the LICENSE files (canon copies update in the same commit as any change they describe — CLAUDE.md).

## 2 · Repo file layout for the dual license

Three files plus a README section. Simple two-license layout, not the REUSE `LICENSES/` directory convention — the repo is small and the split is binary; revisit if a third license ever appears (it should not: assets are CC0, which is upstream, not ours to relicense).

| File | Contents | Governs |
|---|---|---|
| `LICENSE` | Full verbatim text of the GNU AGPL v3.0 | All code by default: `src/`, `scripts/`, build config, CI workflows |
| `LICENSE-content` | Full verbatim legal code of CC BY 4.0, preceded by a short grant paragraph (see §2.1) | Content: `docs/` (canon, build docs, the Guide), the question bank text, recipes, cookbook material |
| `CREDITS.md` | CC0 asset credits (§8), the PIE attribution line (§4), epistemology attributions (§5) | Nothing legally (CC0 requires nothing); exists per the constitution's spirit |
| `README.md` § "Licensing" | The split in three sentences + the path table above + the PIE line + link to both license files | Human-readable map |

`LICENSE` gets the full AGPL text unmodified — tooling (GitHub license detection, SPDX scanners) keys off it. `LICENSE-content` carries the full CC BY 4.0 legal code, not just a link, so a cloned repo is licensing-complete offline.

### 2.1 · Grant paragraph at the head of LICENSE-content (draft)

> The content of Founder's Quest — the question bank, hints, ritual copy, recipes, and documentation (everything under `docs/`, and the string values compiled into `src/strings.js`) — is licensed under Creative Commons Attribution 4.0 International (CC BY 4.0), as part of the Founder's Quest Cookbook. The code is separately licensed under AGPL-3.0-or-later; see `LICENSE`. Portions of the content are adapted from the PIE Cookbook: "Adapted from the PIE Cookbook by PIE (piepdx.com), CC BY 4.0."

## 3 · The question-bank-inside-code problem

The game design compiles all copy — questions, hints, Council strings, gate warnings — into one strings module (`src/strings.js`), byte-matched to 03 and 04. That file is CC BY 4.0 content living inside an AGPL program. Two distinct cases:

**House content (the question bank, hints, Council prompt, all copy the operator authored).** No compatibility question arises: the copyright holder grants both licenses. The combined file ships as part of the AGPL work; the same string values are *additionally* offered under CC BY 4.0 via the Cookbook. A downstream user picks the door that fits: extract the strings under CC BY 4.0 (recipes travel friction-free), or take the whole program under AGPL (code stays free all the way down). Dual grant by one licensor is not dual restriction.

**Third-party CC BY 4.0 material (the PIE-derived patterns: Side Quests/404, one-way feedback copy, Family Dinner rules text, rollercoaster framing).** Here we are licensees, not owners. This works because CC BY 4.0 is **not** ShareAlike: §3(a) requires attribution, marking of modifications, and preservation of the license notice, but adapted material may be released under other terms — including AGPL — so long as recipients can still identify and exercise their CC BY 4.0 rights in the underlying material, and no additional restrictions are imposed *on that material itself* (§2(a)(5)). Our mechanism satisfies this: the notice travels with the material (§3.1 below), the PIE-derived content remains independently available under CC BY 4.0 via the Cookbook, and AGPL's notice-preservation rules (GPLv3 §4 — keep all notices intact — carried into modified versions via §5's preamble, which conveys them "under the terms of section 4"; plus the §7(b) additional term declared in §3.1) *require* downstream users to keep the CC attribution intact rather than conflicting with it. The two licenses' obligations stack; they do not collide.

**Verification note (UNVERIFIED — plainly marked):** the FSF license-list commentary on CC BY 4.0 could not be fetched from this environment (proxy policy denies gnu.org; actual tool result, 2026-07-08). The analysis above stands on the license texts themselves. Before ratification, confirm the FSF's current characterization of CC BY 4.0 and GPL compatibility against gnu.org/licenses/license-list.html from an unproxied connection. If the FSF marks plain CC BY 4.0 GPL-incompatible for *software*, that does not change the aggregation analysis here — the CC BY material is content, not software, and remains separately extractable — but the operator should read the entry before signing.

### 3.1 · How the notice travels inside the code

Header comment for `src/strings.js` (draft):

```js
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Code in this file (module structure, exports, helpers): part of
// Founder's Quest, licensed AGPL-3.0-or-later — see /LICENSE.
//
// The string VALUES below — the question bank, hints, and ritual copy —
// are Founder's Quest Cookbook content, additionally available under
// CC BY 4.0 — see /LICENSE-content. Portions carry this attribution:
// "Adapted from the PIE Cookbook by PIE (piepdx.com), CC BY 4.0."
//
// These are legal notices; preserve them in modified versions
// (AGPL-3.0 §4 via §5; §7(b); CC BY 4.0 §3(a)).
```

**Declaring the §7(b) term:** §7(b) protection exists only where the licensor states the term. `LICENSE-content`'s grant paragraph and the README licensing section declare it: the CC BY 4.0 attribution notice (including the PIE line) is an additional term under AGPL §7(b) — preservation of specified reasonable legal notices and author attributions. Stripping it from a modified version then violates the code license, not just courtesy.

**The bundle problem:** minification strips comments, so the notice must also live where players actually see the shipped work — the in-app credits page (already specified in the game design: "Attribution page in-game even for CC0 — courtesy, and the PIE CC BY 4.0 line (01) lives there too"). The credits page is the runtime notice; the file header is the source-tree notice. Optionally emit the header as a `/*! … */` legal comment so the bundler preserves it in `dist/` — verify esbuild/Vite legal-comments behavior at build time (UNTESTED).

## 4 · The PIE attribution line

Carried **verbatim**, never paraphrased:

> "Adapted from the PIE Cookbook by PIE (piepdx.com), CC BY 4.0."

Required placements (first three are 01's own list; the rest extend it to every surface where the material ships):

1. **The Guide** (01: "Attribution line carried in the Guide, cookbook, and derived recipes")
2. **The cookbook** (README or front matter)
3. **Every derived recipe** (each recipe file carries the line)
4. **In-app credits page** (the runtime notice — the shipped bundle strips comments, §3.1)
5. `CREDITS.md`
6. `src/strings.js` header (§3.1)
7. `LICENSE-content` grant paragraph (§2.1)

## 5 · Epistemology attributions

These are constitution-level facts (01, Lineage & obligations), scholarly attributions rather than license obligations — they cannot be dropped in any rewrite:

- "intuition is recognition" = **Herbert Simon**
- illusion-of-validity discussion sources to **Kahneman, Thinking, Fast and Slow (2011)**
- trust-conditions result = **Kahneman & Klein (2009)**

Carried in: the Guide/epistemology doc wherever the intuition-hunch system is described, and `CREDITS.md`. 01's standing order applies: "Do not reintroduce the corrected errors." Verification: a string-presence check in CI for the three names wherever `docs/epistemology/` content exists (that doc is a prereq of the queued Earned Hunch task).

## 6 · package.json license field

```json
"license": "AGPL-3.0-or-later",
"private": true
```

Rationale: the field describes the package as consumed by npm tooling — the software. The CC BY 4.0 grant on embedded content is made by `LICENSE-content` and the README, not by package.json; stating only AGPL under-promises and never over-promises. `"private": true` because the app is deployed, not published to the registry. Alternative if the operator prefers maximal accuracy in one field: the SPDX conjunction `"(AGPL-3.0-or-later AND CC-BY-4.0)"` is valid SPDX, or npm's `"SEE LICENSE IN README.md"` escape hatch. Recommendation stands on the simple form.

## 7 · Per-file SPDX headers — recommendation: YES

- Code files: `// SPDX-License-Identifier: AGPL-3.0-or-later` (first line)
- `src/strings.js`: the dual header of §3.1
- Markdown content (docs, canon, recipes): a single trailing or leading line `<!-- SPDX-License-Identifier: CC-BY-4.0 -->`

Rationale: the repo is dual-licensed, so file-level clarity is worth two lines; the repo is small, so the cost is trivial; and it is mechanically checkable — a CI grep asserts every file under `src/` carries the AGPL id and every file under `docs/` carries the CC id. That check also catches the classic drift failure: content pasted into a new code file without its notice.

## 8 · CC0 assets — credit anyway

KayKit, Kenney, and Quaternius packs (and CC0 audio: Kenney audio packs, CC0-filtered OpenGameArt/freesound) are CC0 — no attribution is legally required. Credit them anyway; the constitution's spirit is attribution all the way down, and the game design already commits to an in-game attribution page "even for CC0 — courtesy."

`CREDITS.md` entry format, one line per pack:

```
- <Pack name> — <author> — <source URL> — CC0 1.0 — license verified <date>
```

The "verified" date matters: the game design requires "verify CC0 license and glTF availability per pack at import time." No specific third-party audio track is credited until its per-file license verification passes. CC0 assets are **not** placed under `LICENSE-content` — CC0 is the upstream author's dedication, not ours to relicense; the credits file records it, nothing more.

## 9 · AGPL implications for a purely client-side app

The 2026-07-08 BYOK decision makes production a pure static site — no server code executes anywhere. What AGPL means here:

- **Conveyance, not just network use.** Serving the bundle to a browser conveys object code (AGPL §6), which obliges a Corresponding Source offer. This is the operative clause for a static app — it fires on every page load, for everyone who hosts the game.
- **§6 already covers modified hosting; §13 is insurance.** Anyone who hosts a *modified* copy conveys modified object code, so §6 obliges a Corresponding Source offer for that modified version — no network clause needed. §13's job here is the fork this repo doesn't ship: if someone ports the Council behind a server, players interacting with it remotely are still owed that server's source. "Code stays free all the way down" is §6 doing today's work and §13 guarding the server-side fork.
- **Compliance mechanism: a footer "Source" link to the public repo.** Cheap, honest, always in view. Stronger form: pin the link to the deployed commit via the Pages build variable `CF_PAGES_COMMIT_SHA` baked in at build time, so the link is the Corresponding Source for exactly the bundle being served (UNTESTED — verify the variable at first deploy).
- **Consequence: the repo must actually be public at deploy time.** A footer link to a 404 is not a source offer.
- **No entanglement with sanctioned services.** The Anthropic API is a separate service the player calls with their own key — not a combined work; Cloudflare Pages hosts bytes — not a derivative. Nothing in the AGPL choice touches the BYOK path, and nothing in the BYOK path creates a hidden server-side work the source offer would miss: `dist/` *is* the whole program.

## 10 · OPEN QUESTIONS

1. **Copyright holder name.** Canon and brief are silent on the legal name for the `Copyright (C) <year> <name>` lines in LICENSE headers and CREDITS. Needed before files land.
2. **Cookbook location.** 05 lists a shipped cookbook scaffold (README, license split, CONTRIBUTING, GOVERNANCE, templates), but it is not in this repo. Separate repo or `docs/cookbook/` here? Determines whether `LICENSE-content` is authored once or mirrored, and where recipe files carry their PIE lines.
3. **FSF commentary unverified.** §3's verification note: confirm the FSF license-list entry for CC BY 4.0 before ratification (fetch blocked from this environment).
4. **Legal-comment survival in `dist/`.** Whether the `/*! … */` header survives the Vite/esbuild pipeline is UNTESTED; the in-app credits page is the guaranteed runtime notice either way.
5. **Does the artifact sandbox (`founders-quest-v3.jsx`, hosted on claude.ai) need its own notice surface?** It is the same dual-licensed work distributed through a different channel; canon is silent on artifact-side credits.
