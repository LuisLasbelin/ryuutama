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
                id: k,
                name: game.i18n.localize("RYUUTAMA.Terrains." + k),
                value: CONFIG.RYUUTAMA.terrains[k],
                selected: journalData.system.terrain == k
            })
        }

        let climates = []
        for (const k in CONFIG.RYUUTAMA.climates) {
            climates.push({
                id: k,
                name: game.i18n.localize("RYUUTAMA.Climates." + k),
                value: `+${CONFIG.RYUUTAMA.climates[k]}`,
                selected: journalData.system.climate == k
            })
        }

        context.terrains = terrains;
        context.climates = climates;

        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Render the item sheet for viewing/editing prior to the editable check.
        html.on('change', '.save-terrain', (ev) => {
            this.object.update({
                system: {
                    terrain: ev.currentTarget.value
                }
            })
        });

        html.on('change', '.save-climate', (ev) => {
            this.object.update({
                system: {
                    climate: ev.currentTarget.value
                }
            })
        });
    }
}