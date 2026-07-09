# Premium UI/UX direction — deep-research findings (2026-07-08)

Evidence-based answer to "why does the game look MS-Paint-cheap and how do we fix
it." 106-agent deep-research run, claims adversarially verified (2/3 refutes kill).
Full transcript: workflow wf_a2397cca-8bd.

## The verdict (this is the important one)
**Procedural primitive geometry cannot be polished into a premium look.** The
one claim asserting that "juice/polish ALONE on unchanged primitive geometry
reaches a premium bar" was **REFUTED 0–3**. Three rounds of tuning cones,
spheres, and toon materials hit a hard ceiling because the ceiling is the
primitives themselves. Premium requires **authored assets + a post-processing
stack + game-feel juice, combined** — not any one alone, and not primitives.

## Ranked plan (impact per effort), all static-site / no-runtime-SaaS compatible

1. **Real CC0 glTF assets replace the hand-built primitives (path a).** *high confidence, 3-0.*
   Authored geometry is the single biggest quality jump. Sources (all CC0 =
   commercial use, no attribution): **Quaternius** (70+ packs / 2,500+ low-poly
   toon models incl. rigged/animated humanoids, nature, buildings), **Kenney**
   (40k+ assets), **Poly Haven** (CC0 models/textures/HDRIs), **Khronos
   glTF-Sample-Assets** (PBR + animated), **ambientCG**/**Texture Ninja** (PBR
   materials). Load via drei `useGLTF`, no format conversion. gltfjsx converts a
   glTF into a JSX component for easy material swaps.
   - **Environment note (verified this session):** the asset *websites*
     (quaternius.com, kenney.nl, polyhaven, poly.pizza, jsDelivr) are **egress-
     blocked (403/000)** in this build container — BUT **raw.githubusercontent.com
     is reachable (HTTP 200)** and serves real glTF/GLB (confirmed: a 2.1 MB
     rigged animated character + the Khronos Fox.glb). So assets come in via
     **GitHub-mirrored CC0 repos** (or the operator drops packs into the repo).
2. **Cinematic post-processing stack.** *high confidence, 3-0.* `@react-three/postprocessing`
   over `pmndrs/postprocessing` (MIT/Zlib) — Bloom, Depth of Field, SSAO, **LUT
   color grading**, ACES Tone Mapping, Vignette, God Rays, Outline via
   `<EffectComposer>`. `EffectPass` merges the whole chain into ONE fullscreen
   compound shader (performant; single screen triangle, HalfFloat HDR, WebGL2
   MSAA). Already partially installed. Color grading + DoF + SSAO are the biggest
   "cheap→cinematic" levers with zero new art.
3. **Matcap / material upgrades.** *high, 3-0.* `MeshMatcapMaterial` with a baked
   matcap texture instantly reads as sculpted/lit vs flat toon. Rim light,
   fresnel, baked AO, vertex color, fog, gradient ramps done right.
4. **Zero-art "game feel" / juice.** *high, 3-0 (but juice-alone REFUTED).*
   Screen shake on impactful actions, hit-pause/hitstop (freeze 1–few frames),
   exaggerated oversized high-contrast feedback ("games are not real life").
   Code-only in the render/timing/camera loop. Multiplies the above — never a
   substitute for real geometry.

## Honest gaps in the research
- **exploreone.games (the operator's benchmark) could NOT be analyzed** — no
  claims about it survived verification, and it is **egress-blocked (403)** from
  this container, so I cannot fetch/see it. The style TARGET is still undefined
  from my side. Operator screenshots of it are required to aim the direction.
- Named "premium exemplar" sites likewise didn't survive verification.

## The strategic fork the research surfaces (needs an operator decision)
Path (a) = keep the walkable 3D world but swap primitives → real CC0 assets +
post-processing (executable here now via GitHub-raw assets). Path (b/c) = the
premium comes instead from a gorgeous **2D/DOM-designed interface** over a
restrained 3D backdrop — often the faster route to "premium" for a
writing/reflection-centric product with no art budget. Deciding between these
needs the benchmark (exploreone.games) in view.

## Constraint flags
- Everything above ships in a static Cloudflare Pages build; no third-party
  runtime service. CC0 = safe to ship commercially, no attribution required
  (we still credit in CREDITS by choice).
- Assets must be fetched via reachable hosts (GitHub raw) or provided by the
  operator; the asset marketplaces themselves are blocked in this environment.
