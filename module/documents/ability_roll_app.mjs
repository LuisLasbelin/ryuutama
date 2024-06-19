class AbilityRollApp extends FormApplication {
    constructor(object, type, ability1, ability2, roll_bonuses = [], add_roll = "", add_roll_bonuses = []) {
        super();
        this.type = type;
        this.object = object;
        this.ability1 = ability1;
        this.ability2 = ability2;
        this.roll_bonuses = roll_bonuses;
        this.add_roll = add_roll;
        this.add_roll_bonuses = add_roll_bonuses;
        // Weapons have fixes ability rolls
        if (type == "weapon") {
            this.disabled_controls = true
        }
        else {
            this.disabled_controls = false
        }
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
            ability2: this.ability2,
            roll_bonuses: this.roll_bonuses
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _updateObject(event, formData) {
        console.log("Roll made with data:")
        console.log(formData)
        if (this.type == "weapon") {
            await this.weaponRoll(event, formData)
        }
        if (this.type == "ability") {
            await this.abilityRoll(event, formData)
        }
        return;
    }

    async abilityRoll(event, formData) {
        // Handle rolls that supply the formula directly.
        let label = `<h2>${game.i18n.localize(CONFIG.RYUUTAMA.abilityAbbreviations[formData.roll1])} + ${game.i18n.localize(CONFIG.RYUUTAMA.abilityAbbreviations[formData.roll2])}</h2>`;
        let roll_string = `d${this.object.system.abilities[formData.roll1].value}+d${this.object.system.abilities[formData.roll2].value}`
        // add all roll bonuses
        for (let bonus in formData.roll_bonuses) {
            roll_string += bonus.value
        }
        let roll = new Roll(roll_string, this.object.getRollData());
        await roll.evaluate();
        // Check for crits or fails
        label += this.checkForCrit(roll, this.object.system.abilities[formData.roll1].value, this.object.system.abilities[formData.roll2].value);

        roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.object }),
            flavor: label,
            rollMode: game.settings.get('core', 'rollMode'),
        });
        return roll;
    }

    async weaponRoll(event, formData) {
        // Attack roll
        let msg_content = `<h2>${this.object.actor.name} ${game.i18n.localize('RYUUTAMA.Item.Weapon.AttacksWith')} ${this.object.name}</h2>` + this.object.system.description;
        let attack_roll_string = `d${this.object.actor.system.abilities[this.ability1].value}+d${this.object.actor.system.abilities[this.ability2].value}`
        // Bonuses to attack
        const attack_roll = new Roll(attack_roll_string, this.object.getRollData());
        // Damage roll
        let damage_roll_string = `d${this.object.actor.system.abilities[this.add_roll].value}`
        // Bonuses to damage
        const damage_roll = new Roll(damage_roll_string, this.object.getRollData());
        // Invoke the roll and evaluate it to check for crits or blunders
        await damage_roll.evaluate()
        await attack_roll.evaluate()
        msg_content += this.checkForCrit(attack_roll, this.object.actor.system.abilities[this.ability1].value, this.object.actor.system.abilities[this.ability2].value)

        // Show the attack result on the chat
        msg_content += `<div class="roll-result">${attack_roll.total}</div>`
        // Get the evasion value of the main target and compare it to the roll to check if the attack hits
        let rolls_to_show = [attack_roll]
        if (game.user.targets.size > 0) { // the targets property is a Set
            game.user.targets.forEach(token => {
                // Check for any shields the target might have
                let dodge_value = 0
                if (token.document.actor.items) {
                    const items = token.document.actor.items.contents
                    for (let k in items) {
                        console.log(items[k])
                        if (items[k].type == "shield" && items[k].system.equiped == true) {
                            dodge_value = items[k].system.dodge
                        }
                    }
                }
                let target_evasion = Math.max(token.combatant.initiative, dodge_value)
                if (attack_roll.total >= target_evasion) {
                    msg_content += game.i18n.format(CONFIG.RYUUTAMA.dialogLabels["hit"], { target: token.document.name })
                    rolls_to_show.push(damage_roll) // add the damage roll to show it in the dice
                    msg_content += `<h2>${game.i18n.localize("RYUUTAMA.Item.Weapon.DamageRoll")}</h2><div class="damage-result">${damage_roll.total}</span></div>`
                }
                else {
                    if (dodge_value > token.combatant.initiative) msg_content += game.i18n.localize("RYUUTAMA.Dialog.blocked")
                    msg_content += game.i18n.format(CONFIG.RYUUTAMA.dialogLabels["miss"], { target: token.document.name })
                }
            });
        }

        let chatData = {
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            rolls: rolls_to_show,
            content: msg_content
        };
        ChatMessage.applyRollMode(chatData, "roll");
        ChatMessage.create(chatData);

        return;
    }

    /**
     * Gets a roll and data from it and checks if there is a critical or blunder
     * @param {*} roll an evaluated roll
     * @param {*} roll1_max
     * @param {*} roll2_max
     * @returns 
     */
    checkForCrit(roll, roll1_max, roll2_max) {
        if (roll.result[0] == roll1_max && results[4] == roll2_max) return game.i18n.localize(CONFIG.RYUUTAMA.dialogLabels["critical"]);
        if (roll.result[0] == 6 && roll.result[4] == 6) return game.i18n.localize(CONFIG.RYUUTAMA.dialogLabels["critical"]);
        if (roll.result[0] == 1 && roll.result[4] == 1) return game.i18n.localize(CONFIG.RYUUTAMA.dialogLabels["blunder"]);
        return ""
    }
}

export { AbilityRollApp }