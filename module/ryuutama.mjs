// Import document classes.
import { RyuutamaActor } from './documents/actor.mjs';
import { RyuutamaItem } from './documents/item.mjs';
// Import sheet classes.
import { RyuutamaActorSheet } from './sheets/actor-sheet.mjs';
import { RyuutamaItemSheet } from './sheets/item-sheet.mjs';
import { RyuutamaRegionSheet } from './sheets/region-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { RYUUTAMA } from './helpers/config.mjs';
import { RegionWindowApp } from './apps/region_window.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.ryuutama = {
    RyuutamaActor,
    RyuutamaItem,
    rollItemMacro,
    openRegionWindow,
    getCurrentTerrainAndClimate,
    getActiveRegionJournalEntry
  };

  // Add custom constants for configuration.
  CONFIG.RYUUTAMA = RYUUTAMA;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: 'd@abilities.Dex.value+d@abilities.Spi.value+@techInitiative',
    decimals: 2,
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = RyuutamaActor;
  CONFIG.Item.documentClass = RyuutamaItem;

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('ryuutama', RyuutamaActorSheet, {
    makeDefault: true,
    label: 'RYUUTAMA.SheetLabels.Actor',
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('ryuutama', RyuutamaItemSheet, {
    makeDefault: true,
    label: 'RYUUTAMA.SheetLabels.Item',
  });
  DocumentSheetConfig.registerSheet(JournalEntryPage, 'ryuutama', RyuutamaRegionSheet, {
    types: ["region"],
    makeDefault: true,
    label: 'RYUUTAMA.SheetLabels.Region'
  })

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Region Button Hook                          */
/* -------------------------------------------- */
Hooks.on('getSceneControlButtons', (buttons) => {
  if (!canvas) return;
  let group = buttons.find((b) => b.name === 'notes');
  group.tools.push({
    button: true,
    icon: 'fas fa-tree',
    name: 'region',
    title: 'Toggle Region',
    onClick: () => {
      game.ryuutama.openRegionWindow();
    },
  });
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (Str) {
  return Str.toLowerCase();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.ryuutama.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'ryuutama.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}

function openRegionWindow() {
  if (game.user.isTrusted) return new RegionWindowApp(game.scenes.active.name).render(true);
  // In other case just show an UI log with the region terrain and climate
  let data = game.ryuutama.getCurrentTerrainAndClimate()
  return ui.notifications.info(game.i18n.format('RYUUTAMA.ClimateAndTerrainInfo'), {
    terrain: game.i18n.localize("RYUUTAMA.Terrains." + data.terrain),
    climate: game.i18n.localize("RYUUTAMA.Climates." + data.climate),
  })
}

function getCurrentTerrainAndClimate() {
  const page = getActiveRegionJournalEntry()
  if (page) return { terrain: page.system.terrain, climate: page.system.climate };
  return false;
}

function getActiveRegionJournalEntry() {
  let result = false
  game.journal.search("region").forEach(journal => {
    journal.pages.forEach(page => {
      if (page.type == "region") {
        result = page
      }
    });
  });
  return result;
}