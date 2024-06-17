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
    console.log("Roll result: ", roll.result[0] == roll1_max, roll.result[4] == roll2_max)
    if (roll.result[0] == roll1_max && roll.result[4] == roll2_max) return `<h3>CRITICAL ╰(*°▽°*)╯</h3>`;
    if (roll.result[0] == 6 && roll.result[4] == 6) return `<h3>CRITICAL ╰(*°▽°*)╯</h3>`;
    if (roll.result[0] == 1 && roll.result[4] == 1) return `<h3>FAIL (。﹏。*)</h3>`;
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

    // If there's no attack formula, send a chat message.
    if (item.type === "weapon") {
      // Retrieve roll data.
      const rollData = this.getRollData();
      let attack_label = `<h2>${item.actor.name} ${game.i18n.localize('RYUUTAMA.Item.Weapon.AttacksWith')} ${item.name}</h2>` + item.system.description;
      let attack_roll_string = `d${item.actor.system.abilities[rollData.attack_formula.roll1].value}+d${item.actor.system.abilities[rollData.attack_formula.roll2].value}`
      if (rollData.attack_formula.diceBonus) attack_roll_string += `+${rollData.attack_formula.diceBonus}`
      const attack_roll = new Roll(attack_roll_string, rollData);
      const damage_label = `<h2>${item.name} ${game.i18n.localize('RYUUTAMA.Item.Weapon.DamageDealt')}</h2>`;
      let damage_roll_string = `d${item.actor.system.abilities[rollData.damage_formula.roll1].value}`
      if (rollData.damage_formula.diceBonus != 0) damage_roll_string += `+${rollData.damage_formula.diceBonus}`
      const damage_roll = new Roll(damage_roll_string, rollData);
      // Invoke the roll and submit it to chat.
      await damage_roll.evaluate()
      await attack_roll.evaluate()
      attack_label += this.checkForCrit(attack_roll, item.actor.system.abilities[rollData.attack_formula.roll1].value, item.actor.system.abilities[rollData.attack_formula.roll2].value)
      attack_roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: attack_label,
      })
      damage_roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: damage_label,
      })
      return;
    } // if has attack
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
    } // if has a formula from features
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
    } // if spell
    ChatMessage.create({
      speaker: speaker,
      rollMode: rollMode,
      flavor: `<h2>${item.name}</h2>`,
      content: item.system.description ?? ''
    });
    return;
  }
}
