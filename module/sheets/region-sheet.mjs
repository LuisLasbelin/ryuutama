/**
 * @extends {JournalPageSheet}
 */
export class RyuutamaRegionSheet extends JournalPageSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['ryuutama', 'sheet', 'journal-entry-page'],
            width: 600,
            height: 600
        });
    }

    /** @override */
    get template() {
        return `systems/ryuutama/templates/journalentrypage/region-sheet.hbs`;
    }

    /** @override */
    getData() {
        // Retrieve the data structure from the base sheet. You can inspect or log
        // the context variable to see the structure, but some key properties for
        // sheets are the actor object, the data object, whether or not it's
        // editable, the items array, and the effects array.
        const context = super.getData();

        // Use a safe clone of the actor data for further operations.
        const journalData = context.data;

        let terrains = []
        for (const k in CONFIG.RYUUTAMA.terrains) {
            terrains.push({
                name: game.i18n.localize("RYUUTAMA.Terrain." + k),
                value: CONFIG.RYUUTAMA.terrains[k]
            })
        }

        let climates = []
        for (const k in CONFIG.RYUUTAMA.climates) {
            climates.push({
                name: game.i18n.localize("RYUUTAMA.Climate." + k),
                value: CONFIG.RYUUTAMA.climates[k]
            })
        }

        context.terrains = terrains;
        context.climates = climates;

        return context;
    }
}