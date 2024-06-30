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
      Str: this.object.system.abilities.Str.value,
      Dex: this.object.system.abilities.Dex.value,
      Int: this.object.system.abilities.Int.value,
      Spi: this.object.system.abilities.Spi.value,
      archetype: this.object.system.archetype
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
  }

  async _updateObject(event, formData) {
    const values = {
      Str: {
        value: parseInt(formData.Str),
      },
      Dex: {
        value: parseInt(formData.Dex)
      },
      Int: {
        value: parseInt(formData.Int)
      },
      Spi: {
        value: parseInt(formData.Spi)
      }
    }
    const archetype = formData.archetype
    this.object._updateArchetype(archetype)
    this.object._updateAbilities(values)
    return
  }
}

export { EditAbilitiesApp }