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
      this._prepareActorData(context);
      this._prepareSpells(context);
      context.isNpc = false;
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
      this._prepareActorData(context);
      this._prepareSpells(context);
      context.isNpc = true;
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
   * Set the names and labels for abilities
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareActorData(context) {
    // Handle ability names and labels.
    for (let [k, v] of Object.entries(context.system.abilities)) {
      v.label = game.i18n.localize(CONFIG.RYUUTAMA.abilities[k]) ?? k;
      v.short = game.i18n.localize(CONFIG.RYUUTAMA.abilityAbbreviations[k]) ?? k;
      v.icon = 'systems/ryuutama/assets/' + k + '_icon.png'
    }
  }

  /**
   * Prepare levels and magical archetype special tab for spells
   * 
   * @param {Object} context The character to prepare
   */
  _prepareCharacterData(context) {
    // Archetype name
    context.archetype_name = game.i18n.localize(CONFIG.RYUUTAMA.archetypes[context.system.archetype])
    // Next level EXP
    const levels_exp = CONFIG.RYUUTAMA.levels
    let next_exp = 0
    for (let l = 0; l < levels_exp.length - 1; l++) {
      if (context.system.attributes.level.exp < levels_exp[l + 1]) {
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
    const containers = [];
    const effects = [];
    let wealth = 0;
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
      else if (i.type === "container") {
        containers.push(i)
      }
      else if (i.type === "armor") {
        armor.push(i)
      }
      else if (i.type === "shield") {
        shields.push(i)
      }
      else if (i.type === "effect") {
        effects.push(i)
      }

      wealth += i.system.price ?? 0;
    }

    // Assign and return
    context.wealth = wealth + context.system.coins;
    context.gear = gear;
    context.armor = armor;
    context.shields = shields;
    context.features = features;
    context.weapons = weapons;
    context.containers = containers;
    context.effects = effects;
    context.max_load = context.system.load.max
    context.percentile_load = context.system.load.value * 100 / context.system.load.max;
    context.positiveHealth = context.system.health.value > 9;
  }

  /**
 * Organize and classify Spells for Character sheets.
 *
 * @param {Object} actorData The actor to prepare.
 *
 * @return {undefined}
 */
  _prepareSpells(context) {
    let spells = {
      1: [],
      2: [],
      3: []
    };
    let enchantments = {
      1: [],
      2: [],
      3: []
    };
    // max enchantments are only for player characters
    if (context.system.attributes?.level) {
      context.max_enchantments = context.system.attributes.level.value * 2;
      // Limit the spells shown by level
      if (context.system.attributes.level.value < 4) {
        delete spells["2"]
        delete enchantments["2"]
      }
      if (context.system.attributes.level.value < 7) {
        delete spells["3"]
        delete enchantments["3"]
      }
    }
    // Initialize containers.
    let total_enchantments = 0;
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
    html.on('click', '.minus-quantity', this._changeItemQuantity.bind(this, -1, false));
    html.on('click', '.plus-quantity', this._changeItemQuantity.bind(this, 1, false));
    html.on('click', '.minus-quantity-liquid', this._changeItemQuantity.bind(this, -1, true));
    html.on('click', '.plus-quantity-liquid', this._changeItemQuantity.bind(this, 1, true));

    // Delete Inventory Item
    html.on('click', '.item-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      let confirmed = confirm(game.i18n.format("RYUUTAMA.Delete?", { target: item.name }))
      if (confirmed) {
        item.delete();
        li.slideUp(200, () => this.render(false));
      }
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
    html.on('click', '.btn-marching', this._prepareAbilityRoll.bind(this, "marching", "Str", "Dex"));
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

  /**
* Modify the quantity of an item
* @param {Number} quantity to modify the quantity
* @param {Boolean} isLiquid if its liquid modify the current amount
* @param {Event} event   The originating click event
* @private
*/
  _changeItemQuantity(quantity, isLiquid, event) {
    const li = $(event.currentTarget).parents('.item');
    const item = this.actor.items.get(li.data('itemId'));
    if (isLiquid) {
      let new_quantity = item.system.liquid.value + quantity
      if (new_quantity < 0 || new_quantity > item.system.liquid.max) return; // The number cannot be negative or higher than the max
      item.update({
        system: {
          liquid: {
            value: new_quantity
          }
        }
      })
      return;
    }
    let new_quantity = item.system.quantity + quantity
    if (new_quantity < 0) return; // The number cannot be negative
    item.update({
      system: {
        quantity: new_quantity
      }
    })
    return;
  }
}