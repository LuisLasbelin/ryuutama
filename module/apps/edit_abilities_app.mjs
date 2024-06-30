class EditAbilitiesApp extends FormApplication {

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['form'],
      popOut: true,
      template: `systems/ryuutama/templates/applications/edit-abilities.hbs`,
      id: 'edit_stats',
      title: 'Edit Stats'
    });
  }

  getData() {
    // Send data to the template
    return {
      Str: this.object.system.abilities.Str.base,
      Dex: this.object.system.abilities.Dex.base,
      Int: this.object.system.abilities.Int.base,
      Spi: this.object.system.abilities.Spi.base,
      archetype: this.object.system.archetype
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
  }

  async _updateObject(event, formData) {
    const values = {
      Str: {
        base: parseInt(formData.Str),
      },
      Dex: {
        base: parseInt(formData.Dex)
      },
      Int: {
        base: parseInt(formData.Int)
      },
      Spi: {
        base: parseInt(formData.Spi)
      }
    }
    const archetype = formData.archetype
    this.object._updateArchetype(archetype)
    this.object._updateAbilities(values)
    return
  }
}

export { EditAbilitiesApp }