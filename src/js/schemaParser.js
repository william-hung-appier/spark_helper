/**
 * SchemaParser - Provides access to bundled table schemas
 *
 * This class loads pre-generated schema data from bundled JS files
 * and provides methods to query field information.
 */

class SchemaParser {
  constructor() {
    this.currentTable = null;
    this.currentSchema = null;
    this.currentMappings = null;
  }

  /**
   * Set the current table and load its schema
   * @param {string} tableName - Table name
   * @returns {boolean} True if table schema exists
   */
  setTable(tableName) {
    this.currentTable = tableName;
    this.currentSchema = getTableSchema(tableName);
    this.currentMappings = hasTableMappings(tableName)
      ? { fields: getFieldMappings(tableName), conditions: getWhereConditions(tableName) }
      : null;

    return this.currentSchema !== null;
  }

  /**
   * Get list of supported table names
   * @returns {Array} Array of table names with schemas
   */
  getSupportedTables() {
    return getSupportedTables();
  }

  /**
   * Check if current table is a known/supported table
   * @returns {boolean} True if current table has a schema
   */
  isKnownTable() {
    return this.currentSchema !== null;
  }

  /**
   * Get all fields for the current table
   * @returns {Array} Array of field objects with name and type
   */
  getFields() {
    if (!this.currentSchema) {
      return [];
    }
    return this.currentSchema.fields || [];
  }

  /**
   * Get custom field mappings for the current table
   * @returns {object} Field mappings object
   */
  getCustomFieldMappings() {
    if (!this.currentMappings) {
      return {};
    }
    return this.currentMappings.fields || {};
  }

  /**
   * Get WHERE conditions for the current table
   * @returns {object} WHERE conditions object
   */
  getWhereConditions() {
    if (!this.currentMappings) {
      return {};
    }
    return this.currentMappings.conditions || {};
  }

  /**
   * Check if a field is binary type
   * @param {string} fieldName - Field name to check
   * @returns {boolean} True if field is binary
   */
  isBinaryField(fieldName) {
    if (!this.currentSchema) {
      return false;
    }

    const field = this.currentSchema.fields.find(f => f.name === fieldName);
    return field && field.type === 'binary';
  }

  /**
   * Check if a field has a custom mapping that already handles BYTES2STR
   * @param {string} fieldName - Field name to check
   * @returns {boolean} True if field is covered by a custom mapping
   */
  isFieldCoveredByMapping(fieldName) {
    const mappings = this.getCustomFieldMappings();
    return Object.values(mappings).some(mapping =>
      mapping.sql && mapping.sql.includes(fieldName)
    );
  }

  /**
   * Get fields formatted for autocomplete display
   * Combines custom mappings and schema fields
   * @returns {Array} Array of {value, label, type, isCustom, isBinary} objects
   */
  getAutocompleteItems() {
    const items = [];
    const addedFields = new Set();

    // Add custom field mappings first
    const customMappings = this.getCustomFieldMappings();
    for (const [name, mapping] of Object.entries(customMappings)) {
      items.push({
        value: name,
        label: name,
        type: 'custom',
        isCustom: true,
        isBinary: false,
        sql: mapping.sql,
        alias: mapping.alias
      });
      addedFields.add(name);
    }

    // Add schema fields
    const fields = this.getFields();
    for (const field of fields) {
      if (addedFields.has(field.name)) continue;

      items.push({
        value: field.name,
        label: field.name,
        type: field.type,
        isCustom: false,
        isBinary: field.type === 'binary'
      });
      addedFields.add(field.name);
    }

    return items;
  }

  /**
   * Filter autocomplete items by query (prefix match, case-insensitive)
   * @param {string} query - Search query
   * @returns {Array} Filtered items
   */
  filterFields(query) {
    if (!query) {
      return this.getAutocompleteItems();
    }

    const lowerQuery = query.toLowerCase();
    return this.getAutocompleteItems().filter(item =>
      item.label.toLowerCase().startsWith(lowerQuery)
    );
  }
}
