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
      Str: {
        base: this.object.system.abilities.Str.base
      },
      Dex: {
        base: this.object.system.abilities.Dex.base
      },
      Int: {
        base: this.object.system.abilities.Int.base
      },
      Spi: {
        base: this.object.system.abilities.Spi.base
      },
      archetype: this.object.system.archetype
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
  }

  async _updateObject(event, formData) {
    const values = {
      Str: {
        base: parseInt(formData.Str)
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