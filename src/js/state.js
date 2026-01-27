/**
 * AppState - Centralized state management for the extension
 */

class AppState {
  constructor() {
    this.selectedTable = '';
    this.queryType = 'standard';
    this.schemaParser = null;
    this.quickQuery = null;

    // JOIN configuration
    this.joinConfig = {
      enabled: false,
      joinType: 'INNER JOIN',
      table2: '',
      onField1: '',
      onField2: ''
    };
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
   * Get the type of a field
   * @param {string} fieldName - Field name
   * @returns {string|null} Field type or null if not found
   */
  getFieldType(fieldName) {
    if (!this.schemaParser) {
      return null;
    }
    return this.schemaParser.getFieldType(fieldName);
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

  /**
   * Enable or disable JOIN mode
   * @param {boolean} enabled - Whether JOIN is enabled
   */
  setJoinEnabled(enabled) {
    this.joinConfig.enabled = enabled;
    if (!enabled) {
      this.resetJoinConfig();
    }
  }

  /**
   * Check if JOIN mode is enabled
   * @returns {boolean} True if JOIN is enabled
   */
  isJoinEnabled() {
    return this.joinConfig.enabled;
  }

  /**
   * Set the JOIN type
   * @param {string} joinType - JOIN type (INNER JOIN, LEFT OUTER JOIN, FULL OUTER JOIN)
   */
  setJoinType(joinType) {
    this.joinConfig.joinType = joinType;
  }

  /**
   * Get the current JOIN type
   * @returns {string} JOIN type
   */
  getJoinType() {
    return this.joinConfig.joinType;
  }

  /**
   * Set the second table for JOIN
   * @param {string} tableName - Second table name
   * @returns {boolean} True if table has known schema
   */
  setJoinTable(tableName) {
    this.joinConfig.table2 = tableName;
    return this.schemaParser ? this.schemaParser.isKnownTableName(tableName) : false;
  }

  /**
   * Get the second table name
   * @returns {string} Second table name
   */
  getJoinTable() {
    return this.joinConfig.table2;
  }

  /**
   * Set ON clause fields
   * @param {string} field1 - Field from first table
   * @param {string} field2 - Field from second table
   */
  setJoinOnFields(field1, field2) {
    this.joinConfig.onField1 = field1;
    this.joinConfig.onField2 = field2;
  }

  /**
   * Get ON clause configuration
   * @returns {object} ON clause fields
   */
  getJoinOnFields() {
    return {
      field1: this.joinConfig.onField1,
      field2: this.joinConfig.onField2
    };
  }

  /**
   * Get full JOIN configuration
   * @returns {object} Complete join config
   */
  getJoinConfig() {
    return { ...this.joinConfig };
  }

  /**
   * Set full JOIN configuration (for loading from history/snippets)
   * @param {object} config - Join configuration
   */
  setJoinConfig(config) {
    if (config) {
      this.joinConfig = {
        enabled: config.enabled || false,
        joinType: config.joinType || 'INNER JOIN',
        table2: config.table2 || '',
        onField1: config.onField1 || '',
        onField2: config.onField2 || ''
      };
    }
  }

  /**
   * Reset JOIN configuration to defaults
   */
  resetJoinConfig() {
    this.joinConfig = {
      enabled: false,
      joinType: 'INNER JOIN',
      table2: '',
      onField1: '',
      onField2: ''
    };
  }

  /**
   * Get field autocomplete items for a specific table
   * @param {string} tableName - Table name
   * @returns {Array} Array of autocomplete items
   */
  getFieldAutocompleteItemsForTable(tableName) {
    if (!this.schemaParser) {
      return [];
    }
    return this.schemaParser.getAutocompleteItemsForTable(tableName);
  }

  /**
   * Filter fields for a specific table
   * @param {string} query - Search query
   * @param {string} tableName - Table name
   * @returns {Array} Filtered field items
   */
  filterFieldsForTable(query, tableName) {
    if (!this.schemaParser) {
      return [];
    }
    return this.schemaParser.filterFieldsForTable(query, tableName);
  }
}

const appState = new AppState();
