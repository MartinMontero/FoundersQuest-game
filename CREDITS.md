# Credits — third-party assets

All bundled assets are **CC0 / public-domain** (commercial use, no attribution
required); credited here by choice, per the constitution's spirit. Nothing is
fetched at runtime — every asset ships in the static bundle, same-origin, so the
`default-src 'self'` CSP holds and no third-party service sits in any path.

## 3D models (glTF)
- **`public/models/rogue.glb`** — "Rogue (Hooded)" from **KayKit Adventurers**
  by Kay Lousberg. **CC0.** The player character (the hooded founder): rigged,
  with a full baked animation set (Idle, Walking, Running, Interact, …).
- **`public/models/pillar.glb`**, **`torch.glb`**, **`floor_tile.glb`** — from
  **KayKit Dungeon Remastered** by Kay Lousberg. **CC0.** Stone pillars serve as
  the shrine monuments; the others are set dressing.

## Environment / lighting
- **`public/hdr/venice_sunset_1k.hdr`** — HDRI from **Poly Haven**. **CC0.**
  Image-based lighting: real reflections + ambient on every PBR surface (the
  biggest realism lever per the premium-UI research).

## Textures (PBR)
- **`public/textures/ground/grassrock_*.jpg`** — "aerial_grass_rock" from
  **Poly Haven** (albedo + OpenGL normal + packed AO/rough/metal). **CC0.** The
  tiled plateau ground.

## Sourcing note (this build environment)
The CC0 asset marketplaces (kaykit.itch.io, polyhaven.com, quaternius.com,
poly.pizza, jsDelivr) are **egress-blocked in the build container**;
`raw.githubusercontent.com` is reachable, so these CC0 assets are vendored from
GitHub-mirrored repositories (KayKit packs mirrored in open-source game repos;
Poly Haven HDRIs mirrored in the three.js examples). Only assets with a clear
CC0 / public-domain license are committed. Stars, the sun halo, glow cores, and
the toon gradient are still generated in code (no texture files needed).
