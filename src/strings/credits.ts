// src/strings/credits.ts — the in-game attribution page (backlog E-11). Every
// fact here mirrors its on-record source: CREDITS.md at the repo root (the
// bundled assets) and src/vendor/qrcode-generator/VENDORED.md (the one vendored
// code dependency). Change those files first; this one follows in the same
// commit. All assets are CC0 — credited by choice, per the constitution's
// spirit. The vendored code is MIT, NOT CC0, and the code section says so.

/** one credited item — an asset (file or pack) or a vendored package */
export interface CreditEntry {
  /** what it is, by the name its source gives it */
  readonly name: string
  /** the pack, site, or registry it came from */
  readonly source: string
  /** the person behind it, where the source names one */
  readonly author?: string
  /** the row's license token (CC0, MIT, or "none" where nothing ships) */
  readonly license: string
  /** what it does in the game, plainly */
  readonly role: string
}

/** section keys in display order — the panel maps over this list */
export const CREDIT_SECTIONS = ['models', 'environment', 'textures', 'audio', 'code'] as const

export type CreditSectionKey = (typeof CREDIT_SECTIONS)[number]

/**
 * One provenance line per row. The joiner lives here — components render
 * strings, they never compose them.
 */
export function creditProvenance(entry: CreditEntry): string {
  return entry.author ? `${entry.source} — ${entry.author}` : entry.source
}

export const CREDITS = {
  title: 'Credits',

  /** the CREDITS.md promise, one line */
  intro:
    'Everything below ships inside the game bundle — nothing is fetched at runtime. The assets are all CC0 (public domain, no attribution required); they are credited here by choice.',

  /** section headings — asset headings mirror CREDITS.md's */
  headings: {
    models: '3D models (glTF)',
    environment: 'Environment / lighting',
    textures: 'Textures (PBR)',
    audio: 'Audio',
    code: 'Vendored code',
  },

  sections: {
    /** CREDITS.md "3D models (glTF)" */
    models: [
      {
        name: 'Rogue (Hooded)',
        source: 'KayKit Adventurers',
        author: 'Kay Lousberg',
        license: 'CC0',
        role: 'The player character — the hooded founder. Rigged, with a full baked animation set.',
      },
      {
        name: 'Stone pillar',
        source: 'KayKit Dungeon Remastered',
        author: 'Kay Lousberg',
        license: 'CC0',
        role: 'The pillars that serve as the shrine monuments.',
      },
      {
        name: 'Common Tree set',
        source: 'Ultimate Nature Pack',
        author: 'Quaternius',
        license: 'CC0',
        role: 'The scattered trees, with their bark and leaf textures.',
      },
      {
        name: 'Rock set',
        source: 'Low-poly nature packs',
        author: 'Quaternius',
        license: 'CC0',
        role: 'The sculpted boulders across every world.',
      },
      {
        name: 'Bonfire',
        source: 'Survival Pack',
        author: 'Quaternius',
        license: 'CC0',
        role: 'The campfire log pile and flame.',
      },
      {
        name: 'Banners, torch, candles, chests',
        source: 'KayKit Dungeon Remastered',
        author: 'Kay Lousberg',
        license: 'CC0',
        role: 'Cloth banners, small fire-light props, and the Vault\u2019s sealed chest.',
      },
      {
        name: 'Pigeon (recolored)',
        source: 'Ultimate Monsters',
        author: 'Quaternius',
        license: 'CC0',
        role: 'The Cartographer’s raven — recolored crow-black; no CC0 corvid model exists, said plainly.',
      },
    ],

    /** CREDITS.md "Environment / lighting" */
    environment: [
      {
        name: 'Venice sunset HDRI',
        source: 'Poly Haven',
        license: 'CC0',
        role: 'Image-based lighting — real reflections and ambient light on every surface.',
      },
    ],

    /** CREDITS.md "Textures (PBR)" */
    textures: [
      {
        name: 'aerial_grass_rock',
        source: 'Poly Haven',
        license: 'CC0',
        role: 'The tiled plateau ground — albedo, normal, and packed AO/rough/metal maps.',
      },
    ],

    /** honest line (see src/strings/audio.ts): synthesized on-device, no files */
    audio: [
      {
        name: 'All sound',
        source: 'Synthesized in code (WebAudio)',
        license: 'none',
        role: 'Every sound is procedural, generated on your device while you play. No audio files ship, so there is nothing to license.',
      },
    ],

    /** src/vendor/qrcode-generator/VENDORED.md */
    code: [
      {
        name: 'qrcode-generator 2.0.4',
        source: 'npm, vendored at src/vendor/qrcode-generator',
        author: 'Kazuhiko Arase',
        license: 'MIT',
        role: 'QR encode side of the Field-Mode beam — draws the code the phone displays.',
      },
    ],
  },

  /** the one entry that is not CC0 — said plainly, per VENDORED.md */
  codeNote:
    'This is the one entry that is not CC0. It is MIT-licensed: free to use, but the copyright notice — Copyright (c) 2009 Kazuhiko Arase — must stay with the code. It does, in the vendored file’s header.',

  /** required trademark line, verbatim from VENDORED.md */
  trademarkNote: "'QR Code' is a registered trademark of DENSO WAVE INCORPORATED.",

  close: 'Close',
} as const satisfies {
  title: string
  intro: string
  headings: Readonly<Record<CreditSectionKey, string>>
  sections: Readonly<Record<CreditSectionKey, readonly CreditEntry[]>>
  codeNote: string
  trademarkNote: string
  close: string
}
