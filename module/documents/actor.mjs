/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class RyuutamaActor extends Actor {
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
    // Set the ability values
    this.update({
      system: {
        abilities: {
          Str: {
            value: this.system.abilities.Str.base + this.system.abilities.Str.mod
          },
          Dex: {
            value: this.system.abilities.Dex.base + this.system.abilities.Dex.mod
          },
          Int: {
            value: this.system.abilities.Int.base + this.system.abilities.Int.mod
          },
          Spi: {
            value: this.system.abilities.Spi.base + this.system.abilities.Spi.mod
          }
        }
      }
    })
  }

  /**
   * @override
   * Augment the actor source data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.ryuutama || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== "character") return;
    // Make modifications to data here. For example:
    const systemData = actorData.system;

    // Values for max hp and max mp
    this.update({
      system: {
        hitpoints: {
          max: this.system.abilities.Str.value * 2 + this.system.hitpoints.mod
        },
        mindpoints: {
          max: this.system.abilities.Spi.value * 2 + this.system.mindpoints.mod
        },
        load: {
          max: this.system.abilities.Str.value + 3 + this.system.load.mod
        }
      }
    })

    // Add modifiers for each status effect
    if (systemData.health.value < systemData.status.wounded) {
      systemData.abilities.Str.mod -= 2;
    }
    if (systemData.health.value < systemData.status.poisoned) {
      systemData.abilities.Dex.mod -= 2;
    }
    if (systemData.health.value < systemData.status.dizzy) {
      systemData.abilities.Int.mod -= 2;
    }
    if (systemData.health.value < systemData.status.fatigued) {
      systemData.abilities.Spi.mod -= 2;
    }
    if (systemData.health.value < systemData.status.ill || systemData.health.value < systemData.status.shocked) {
      systemData.abilities.Spi.mod -= 2;
      systemData.abilities.Dex.mod -= 2;
      systemData.abilities.Str.mod -= 2;
      systemData.abilities.Int.mod -= 2;
    }

    if (systemData.archetype == "offensive") {
      systemData.hitpoints.mod += 4
    }
    if (systemData.archetype == "tech") {
      systemData.load.mod += 3
      systemData.techInitiative = 1
    }
    if (systemData.archetype == "magical") {
      systemData.mindpoints.mod += 4
    }

    // Check other modifiers
    actorData.items.forEach(element => {
      if (element.type == "feature") {
        if (element.system.has_roll == false) {
          if (element.system.passive.target.includes("@robust")) {
            systemData.load.mod += 3
          }
        }
      }
    });

    // Level
    const levels_exp = CONFIG.RYUUTAMA.levels
    for (let l = 0; l < levels_exp.length - 1; l++) {
      if (systemData.attributes.level.exp < levels_exp[l + 1]) {
        systemData.attributes.level.value = l
        break;
      }
    }

    // Apply new modifiers
    systemData.load.max += systemData.load.mod
    systemData.hitpoints.max += systemData.hitpoints.mod
    systemData.mindpoints.max += systemData.mindpoints.mod
    systemData.health.value = systemData.health.base + systemData.health.mod

    // When positive health add to one ability mod, this modifier must not affect other calculations
    if (systemData.health.value > 9) {
      systemData.abilities[systemData.health.ability].mod += 2
    }

    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, ability] of Object.entries(systemData.abilities)) {
      // Set the total clamped between 4 and 12
      ability.value = Math.min(Math.max(ability.base + ability.mod, 4), 12);
    }
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== "npc") return;
    // Make modifications to data here. For example:
    const systemData = actorData.system;
    systemData.xp = systemData.cr * systemData.cr * 100;
  }


  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // Starts off by populating the roll data with `this.system`
    const data = { ...super.getRollData() };

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@Str.mod + 4`.
    if (data.abilities) {
      for (let [k, v] of Object.entries(data.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    // Add level for easier access, or fall back to 0.
    if (data.attributes.level) {
      data.lvl = data.attributes.level.value ?? 0;
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }

  _updateArchetype(archetype) {
    this.update({
      system: {
        archetype: archetype
      }
    })
  }

  _updateAbilities(abilities) {
    this.update({
      system: {
        abilities: abilities
      }
    })
  }

  damage(amount) {
    this.update({
      system: {
        hitpoints: {
          value: this.system.hitpoints.value - amount
        }
      }
    })
  }
}
