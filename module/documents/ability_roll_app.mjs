class AbilityRollApp extends FormApplication {

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
            color: 'red',
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
        if (formData.roll_mod == null) formData.roll_mod = 0; // For errors
        let roll_string = `d${this.object.system.abilities[formData.roll1].value}+d${this.object.system.abilities[formData.roll2].value}+${formData.roll_mod}`
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
        let results = roll.result.split("+")
        if (results[0] == this.object.system.abilities[formData.roll1].value && results[1] == this.object.system.abilities[formData.roll2].value) return 1;
        if (results[0] == 6 && results[1] == 6) return 1;
        if (results[0] == 1 && results[1] == 1) return -1;
    }
}

export { AbilityRollApp }