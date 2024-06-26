class AbilityRollApp extends FormApplication {
    constructor(actor, object, type, ability1, ability2, roll_bonuses = [], add_roll = "", add_roll_bonuses = []) {
        super();
        this.type = type;
        this.actor = actor;
        this.object = object;
        this.ability1 = ability1;
        this.ability2 = ability2;
        this.roll_bonuses = roll_bonuses;
        this.add_roll = add_roll;
        this.add_roll_bonuses = add_roll_bonuses;
        // Weapons have fixes ability rolls
        if (type == "weapon") {
            this.disabled_controls = true
            this.trainedWeapon = this._checkTrainedWithWeapon()
        }
        else {
            this.disabled_controls = false
        }
        if (actor.system.mindpoints.value < 1 || type == "health") this.disabled_focus = true
        else this.disabled_focus = false
        if (actor.system.blunderPoints < 1 || type == "health") this.disabled_blunder = true
        else this.disabled_blunder = false

        this._updatePassiveModifiers()
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

    /**
     * Checks for passive modifiers on the actor to add to the roll
     */
    _updatePassiveModifiers() {
        if (["weapon"].includes(this.type)) {
            // If the actor is offensive archetype, add +1 to damage
            if (this.actor.system.archetype == "offensive") {
                this.add_roll_bonuses.push(new RollBonus("offensivedamage", game.i18n.localize("RYUUTAMA.Dialog.OffensiveBonus"), "+1"))
            }
        }
        if (this.type == "health") {
            this.actor.items.forEach(element => {
                if (element.type == "feature") {
                    if (element.system.has_roll == false) {
                        if (element.system.passive.target.includes("@robust")) {
                            // Robust characters add +1 to health rolls
                            this.roll_bonuses.push(new RollBonus(
                                "robust",
                                game.i18n.localize('RYUUTAMA.Robust'),
                                "+1"
                            ))
                        }
                    }
                }
            });
        }
        if (["ability", "marching", "orientating", "camping"].includes(this.type)) {
            this.actor.items.forEach(element => {
                if (element.type == "feature") {
                    if (element.system.has_roll == false) {
                        if (element.system.passive.target.includes("@specialist")) {
                            // split the string to get the speciality
                            const passive_target = element.system.passive.target.split("@")
                            // if the actor is specialized add the option to add +2 to the roll
                            this.roll_bonuses.push(new RollBonus(
                                "specialist",
                                game.i18n.format('RYUUTAMA.SpecializedIn', { target: game.i18n.localize("RYUUTAMA.TerrainAndClimate." + passive_target[2]) }),
                                element.system.passive.value,
                                true,
                                passive_target[2]
                            ))
                        }
                        if (element.system.passive.target.includes("@travel") && ["marching", "orientating", "camping"].includes(this.type)) {
                            // found the actor is trained in that weapon
                            // Bards add +1 to all travel rolls
                            this.roll_bonuses.push(new RollBonus("travel", game.i18n.localize('RYUUTAMA.TravelTrained'), element.system.passive.value))
                        }
                        if (element.system.passive.target.includes("@eloquence")) {
                            this.roll_bonuses.push(new RollBonus("eloquence", game.i18n.localize('RYUUTAMA.Eloquence'), element.system.passive.value, true))
                        }
                    }
                }
            });
        }
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
        // Enable de cheboxes if they have enough resources
        if (!this.disabled_blunder) html.find('#blunder').removeAttr("disabled")
        if (!this.disabled_focus) html.find('#focus').removeAttr("disabled")
    }

    async _updateObject(event, formData) {
        // Get the misc mod and add it to the roll bonuses
        if (formData.miscmod.length > 0) {
            this.roll_bonuses.push(new RollBonus("misc", game.i18n.localize("RYUUTAMA.MiscMod"), formData.miscmod))
        }
        if (this.type == "weapon") {
            await this.weaponRoll(event, formData)
        }
        if (["ability", "marching", "orientating", "camping", "health"].includes(this.type)) {
            await this.abilityRoll(event, formData)
        }
        return;
    }

    /**
     * Modifies MP and adds focus bonus
     * @returns string for chat message with data
     */
    _useFocus(formData) {
        let final_label = ""
        if (formData.focus == true) {
            this.roll_bonuses.push(new RollBonus("focus", game.i18n.localize("RYUUTAMA.Focus"), "+1", Math.ceil(this.actor.system.mindpoints.value / 2)))
            // Consume half the MP
            this.actor.update({
                system: {
                    mindpoints: {
                        value: this.actor.system.mindpoints.value - Math.ceil(this.actor.system.mindpoints.value / 2)
                    }
                }
            })
        }
        if (formData.blunder == true) {
            this.roll_bonuses.push(new RollBonus("blunderpoint", game.i18n.localize("RYUUTAMA.BlunderPoint"), "+1", this.actor.system.blunderPoints))
            // Consume half the MP
            this.actor.update({
                system: {
                    blunderPoints: this.actor.system.blunderPoints - 1
                }
            })
        }
        if (formData.focus || formData.blunder) {
            // If the actor is tech archetype, add +1 to the attack roll
            if (this.actor.system.archetype == "tech") {
                this.roll_bonuses.push(new RollBonus("techfocus", game.i18n.localize("RYUUTAMA.TechFocus"), "+1"))
            }
        }
        return final_label
    }

    _checkTrainedWithWeapon() {
        const used_weapon_type = this.object.system.type // string with the weapon type
        let trained_weapons = []
        // loop through all the passsive skills to search for @trainedweapon
        this.actor.items.forEach(element => {
            if (element.type == "feature") {
                if (element.system.has_roll == false) {
                    if (element.system.passive.target.includes("@trainedweapon")) {
                        // split the string to get the weapon
                        const passive_target = element.system.passive.target.split("@")
                        if (passive_target[2] == used_weapon_type) {
                            // found the actor is trained in that weapon
                            // if the actor is trained in the same weapon 2 times it adds +1 to attack roll
                            if (trained_weapons.includes(passive_target[2])) {
                                this.roll_bonuses.push(new RollBonus("trained", game.i18n.localize("RYUUTAMA.Item.Trained"), "+1"))
                            }
                            else {
                                trained_weapons.push(passive_target[2])
                            }
                        }
                    }
                }
            }
        });
        if (trained_weapons.includes(used_weapon_type)) return true
        // The actor is not trained, lose 1 HP
        return false
    }

    /**
     * Returns the label to add to a chat message and mods to add to a roll
     * @param {*} formData 
     * @returns Object {label, mods}
     */
    _getActiveMods(formData) {
        let label = ""
        let mods = ""
        this.roll_bonuses.forEach((bonus) => {
            if (!formData[bonus.id] && bonus.optional) return;
            mods += bonus.value
            label += game.i18n.format('RYUUTAMA.Dialog.' + bonus.id, {
                target: game.i18n.localize(bonus.dialogtarget),
                mod: bonus.value
            })
        })
        return { label: label, mods: mods }
    }

    async abilityRoll(event, formData) {
        if (!formData.roll1) {
            formData.roll1 = this.ability1
            formData.roll2 = this.ability2
        }
        // Starting label
        let label = `${game.i18n.format('RYUUTAMA.Dialog.MakesAbilityRoll', { actor: this.actor.name })}<h3>${game.i18n.localize(CONFIG.RYUUTAMA.abilityAbbreviations[formData.roll1])} + ${game.i18n.localize(CONFIG.RYUUTAMA.abilityAbbreviations[formData.roll2])}</h3>`;
        // Add focus to message if it was used
        label += this._useFocus(formData)
        let roll_string = `d${this.actor.system.abilities[formData.roll1].value}+d${this.actor.system.abilities[formData.roll2].value}`
        // add all roll bonuses
        let mods = this._getActiveMods(formData)
        label += mods.label
        roll_string += mods.mods

        let roll = new Roll(roll_string, this.actor.getRollData());
        await roll.evaluate();
        // Result
        label += game.i18n.format('RYUUTAMA.Dialog.rollResult', { formula: `d${roll.terms[0].faces} (${roll.terms[0].results[0].result}) + d${roll.terms[2].faces} (${roll.terms[2].results[0].result})` })
        // Check for crits or fails
        label += this._checkForCrit(roll, this.actor.system.abilities[formData.roll1].value, this.actor.system.abilities[formData.roll2].value);

        label += `<div class="roll-total">${roll.total}</div>`

        // If the target number of the feature is topography then compare it
        if (["orientating", "marching", "camping"].includes(this.type) || this.object.system.target_number == "topography") {
            let difficulty = 0
            // Get the target number from the first region journal entry it finds
            let region_data = game.ryuutama.getCurrentTerrainAndClimate();
            if (region_data) difficulty += CONFIG.RYUUTAMA.terrains[region_data.terrain] + CONFIG.RYUUTAMA.climates[region_data.climate]
            if (difficulty > 0) {
                if (roll.total >= difficulty) label += game.i18n.format("RYUUTAMA.Dialog.travelhit", { difficulty: difficulty })
                else label += game.i18n.format("RYUUTAMA.Dialog.travelmiss", { difficulty: difficulty })
            }
            else {
                ui.notifications.error(game.i18n.localize("RYUUTAMA.UI.NoRegionEntry"));
            }
        }

        this._emitRollMessage([roll], label)
        return;
    }

    async weaponRoll(event, formData) {
        // Attack roll
        let msg_content = `<h2>${this.actor.name} ${game.i18n.localize('RYUUTAMA.Item.Weapon.AttacksWith')} ${this.object.name}</h2>` + this.object.system.description;

        msg_content += this._useFocus(formData)
        if (!this.trainedWeapon) {
            this.actor.damage(1)
            msg_content += game.i18n.format("RYUUTAMA.Dialog.untrained", { weapon: game.i18n.localize("RYUUTAMA.Item.WeaponType." + this.object.type) })
        }

        let attack_roll_string = `d${this.actor.system.abilities[this.ability1].value}+d${this.actor.system.abilities[this.ability2].value}`
        // Bonuses to attack
        let mods = this._getActiveMods(formData)
        msg_content += mods.label
        attack_roll_string += mods.mods

        const attack_roll = new Roll(attack_roll_string, this.actor.getRollData());
        // Invoke the roll and evaluate it to check for crits or blunders
        await attack_roll.evaluate()
        // Result
        msg_content += game.i18n.format('RYUUTAMA.Dialog.rollResult', { formula: `d${attack_roll.terms[0].faces} (${attack_roll.terms[0].results[0].result}) + d${attack_roll.terms[2].faces} (${attack_roll.terms[2].results[0].result})` })
        // Critical or blunder?
        msg_content += this._checkForCrit(attack_roll, this.actor.system.abilities[this.ability1].value, this.actor.system.abilities[this.ability2].value)

        // Show the attack result on the chat
        msg_content += `<div class="roll-total">${attack_roll.total}</div>`
        // Get the evasion value of the main target and compare it to the roll to check if the attack hits
        let rolls_to_show = [attack_roll]
        if (game.user.targets.size > 0) { // the targets property is a Set
            game.user.targets.forEach(async token => {
                // Check for any shields the target might have
                let dodge_value = 0
                if (token.document.actor.items) {
                    const items = token.document.actor.items.contents
                    for (let k in items) {
                        if (items[k].type == "shield" && items[k].system.equiped == true) {
                            dodge_value = items[k].system.dodge
                        }
                    }
                }
                let target_evasion = Math.max(token.combatant.initiative, dodge_value)
                if (attack_roll.total >= target_evasion) {
                    msg_content += game.i18n.format('RYUUTAMA.Dialog.hit', { target: token.document.name })

                    // Damage roll
                    let damage_roll_string = `d${this.actor.system.abilities[this.add_roll].value}`
                    // Bonuses to damage
                    msg_content += `${game.i18n.format("RYUUTAMA.Dialog.damageTo", {target: token.document.name})}`
                    this.add_roll_bonuses.forEach((bonus) => {
                        if (formData[bonus.id]) {
                            damage_roll_string += bonus.value
                            msg_content += bonus.name
                        }
                    })
                    const damage_roll = new Roll(damage_roll_string, this.actor.getRollData());
                    await damage_roll.evaluate()
                    let total_damage = damage_roll.total - token.document.actor.system.defense
                    msg_content += game.i18n.format('RYUUTAMA.Dialog.rollResult', { formula: `d${damage_roll.terms[0].faces} (${damage_roll.terms[0].results[0].result})` })
                    if(token.document.actor.system.defense > 0) msg_content += game.i18n.format('RYUUTAMA.Dialog.defense', { amount: token.document.actor.system.defense })
                    rolls_to_show.push(damage_roll) // add the damage roll to show it in the dice
                    msg_content += `<div class="damage-result">${total_damage}</span></div>`
                }
                else {
                    if (dodge_value > token.combatant.initiative) msg_content += game.i18n.localize("RYUUTAMA.Dialog.blocked")
                    msg_content += game.i18n.format('RYUUTAMA.Dialog.miss', { target: token.document.name })
                }
                this._emitRollMessage(rolls_to_show, msg_content)
                return;
            });
        }
        else {
            this._emitRollMessage(rolls_to_show, msg_content)
        }
        return;
    }

    /**
     * Sends a message with the following elements
     * @param {*} rolls_to_show array of rolls
     * @param {*} msg_content html element in string for body
     */
    _emitRollMessage(rolls_to_show, msg_content) {
        let chatData = {
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            rolls: rolls_to_show,
            content: msg_content
        };
        ChatMessage.applyRollMode(chatData, "roll");
        ChatMessage.create(chatData);
    }

    /**
     * Gets a roll and data from it and checks if there is a critical or blunder
     * @param {*} roll an evaluated roll
     * @param {*} roll1_max
     * @param {*} roll2_max
     * @returns 
     */
    _checkForCrit(roll, roll1_max, roll2_max) {
        if (roll.result[0] == roll1_max && roll.result[4] == roll2_max) return game.i18n.localize('RYUUTAMA.Dialog.critical');
        if (roll.result[0] == 6 && roll.result[4] == 6) return game.i18n.localize('RYUUTAMA.Dialog.critical');
        if (roll.result[0] == 1 && roll.result[4] == 1) return game.i18n.localize('RYUUTAMA.Dialog.blunder');
        return ""
    }
}

class RollBonus {
    constructor(id, name, value, optional = false, dialogtarget = "") {
        this.name = name;
        this.value = value;
        this.id = id;
        this.optional = optional;
        this.dialogtarget = dialogtarget;
    }
}

export { AbilityRollApp, RollBonus }