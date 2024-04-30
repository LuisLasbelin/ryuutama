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
    if (!this.system.attack_formula) {
      const label = `<h2>${item.name}</h2>`;
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? '',
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();
      const attack_label = `<h2>${this.actor.name} ${game.i18n.localize('RYUUTAMA.Item.Weapon.AttacksWith')} ${item.name}</h2>`;
      let attack_roll_string = `d${this.actor.system.abilities[rollData.attack_formula.roll1].value}+d${this.actor.system.abilities[rollData.attack_formula.roll2].value}+${rollData.attack_formula.diceBonus}`
      const attack_roll = new Roll(attack_roll_string, rollData);
      const damage_label = `<h2>${item.name} ${game.i18n.localize('RYUUTAMA.Item.Weapon.DamageDealt')}</h2>`;
      let damage_roll_string = `d${this.actor.system.abilities[rollData.damage_formula.roll1].value}+${rollData.damage_formula.diceBonus}`
      const damage_roll = new Roll(damage_roll_string, rollData);
      // Invoke the roll and submit it to chat.
      await damage_roll.evaluate()
      await attack_roll.evaluate()
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
    }
  }
}
