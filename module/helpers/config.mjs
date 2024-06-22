export const RYUUTAMA = {};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
RYUUTAMA.abilities = {
  Str: 'RYUUTAMA.Ability.Str.long',
  Dex: 'RYUUTAMA.Ability.Dex.long',
  Int: 'RYUUTAMA.Ability.Int.long',
  Spi: 'RYUUTAMA.Ability.Spi.long',
};

RYUUTAMA.abilityAbbreviations = {
  Str: 'RYUUTAMA.Ability.Str.abbr',
  Dex: 'RYUUTAMA.Ability.Dex.abbr',
  Int: 'RYUUTAMA.Ability.Int.abbr',
  Spi: 'RYUUTAMA.Ability.Spi.abbr',
};

RYUUTAMA.dialogLabels = {
  critical: `RYUUTAMA.Dialog.critical`,
  blunder: `RYUUTAMA.Dialog.blunder`,
  hit: 'RYUUTAMA.Dialog.hit',
  miss: 'RYUUTAMA.Dialog.miss',
}

RYUUTAMA.archetypes = {
  offensive: 'RYUUTAMA.Offensive',
  tech: 'RYUUTAMA.Tech',
  magical: 'RYUUTAMA.Magical'
}

RYUUTAMA.terrains = {
  barren: 6,
  prairie: 6,
  forest: 8,
  hill: 8,
  rocky: 8,
  primordial: 10,
  swamp: 10,
  mountain: 10,
  desert: 12,
  jungle: 12,
  peaks: 14
}

RYUUTAMA.climates = {
  sun: 0,
  cloud: 0,
  drizzle: 1,
  wind: 1,
  lightfog: 1,
  hot: 1,
  cold: 1,
  rain: 3,
  snow: 3,
  fog: 3,
  dark: 3,
  storm: 5,
  blizzard: 5
}