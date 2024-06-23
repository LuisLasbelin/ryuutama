class RegionWindowApp extends FormApplication {
    constructor(scene_name) {
        super();
        this.scene_name = scene_name;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ['form'],
            popOut: true,
            template: `systems/ryuutama/templates/applications/region-window.hbs`,
            id: 'region',
            title: 'Edit Region',
            closeOnSubmit: false
        });
    }

    getData() {
        const journal_data = game.ryuutama.getCurrentTerrainAndClimate()
        let terrains = []
        for (const k in CONFIG.RYUUTAMA.terrains) {
            terrains.push({
                id: k,
                name: game.i18n.localize("RYUUTAMA.Terrains." + k),
                value: CONFIG.RYUUTAMA.terrains[k],
                selected: journal_data.terrain == k
            })
        }

        let climates = []
        for (const k in CONFIG.RYUUTAMA.climates) {
            climates.push({
                id: k,
                name: game.i18n.localize("RYUUTAMA.Climates." + k),
                value: `+${CONFIG.RYUUTAMA.climates[k]}`,
                selected: journal_data.climate == k
            })
        }
        // Send data to the template
        return {
            terrain: journal_data.terrain,
            climate: journal_data.climate,
            terrains: terrains,
            climates: climates
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        // When changing a selector, update the journal
        html.on('change', '.save', (ev) => {
            console.log(ev, html.find('.save'))
            this.submit()
        })
        
    }

    async _updateObject(event, formData) {
        const page = game.ryuutama.getActiveRegionJournalEntry()
        page.update({
            system: {
                terrain: formData.terrain,
                climate: formData.climate
            }
        })
    }
}

export { RegionWindowApp }