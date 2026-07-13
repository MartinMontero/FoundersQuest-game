# Credits — third-party assets

All bundled assets are **CC0 / public-domain** (commercial use, no attribution
required); credited here by choice, per the constitution's spirit. Nothing is
fetched at runtime — every asset ships in the static bundle, same-origin, so the
`default-src 'self'` CSP holds and no third-party service sits in any path.

## 3D models (glTF)
- **`public/models/rogue.glb`** — "Rogue (Hooded)" from **KayKit Adventurers**
  by Kay Lousberg. **CC0.** The player character (the hooded founder): rigged,
  with a full baked animation set (Idle, Walking, Running, Interact, …).
- **`public/models/pillar.glb`** — from **KayKit Dungeon Remastered** by Kay
  Lousberg. **CC0.** Stone pillars serve as the shrine monuments.
- **`public/models/trees/CommonTree_*.gltf`** (+ `.bin` + `Bark_*`/`Leaves_*`
  textures) — from the **Quaternius "Ultimate Nature Pack"**. **CC0.** Scattered
  trees. External-file glTF (buffer + textures load same-origin — no `blob:`).

- **`public/models/rocks/Rock_*.glb`, `Rock_Moss_*.glb`** — from the
  **Quaternius low-poly nature packs** (Ultimate Nature family). **CC0.**
  Sculpted boulders replacing the primitive rock blobs (art-elevation run,
  2026-07-13). Converted to binary GLB in-repo (the upstream data:-URI buffers would need a CSP loosening; GLB parses in-memory, no fetch). Mirror: the same
  GitHub repo that carries our trees (flo-bit/tiny-planets).
- **`public/models/campfire/Bonfire.glb`, `Bonfire_Fire.glb`** — from the
  **Quaternius Survival Pack**. **CC0.** The campfire log pile + flame mesh.
  Mirror: trebeljahr/quaternius-showcase.
- **`public/models/props/banner_*.glb`, `torch_lit.glb`, `candle_triple.glb`,
  `chest.glb`, `chest_gold.glb`**
  — from **KayKit Dungeon Remastered** by Kay Lousberg. **CC0** (LICENSE.txt
  in the official KayKit-Game-Assets repo — the same repo whose pillar is
  byte-identical to our vendored `pillar.glb`, proving the shared origin).
- **`public/models/bird/Pigeon.glb`** — from **Quaternius "Ultimate
  Monsters"**. **CC0.** Rigged, 8 baked animations; recolored crow-black in
  code as the Cartographer's raven (no CC0 corvid model verifiably exists —
  honest swap, recorded). Mirror: mika314/KitchenSink.

## Environment / lighting
- **`public/hdr/venice_sunset_1k.hdr`** — HDRI from **Poly Haven**. **CC0.**
  Image-based lighting: real reflections + ambient on every PBR surface (the
  biggest realism lever per the premium-UI research).

## Textures (PBR)
- **`public/textures/ground/grassrock_*.jpg`** — "aerial_grass_rock" from
  **Poly Haven** (albedo + OpenGL normal + packed AO/rough/metal). **CC0.** The
  tiled plateau ground.

## Audio
No audio assets ship: every ambient bed and UI cue is **procedural WebAudio,
synthesized in code** (silence is the default until the player opts in at the
campfire). Nothing to license.

## Vendored code
- **`src/vendor/qrcode-generator/`** — qrcode-generator **2.0.4** by
  **Kazuhiko Arase**. **MIT** (not CC0 — license header retained in the file;
  provenance + checksums in the folder's `VENDORED.md`). Encodes the Field-Mode
  beam QR frames. 'QR Code' is a registered trademark of DENSO WAVE
  INCORPORATED.

## Sourcing note (this build environment)
The CC0 asset marketplaces (kaykit.itch.io, polyhaven.com, quaternius.com,
poly.pizza, jsDelivr) are **egress-blocked in the build container**;
`raw.githubusercontent.com` is reachable, so these CC0 assets are vendored from
GitHub-mirrored repositories (KayKit packs mirrored in open-source game repos;
Poly Haven HDRIs mirrored in the three.js examples). Only assets with a clear
CC0 / public-domain license are committed. Stars, the sun halo, glow cores, and
the toon gradient are still generated in code (no texture files needed).
