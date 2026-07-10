# Credits — third-party assets

**This build bundles no third-party binary assets.** Every visual is generated
in code: cel-shaded toon materials over primitive geometry, a code-built stepped
gradient ramp, code-built soft-round point sprites (stars, sun halo, glow
cores), and a vertex-coloured ground. Nothing is fetched at runtime; the game
ships as a static bundle and makes no network calls except the player's own
browser→`api.anthropic.com` Council requests (BYOK).

## Why procedural (and how to add authored art later)
The CC0 asset marketplaces (Quaternius, Kenney, Poly Haven, poly.pizza,
jsDelivr) are **egress-blocked in the build container**; `raw.githubusercontent.com`
is reachable. So richer authored geometry can be added one of two ways, both
constitution-safe (sanctioned services only, CC0 = commercial use / no
attribution required — we credit here by choice):

1. The operator drops a CC0 low-poly pack (KayKit / Kenney / Quaternius glTF)
   into `public/models/`, loaded via drei `useGLTF`.
2. A CC0 model is vendored from a GitHub-mirrored repo (three.js examples,
   Khronos glTF-Sample-Assets).

Any such addition must fit the canon fiction — the protagonist is the **cloaked
founder** (hood + scarf + staff, faceless-mysterious), never a stock humanoid
that breaks the world's register. Credit every vendored asset here with its
source and CC0 / public-domain / permissive-commercial license.
