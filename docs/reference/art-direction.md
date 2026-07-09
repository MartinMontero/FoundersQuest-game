# Art direction — "N64-era warm low-poly fantasy" (operator references, 2026-07-08)

Derived from operator-supplied *Ocarina of Time* reference stills. **Style and
mood only — inspired by, never copied.** This is the cross-world look; each of
the 8 worlds varies its palette within it.

## Hard IP guardrails (non-negotiable)
Emulating an *aesthetic* (low-poly, warm lighting, chunky charm, iconographic
HUD) is fine; reproducing Nintendo's specific protected expression is not.
- **NO** green-tunic/pointed-hat/pointy-ear hero, no Triforce, no rupee shapes,
  no fairy companion named/styled as Navi, no "Hyrule"/Zelda names, no Master
  Sword, no heart-container icon as-is, no Nintendo logos or map iconography.
- **OURS:** the cloaked founder (hood + scarf, faceless-mysterious), rune-shrine
  monuments, the nebula/space + per-world themes, tier "currency metals" of our
  own design (E0–E4), Truth/Action meters, the Council temple.
- CC0 asset packs (KayKit/Kenney/Quaternius, glTF) are the sanctioned way to
  add richer low-poly models when their sites are reachable; until then the look
  is procedural (toon materials + primitives). Never lift ripped game assets.

## The five style pillars (from the references)
1. **Warm, soft lighting.** A golden key light + gentle warm ambient, soft
   falloff, no harsh speculars. Fog banked into the distance for depth (the OoT
   "air"). Even our cool-themed worlds (Nebula, Mirror) get a warm rim so they
   read as inviting, not sterile. Move OFF the cold violet-only console look.
2. **Chunky, charming low-poly.** Rounded, readable silhouettes over detail; a
   little bounce/idle life in the character; models read from a distance. N64
   proportions: big head-to-body charm, simple confident forms.
3. **Painted, tactile ground.** Soft gradient/painted toon surfaces with subtle
   variation and scattered detail (tufts, stones, crystals) — not flat plastic.
   Gentle tiling feel, warm earth even in a space setting (warm dust on violet).
4. **Glowing collectibles + soft bloom.** Pickups, rune glints, and the shrine
   gems glow softly and catch bloom (full tier) / emissive (constrained). The
   world should have little points of warm/teal light that draw the eye — the
   OoT rupee/fairy sparkle, in our idiom.
5. **Iconographic, corner-anchored HUD.** The OoT signature: bold, rounded,
   colored, tucked into corners, readable at a glance.
   - **Truth** = the lead gauge, top-left, prominent (the "life" slot) — a
     glowing sigil meter.
   - **Action** = a smaller secondary bar beneath it.
   - **Tier coins E0–E4** = a small iconographic cluster (our "currency metals"),
     bottom-left, like a collectible counter.
   - **Compass/minimap motif** = bottom-right — a simple radial showing shrine
     directions (functional + very OoT). Optional first pass; nice-to-have.
   - Chunky rounded panels, warm borders, soft drop shadow, literal E0–E4 codes
     beside mythic metal names (never-translate invariants).

## Keep from Phase 2b
The **trance / journal panels stay parchment** — a writing surface *should* feel
like a founder's journal (it read well, operator-approved). The split: the
in-WORLD HUD goes OoT-iconographic (this is a game); the WRITING surfaces stay
diegetic journal. Best of both.

## Per-world palette (within the warm low-poly style)
1 Swirling Nebula — violet/indigo **warmed** with gold dust + teal runes.
2 The Raven — slate & storm-grey, cold blue, a lone warm lantern.
3 The Phoenix — embered warm: amber/orange/ash (naturally OoT-warm).
4 The Labyrinth — mossy stone greens + torchlight (closest to OoT dungeons).
5 The Mirror — pale silver/water, cool but warm-rimmed.
6 The Sculptor — marble & clay warm neutrals.
7 The Bridge — dusk gold over a chasm, warm span.
8 The Rocket — pre-dawn indigo→gold, launch glow.

## Motion & camera (unchanged rules, warmer feel)
Keyboard-first; `prefers-reduced-motion` honored (static particles, instant
cuts); soft idle bob and a gentle camera follow. Nothing frenetic — OoT is
calm, readable traversal.
