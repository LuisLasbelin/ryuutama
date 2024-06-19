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