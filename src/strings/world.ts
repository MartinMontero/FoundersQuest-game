// src/strings/world.ts — 3D-world chrome copy (prompt chips, monument names,
// shell text). This is UI chrome ONLY: question and Council text stay in
// questions.ts / council.ts, byte-matched to canon 03/04 — nothing here
// duplicates or alters canon strings. Components import from src/strings;
// no player-facing string literals live in any component.

export const WORLD_COPY = {
  /** app shell */
  appTitle: "Founder's Quest",
  bootStatus: 'Stage 1 — grey-box slice',
  /** accessible name for the 3D canvas region */
  worldName: 'The Swirling Nebula',
  /** shown from mount until the world's first rendered frame */
  loading: 'the nebula gathers…',
  /** honest failure copy for the top-level error boundary — no blame, no jargon */
  crashed:
    'The world failed to hold together. Nothing you inscribed is lost — your record stays on this device. Reload to return to the nebula.',
  reload: 'Reload the world',

  /** monument name chips */
  vaultName: 'The Vault',
  vaultSealedLine: 'Sealed until Stage 3',
  registryName: 'The Assumption Registry',
  campfireName: 'The Campfire',
  arenaName: 'The Proving Circle',
  egoGateName: 'The Launch Threshold',

  /** interaction prompt chips ("E — kneel" is the game-design §2 F0 chip) */
  prompts: {
    shrine: 'E — kneel',
    vault: 'E — behold the Vault',
    registry: 'E — open the Registry',
    flagpoleRaise: 'E — raise the flag',
    flagpoleLower: 'E — lower the flag',
    portal: 'E — travel',
    campfire: 'E — rest at the campfire',
    arena: 'E — step into the circle',
    ego: 'E — face what waits',
    landmark: 'E — take it in',
  },

  /** the landmark's chip name + its one lore line per world (2-8; W1 composes
   *  its own world and has no set-piece stage) */
  landmarkName: 'The Landmark',
  landmarks: {
    2: {
      name: 'The Fellowship Circle',
      line: 'The Raven gathered the first listeners here. Research is a fire others sit down at — ask, then let the silence work.',
    },
    3: {
      name: 'The Forge Pyre',
      line: 'The Phoenix burns the first draft on purpose. A prototype exists to be fed to the fire — build the cheapest thing that can teach you.',
    },
    4: {
      name: 'The Maze Gate',
      line: 'The Labyrinth is walked one hypothesis at a time. Write what would make you stop BEFORE anything runs — then trust the wall you hit.',
    },
    5: {
      name: 'The Mirror Causeway',
      line: 'The Mirror shows the numbers exactly as they are. Feedback is weather, not verdict — read it, record it, and answer with a decision.',
    },
    6: {
      name: "The Sculptor's Bench",
      line: 'The Sculptor removes everything that is not the product. Refinement is subtraction — what users actually do is the chisel.',
    },
    7: {
      name: 'The Span',
      line: 'The Bridge is crossed one paying customer at a time. Implementation is a walk you take WITH someone — count real crossings only.',
    },
    8: {
      name: 'The Launch Pad',
      line: 'The Rocket lifts on evidence, not fumes. Everything you verified is fuel; everything you assumed is weight. Cut weight.',
    },
  } as Readonly<Record<number, { name: string; line: string }>>,

  /** path-portal chip labels — composed with the destination world name */
  portalOnward: 'Onward',
  portalBack: 'Back',
  /** named-loop toll-portal chip label — composed with the loop's name (03) */
  portalLoop: 'Loop',
} as const
