/**
 * AppState - Centralized state management for the extension
 */

class AppState {
  constructor() {
    this.selectedTable = '';
    this.queryType = 'standard';
    this.schemaParser = null;
    this.quickQuery = null;
  }

  /**
   * Set the schema parser instance
   * @param {SchemaParser} parser - SchemaParser instance
   */
  setSchemaParser(parser) {
    this.schemaParser = parser;
  }

  /**
   * Set the selected table and update schema parser
   * @param {string} tableName - Table name
   * @returns {boolean} True if table has a known schema
   */
  setSelectedTable(tableName) {
    this.selectedTable = tableName;
    if (this.schemaParser) {
      return this.schemaParser.setTable(tableName);
    }
    return false;
  }

  /**
   * Get the currently selected table
   * @returns {string} Table name
   */
  getSelectedTable() {
    return this.selectedTable;
  }

  /**
   * Check if a table is selected
   * @returns {boolean} True if table is selected
   */
  hasSelectedTable() {
    return this.selectedTable.length > 0;
  }

  /**
   * Check if selected table is a known/supported table
   * @returns {boolean} True if table has schema
   */
  isKnownTable() {
    return this.schemaParser && this.schemaParser.isKnownTable();
  }

  /**
   * Set query type (standard or distinct)
   * @param {string} type - Query type
   */
  setQueryType(type) {
    this.queryType = type;
  }

  /**
   * Check if in distinct mode
   * @returns {boolean} True if distinct mode
   */
  isDistinctMode() {
    return this.queryType === 'distinct';
  }

  /**
   * Set the selected quick query
   * @param {string|null} key - Quick query key or null to clear
   */
  setQuickQuery(key) {
    this.quickQuery = key;
  }

  /**
   * Get the currently selected quick query
   * @returns {string|null} Quick query key or null
   */
  getQuickQuery() {
    return this.quickQuery;
  }

  /**
   * Clear the selected quick query
   */
  clearQuickQuery() {
    this.quickQuery = null;
  }

  /**
   * Get list of supported table names
   * @returns {Array} Array of table names
   */
  getSupportedTables() {
    if (!this.schemaParser) {
      return [];
    }
    return this.schemaParser.getSupportedTables();
  }

  /**
   * Get autocomplete items for current table's fields
   * @returns {Array} Array of autocomplete items
   */
  getFieldAutocompleteItems() {
    if (!this.schemaParser) {
      return [];
    }
    return this.schemaParser.getAutocompleteItems();
  }

  /**
   * Filter fields by query
   * @param {string} query - Search query
   * @returns {Array} Filtered field items
   */
  filterFields(query) {
    if (!this.schemaParser) {
      return [];
    }
    return this.schemaParser.filterFields(query);
  }

  /**
   * Get WHERE conditions for current table
   * @returns {object} WHERE conditions
   */
  getWhereConditions() {
    if (!this.schemaParser) {
      return {};
    }
    return this.schemaParser.getWhereConditions();
  }

  /**
   * Check if a field is binary type
   * @param {string} fieldName - Field name
   * @returns {boolean} True if binary
   */
  isBinaryField(fieldName) {
    if (!this.schemaParser) {
      return false;
    }
    return this.schemaParser.isBinaryField(fieldName);
  }

  /**
   * Check if a field has a custom mapping
   * @param {string} fieldName - Field name
   * @returns {boolean} True if covered by mapping
   */
  isFieldCoveredByMapping(fieldName) {
    if (!this.schemaParser) {
      return false;
    }
    return this.schemaParser.isFieldCoveredByMapping(fieldName);
  }

  /**
   * Get custom field mappings for current table
   * @returns {object} Field mappings
   */
  getCustomFieldMappings() {
    if (!this.schemaParser) {
      return {};
    }
    return this.schemaParser.getCustomFieldMappings();
  }
}

const appState = new AppState();
