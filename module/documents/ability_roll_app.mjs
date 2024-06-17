class AbilityRollApp extends FormApplication {
    constructor(object, ability1, ability2) {
        super();
        this.object = object;
        this.ability1 = ability1;
        this.ability2 = ability2;
      }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ['form'],
            popOut: true,
            template: `systems/ryuutama/templates/applications/ability-roll.hbs`,
            id: 'ability_roll',
            title: 'Ability Roll'
        });
    }

    getData() {
        // Send data to the template
        return {
            ability1: this.ability1,
            ability2: this.ability2
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _updateObject(event, formData) {
        // make the roll
        console.log(formData)
        // Handle rolls that supply the formula directly.
        let label = `<h2>${game.i18n.localize(CONFIG.RYUUTAMA.abilityAbbreviations[formData.roll1])} + ${game.i18n.localize(CONFIG.RYUUTAMA.abilityAbbreviations[formData.roll2])}</h2>`;
        let roll_string = `d${this.object.system.abilities[formData.roll1].value}+d${this.object.system.abilities[formData.roll2].value}`
        if (formData.roll_mod != null) roll_string += `+${formData.roll_mod}`
        let roll = new Roll(roll_string, this.object.getRollData());
        await roll.evaluate();
        // Check for crits or fails
        let crit = this.checkForCrit(roll, formData);
        if (crit > 0) label += `<h3>CRITICAL ╰(*°▽°*)╯</h3>`;
        if (crit < 0) label += `<h3>FAIL (。﹏。*)</h3>`;

        roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.object }),
            flavor: label,
            rollMode: game.settings.get('core', 'rollMode'),
        });
        return roll;
    }

    checkForCrit(roll, formData) {
        if (roll.result[0] == this.object.system.abilities[formData.roll1].value && results[4] == this.object.system.abilities[formData.roll2].value) return 1;
        if (roll.result[0] == 6 && roll.result[4] == 6) return 1;
        if (roll.result[0] == 1 && roll.result[4] == 1) return -1;
        return 0
    }
}

export { AbilityRollApp }