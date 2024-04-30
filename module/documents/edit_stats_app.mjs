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
      str : {
        value : parseInt(formData.str)
      },
      dex : {
        value : parseInt(formData.dex)
      },
      int : {
        value : parseInt(formData.int)
      },
      spi : {
        value : parseInt(formData.spi)
      }
    }
    return this.object._updateAbilities(values)
  }
}

export {EditAbilitiesApp}