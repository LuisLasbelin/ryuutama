import { AbilityRollApp } from '../documents/ability_roll_app.mjs'


/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class RyuutamaItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @override
   */
  getRollData() {
    // Starts off by populating the roll data with `this.system`
    const rollData = { ...super.getRollData() };

    // Quit early if there's no parent actor
    if (!this.actor) return rollData;

    // If present, add the actor's roll data
    rollData.actor = this.actor.getRollData();

    return rollData;
  }

  /**
   * Checks if the roll is a crit of a fail
   * @param {roll} roll in array format
   * @param {Number} roll1_max 
   * @param {Number} roll2_max 
   * @returns string
   */
  checkForCrit(roll, roll1_max, roll2_max) {
    if (roll.result[0] == roll1_max && roll.result[4] == roll2_max) return game.i18n.localize(CONFIG.RYUUTAMA.dialogLabels["critical"]);
    if (roll.result[0] == 6 && roll.result[4] == 6) return game.i18n.localize(CONFIG.RYUUTAMA.dialogLabels["critical"]);
    if (roll.result[0] == 1 && roll.result[4] == 1) return game.i18n.localize(CONFIG.RYUUTAMA.dialogLabels["blunder"]);
    return ""
  }

  /**
   * Handle clickable rolls from items.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');

    // If it is a weapon with an attack
    if (item.type === "weapon") {
      const rollData = this.getRollData();
      let roll_bonuses = []
      if (rollData.attack_formula.diceBonus != 0) roll_bonuses.push({name: game.i18n.localize("RYUUTAMA.Item.Weapon.WeaponBonus"), value: rollData.attack_formula.diceBonus})
      return new AbilityRollApp(item, item.type, rollData.attack_formula.roll1, rollData.attack_formula.roll2, roll_bonuses, rollData.damage_formula.roll1).render(true);
    } // if it is a feature / skill
    if (item.type === "feature") {
      const rollData = this.getRollData();
      let label = `<h2>${item.actor.name} ${game.i18n.localize('RYUUTAMA.Item.Feature.Uses')} ${item.name}</h2>` + item.system.description;
      let roll_string = `d${item.actor.system.abilities[rollData.formula.roll1].value}+d${item.actor.system.abilities[rollData.formula.roll2].value}`
      if (rollData.formula.diceBonus != 0) roll_string += `+${rollData.formula.diceBonus}`
      const roll = new Roll(roll_string, rollData);
      await roll.evaluate()
      label += this.checkForCrit(roll, item.actor.system.abilities[rollData.formula.roll1].value, item.actor.system.abilities[rollData.formula.roll2].value)
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      })
      return;
    } // if spells
    if (item.type === "spell") {
      // Add descriptors to the content
      const label = `<h2>${item.name}</h2>` + item.system.description + `
      <div><img style="filter: invert(100%);" src="icons/svg/aura.svg" width="12px" height="12px"/> <b>${game.i18n.localize('RYUUTAMA.Item.Spell.Cost')}</b> : ${item.system.cost}</div>
      <div><img style="filter: invert(100%);" src="icons/svg/clockwork.svg" width="12px" height="12px"/> <b>${game.i18n.localize('RYUUTAMA.Item.Spell.Duration')}</b> : ${item.system.duration}</div>
      <div><img style="filter: invert(100%);" src="icons/svg/target.svg" width="12px" height="12px"/> <b>${game.i18n.localize('RYUUTAMA.Item.Spell.Target')}</b> : ${item.system.target}</div>
      <div><img style="filter: invert(100%);" src="icons/svg/stone-path.svg" width="12px" height="12px"/> <b>${game.i18n.localize('RYUUTAMA.Item.Spell.Distance')}</b> : ${item.system.distance}</div>
      `
      if (item.system.isRoll) {
        const rollData = this.getRollData();
        let roll_string = ""
        if (rollData.formula.roll1 != "0") roll_string += `d${item.actor.system.abilities[rollData.formula.roll1].value}`
        if (rollData.formula.roll2 != "0") roll_string += `+d${item.actor.system.abilities[rollData.formula.roll2].value}`
        if (rollData.formula.bonusDice != 0) roll_string += `+${rollData.formula.diceBonus}`
        const roll = new Roll(roll_string, rollData);
        await roll.evaluate()
        roll.toMessage({
          speaker: speaker,
          rollMode: rollMode,
          flavor: label,
        })
        return
      }
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        content: label
      });
      return;
    } // if there is no roll just show the item
    ChatMessage.create({
      speaker: speaker,
      rollMode: rollMode,
      flavor: `<h2>${item.name}</h2>`,
      content: item.system.description ?? ''
    });
    return;
  }
}
