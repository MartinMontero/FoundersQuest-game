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

  /** monument name chips */
  vaultName: 'The Vault',
  vaultSealedLine: 'Sealed until Stage 3',
  registryName: 'The Assumption Registry',

  /** interaction prompt chips ("E — kneel" is the game-design §2 F0 chip) */
  prompts: {
    shrine: 'E — kneel',
    vault: 'E — behold the Vault',
    registry: 'E — open the Registry',
    flagpoleRaise: 'E — raise the flag',
    flagpoleLower: 'E — lower the flag',
  },
} as const
