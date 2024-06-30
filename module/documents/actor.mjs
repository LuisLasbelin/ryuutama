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
    this._prepareLoad(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== "character") return;
    // Make modifications to data here. For example:
    const systemData = actorData.system;

    // Values for max hp and max mp
    systemData.hitpoints.max = this.system.abilities.Str.value * 2
    systemData.hitpoints.value = Math.min(systemData.hitpoints.value, systemData.hitpoints.max) // avoid over max
    systemData.mindpoints.max = this.system.abilities.Spi.value * 2
    systemData.mindpoints.value = Math.min(systemData.mindpoints.value, systemData.mindpoints.max) // avoid over max
    systemData.load.max = this.system.abilities.Str.value + 3

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

    // Reset the armor handicap value just in case to avoid accumulating
    systemData.armorHandicap = 0
    // Check other modifiers
    actorData.items.forEach(element => {
      if (element.type == "feature") {
        if (element.system.has_roll == false) {
          if (element.system.passive.target.includes("@robust")) {
            systemData.load.mod += 3
          }
        }
      }
      if (element.type == "container") {
        systemData.load.mod += element.system.capacity
      }
      if (["armor", "shield"].includes(element.type)) {
        // Apply initiative penalty
        systemData.armorHandicap += element.system.handicap
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

    // Default initiative roll
    systemData.initiative = `d${systemData.abilities.Dex}+d${systemData.abilities.Spi}+${systemData.techInitiative}-${systemData.armorHandicap}`

    // Prepare defense value
    // Iterate through items, calculate total defense for characters
    let total_defense = 0;
    actorData.items.forEach(element => {
      if (element.type === "armor") {
        if (element.system.equiped) total_defense += element.system.defense
      }
      if (element.type === "shield") {
        if (element.system.equiped) total_defense += element.system.defense
      }
    });
    systemData.defense = total_defense;
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
   * Calculate the current load value from items
   * @param {*} actorData 
   */
  _prepareLoad(actorData) {
    const systemData = actorData.system;

    let total_load = 0;
    actorData.items.forEach(i => {
      console.log(i)
      if (i.system.size > 0) {
        // Only if the items has a size
        let item_size = i.system.size
        // if is stackable then multiply by the quantity
        if (i.system.quantity > 0) item_size *= i.system.quantity
        if (!i.system.equiped) {
          // if the item is NOT equiped (or can't equip it), add its size
          total_load += i.system.size;
        }
      }
    });
    console.log(systemData)
    systemData.load.value = total_load;
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
