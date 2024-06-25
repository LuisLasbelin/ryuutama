import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

import { EditAbilitiesApp } from '../apps/edit_abilities_app.mjs'
import { AbilityRollApp } from '../apps/ability_roll_app.mjs'

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class RyuutamaActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['ryuutama', 'sheet', 'actor'],
      width: 700,
      height: 600,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'features',
        },
      ],
    });
  }

  /** @override */
  get template() {
    return `systems/ryuutama/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.data;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
      this._prepareSpells(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
      this._prepareSpells(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'animal') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(
      // A generator that returns all effects stored on the actor
      // as well as any items
      this.actor.allApplicableEffects()
    );

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.system.abilities)) {
      v.label = game.i18n.localize(CONFIG.RYUUTAMA.abilities[k]) ?? k;
      v.short = game.i18n.localize(CONFIG.RYUUTAMA.abilityAbbreviations[k]) ?? k;
      v.icon = 'systems/ryuutama/assets/' + k + '_icon.png'
    }
    // Archetype name
    context.archetype_name = game.i18n.localize(CONFIG.RYUUTAMA.archetypes[context.system.archetype])
    // Next level EXP
    const levels_exp = [-2, -1, 100, 600, 1200, 2000, 3000, 4200, 5800, 7500, 10000, 99999]
    let next_exp = 0
    for (let l = 0; l < levels_exp.length - 1; l++) {
      if (context.system.attributes.level.exp < levels_exp[l + 1]) {
        this.actor.update({
          system: {
            attributes: {
              level: {
                value: l
              }
            }
          }
        })
        next_exp = levels_exp[l + 1]
        break
      }
    }
    context.magical = context.system.archetype == "magical"
    context.next_exp = next_exp
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const features = [];
    const weapons = [];
    const shields = [];
    const armor = [];
    let wealth = 0;
    let total_load = 0;
    let total_defense = 0;

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      // Append to gear.
      if (i.type === 'item') {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === 'feature') {
        features.push(i);
      }
      else if (i.type === "weapon") {
        weapons.push(i)
      }
      else if (i.type === "armor") {
        armor.push(i)
        if (i.system.equiped) total_defense += i.system.defense
      }
      else if (i.type === "shield") {
        shields.push(i)
        if (i.system.equiped) total_defense += i.system.defense
      }

      wealth += i.system.price ?? 0;

      // Optional size to add up, if it equiped it doesn't count on the load
      if (i.system.equiped != true) total_load += i.system.size ?? 0;
    }

    // Assign and return
    context.wealth = wealth + context.system.coins;
    context.gear = gear;
    context.armor = armor;
    context.shields = shields;
    context.features = features;
    context.weapons = weapons;
    context.total_load = total_load;
    context.max_load = context.system.load.max
    context.percentile_load = total_load * 100 / (context.max_load + context.system.load.mod);
    context.positiveHealth = context.system.health.value > 9;
    context.total_defense = total_defense;

    this.actor.update({
      system: {
        load: {
          value: total_load
        }
      }
    });
  }

  /**
 * Organize and classify Spells for Character sheets.
 *
 * @param {Object} actorData The actor to prepare.
 *
 * @return {undefined}
 */
  _prepareSpells(context) {
    // Initialize containers.
    let total_enchantments = 0;
    const spells = {
      1: [],
      2: [],
      3: []
    };
    const enchantments = {
      1: [],
      2: [],
      3: []
    };

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      // Append to spells.
      if (i.type === 'spell') {
        if (i.system.spellLevel != undefined) {
          if (i.system.spellType === "enchantment") {
            enchantments[i.system.spellLevel].push(i);
            total_enchantments += 1;
          }
          else {
            spells[i.system.spellLevel].push(i);
          }
        }
      }
    }

    context.spells = spells;
    context.enchantments = enchantments;
    context.max_enchantments = context.system.attributes.level.value * 2;
    context.total_enchantments = total_enchantments;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.on('click', '.item-create', this._onItemCreate.bind(this));
    html.on('click', '.item-equip', this._onEquipItem.bind(this));

    // Delete Inventory Item
    html.on('click', '.item-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.on('click', '.effect-control', (ev) => {
      const row = ev.currentTarget.closest('li');
      const document =
        row.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    // Rollable abilities.
    html.on('click', '.rollable', this._onRoll.bind(this));
    html.on('click', '.edit_abilities', this._openEditAbilitiesApp.bind(this));
    html.on('click', '.ability-roll-Str', this._prepareAbilityRoll.bind(this, "ability", "Str", "Str"));
    html.on('click', '.ability-roll-Dex', this._prepareAbilityRoll.bind(this, "ability", "Dex", "Dex"));
    html.on('click', '.ability-roll-Int', this._prepareAbilityRoll.bind(this, "ability", "Int", "Int"));
    html.on('click', '.ability-roll-Spi', this._prepareAbilityRoll.bind(this, "ability", "Spi", "Spi"));
    html.on('click', '.btn-health', this._prepareAbilityRoll.bind(this, "health", "Str", "Spi"));
    html.on('click', '.btn-marching', this._prepareAbilityRoll.bind(this, "marching", "Str", "Spi"));
    html.on('click', '.btn-orientating', this._prepareAbilityRoll.bind(this, "orientating", "Int", "Int"));
    html.on('click', '.btn-camping', this._prepareAbilityRoll.bind(this, "camping", "Dex", "Int"));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data,
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system['type'];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  /**
   * Handle clickable ability form form rolling.
   * @param {String} type Name of the type of roll
   * @param {String} ability1   Ability to use first
   * @param {String} ability2   Ability to use second
   * @param {Event} event   Always last param
   * @private
   */
  _prepareAbilityRoll(type = "none", ability1 = "Str", ability2 = "Str", event) {
    return new AbilityRollApp(this.actor, { system: { target_number: "none" } }, type, ability1, ability2).render(true);
  }

  /**
   * Open the edit stats app
   * @param {Event} event   The originating click event
   * @private
   */
  _openEditAbilitiesApp(event) {
    return new EditAbilitiesApp(this.actor).render(true);
  }

  /**
 * Equip or take off an item
 * @param {Event} event   The originating click event
 * @private
 */
  _onEquipItem(event) {
    const li = $(event.currentTarget).parents('.item');
    const item = this.actor.items.get(li.data('itemId'));
    item.update({
      system: {
        equiped: !item.system.equiped
      }
    })
  }
}