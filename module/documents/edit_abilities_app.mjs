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
      color: 'red',
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
  }

  async _updateObject(event, formData) {
    console.log(formData)
    const values = {
      Str: {
        value: parseInt(formData.Str)
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
    return this.object._updateAbilities(values)
  }
}

export { EditAbilitiesApp }