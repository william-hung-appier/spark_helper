class AppState {
  constructor() {
    this.availableFields = [];
    this.queryType = 'standard';
  }

  setAvailableFields(fields) {
    this.availableFields = fields;
  }

  setQueryType(type) {
    this.queryType = type;
  }

  isDistinctMode() {
    return this.queryType === 'distinct';
  }

  getCustomizeFields() {
    return this.availableFields.filter(f => f.isCustomize);
  }

  getSchemaFields() {
    return this.availableFields.filter(f => !f.isCustomize);
  }
}

const appState = new AppState();