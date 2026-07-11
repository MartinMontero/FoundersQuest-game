# Art Direction & World-Feel Addendum — Founder's Quest Game
**Status: binding on all experiential surfaces. Origin: Gate 2 verdict 2026-07-08 — mechanics PASS, presentation FAIL. This document is the corrective spec. "Myth lives in the chrome" is constitutional; a plain modal over a dark void is "a form," and the Gate 2 bar is "the work feels heavier than a form, not lighter." No surface presented at any gate or feel checkpoint ships below this floor.**

## 1 · Register & references
Target register: Mario Bros / Zelda: Ocarina of Time. World bar: exploreone.games — concepts get PLACES (terrain with elevation, paths, destination structures, readable horizon), never slabs in a void. Reference lessons: Sekaran's Varanasi build — place-specificity and warm living light; Trivedi — UI text carries personality, never chrome-free forms; Foshati's UE5 work — lighting does the emotional labor. These references were operator-mandated inputs; ignoring them was the Gate 2 failure.

## 2 · The floor (mandates)
1. **Cel-shaded low-poly** rendering across world and characters.
2. **Warm keylight + ambient fill**; every scene has ≥2 readable light sources (keylight + shrine/rune glow).
3. **Painted-gradient sky** per world palette (§5) — never a black starfield-only backdrop.
4. **Real terrain**: ground with elevation/texture variation and a horizon line where terrain meets sky.
5. **Rigged protagonist** from CC0 packs (KayKit Adventurers or equivalent), idle + walk animations minimum.
6. **Shrines are architecture** — structures with a forecourt or entrance the founder walks up to or into; never lone slabs.
7. **Diegetic panels**: trance/registry/vault UI styled as stone tablet or parchment; trance staging = camera dolly toward/into the shrine with the world still visible around the panel — the world never disappears behind a dim overlay.
8. **Mythic chrome typography** on HUD and panels consistent with the parchment/rune register; plain language in the asks (canon).

## 3 · Banned outcomes (any one visible = automatic checkpoint FAIL)
- Floating primitives in a void
- Capsule or primitive protagonist
- Unlit flat ground plane
- Form-modal-over-darkness (undecorated panel on a dimmed screen)
- Starfield as the only environment
- Default browser form controls visible in world UI

## 4 · Screenshot-checkable acceptance criteria (every feel checkpoint)
Each criterion must be verifiable from a single screenshot or ≤10s clip; the checkpoint pack archives one image per criterion.
1. From spawn: horizon shows terrain meeting painted sky — no void.
2. From spawn: ≥3 distinct landmark silhouettes readable at distance.
3. Protagonist is a rigged character model, visibly animated (idle/walk).
4. Every shrine reads as enterable/approachable architecture with a lit focal glow.
5. Trance frame: shrine visible around/behind a stone-or-parchment panel; no black-box modal.
6. ≥2 light sources evident (keylight + rune/shrine glow); shadows or shading gradients visible.
7. World palette (§5) applied; scene reads as that world at a glance.
8. Zero banned outcomes (§3) present.

## 5 · Per-world palette (W1 binding; W2–W8 directional, tunable at each world's checkpoint)
- **W1 Swirling Nebula:** deep indigo/violet ground and sky gradient, warm gold rune accents, soft cyan nebula wisps. (Current palette hue was acceptable; geometry and light were the failure.)
- W2 Raven: slate/charcoal + moonlit silver, single warm hearth accent. · W3 Phoenix: ember orange/ochre, dawn gradient. · W4 Labyrinth: sandstone + deep shadow teal. · W5 Mirror: cool glass blues, high-key rim light. · W6 Sculptor: marble whites/greys, warm workshop lamplight. · W7 Bridge: river blues + rope-and-timber browns, golden hour. · W8 Rocket: night launchpad — dark steel + floodlight white + engine glow.

## 6 · Assets
CC0 only: KayKit (Adventurers, Dungeon Remastered), Kenney, Quaternius. Primitives are permitted solely as invisible collision proxies — never visible in any checkpoint screenshot. New packs require the same CC0 + steward check as dependencies.

## 7 · Process binding
Applies to: the Phase 2b World-Feel re-pass (Gate 2 re-verdict), and every feel checkpoint in Program Addendum A (A3 First Light, A4 Confrontation/Funeral slice, A5 Ego). Mechanics may be built and tested headless, but nothing is presented at a gate below this floor — "grey-box first" is retired as a licensing phrase for visible surfaces. Performance guard: the floor holds ≥30fps on modest hardware; the quality toggle may reduce post-processing, never the floor items.
