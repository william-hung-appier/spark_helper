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
   * Get the type of a field
   * @param {string} fieldName - Field name to check
   * @returns {string|null} Field type or null if not found
   */
  getFieldType(fieldName) {
    if (!this.currentSchema) {
      return null;
    }

    const field = this.currentSchema.fields.find(f => f.name === fieldName);
    return field ? field.type : null;
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
    return this.getAutocompleteItemsForTable(this.currentTable);
  }

  /**
   * Generate array operation items for a field
   * @param {string} fieldName - Array field name
   * @param {object} arrayInfo - Array field info
   * @param {object} hints - Priority hints
   * @returns {Array} Array operation autocomplete items
   */
  generateArrayOperationItems(fieldName, arrayInfo, hints) {
    const items = [];
    const operations = ['EXISTS', 'COUNT', 'FILTER'];
    const fieldHint = hints[fieldName] || {};

    if (arrayInfo.elementFields) {
      // Array of structs - create items for each sub-field
      const subFields = arrayInfo.elementFields;

      // Sort sub-fields: suggested first, then alphabetical
      const sortedSubFields = [...subFields].sort((a, b) => {
        if (fieldHint.suggestedSubField === a.name) return -1;
        if (fieldHint.suggestedSubField === b.name) return 1;
        return a.name.localeCompare(b.name);
      });

      for (const subField of sortedSubFields) {
        for (const operation of operations) {
          const opSymbol = operation === 'EXISTS' ? '✓' : operation === 'COUNT' ? '#' : '⊂';
          const outputType = operation === 'EXISTS' ? '1 or 0' : operation === 'COUNT' ? 'count' : 'array';

          items.push({
            value: fieldName,
            label: `${fieldName} → ${operation}(${subField.name} = ?)`,
            displayLabel: `${opSymbol} ${fieldName} → ${operation}(${subField.name} = ?)`,
            type: 'array-op',
            fieldType: 'array-op',
            operation: operation,
            subField: subField.name,
            subFieldType: subField.type,
            outputType: outputType,
            isArrayOp: true
          });
        }
      }
    } else {
      // Primitive array - simpler operations
      for (const operation of operations) {
        const opSymbol = operation === 'EXISTS' ? '✓' : operation === 'COUNT' ? '#' : '⊂';
        const outputType = operation === 'EXISTS' ? '1 or 0' : operation === 'COUNT' ? 'count' : 'array';

        items.push({
          value: fieldName,
          label: `${fieldName} → ${operation}(= ?)`,
          displayLabel: `${opSymbol} ${fieldName} → ${operation}(= ?)`,
          type: 'array-op',
          fieldType: 'array-op',
          operation: operation,
          subField: null,
          subFieldType: arrayInfo.elementType || 'unknown',
          outputType: outputType,
          isArrayOp: true
        });
      }
    }

    return items;
  }

  /**
   * Filter autocomplete items by query (prefix match, case-insensitive)
   * @param {string} query - Search query
   * @returns {Array} Filtered items
   */
  filterFields(query) {
    return this.filterFieldsForTable(query, this.currentTable);
  }

  /**
   * Check if a table name is a known/supported table
   * @param {string} tableName - Table name to check
   * @returns {boolean} True if known
   */
  isKnownTableName(tableName) {
    return TABLE_SCHEMAS.hasOwnProperty(tableName);
  }

  /**
   * Get autocomplete items for a specific table
   * @param {string} tableName - Table name
   * @returns {Array} Array of autocomplete items
   */
  getAutocompleteItemsForTable(tableName) {
    const schema = getTableSchema(tableName);
    if (!schema) {
      return [];
    }

    const items = [];
    const arrayOpItems = [];
    const mappings = TABLE_MAPPINGS[tableName] || {};
    const customFields = mappings.fields || {};
    const arrayFields = this.getArrayFieldsForTable(tableName);
    const arrayFieldHints = this.getArrayFieldHints();
    const addedFields = new Set();

    // Add custom mapping fields first
    for (const [key, config] of Object.entries(customFields)) {
      items.push({
        value: key,
        label: key,
        type: 'custom',
        isCustom: true,
        sql: config.sql,
        alias: config.alias,
        isBinary: false
      });
      addedFields.add(key);
    }

    // Add schema fields
    const fields = schema.fields || [];
    for (const field of fields) {
      // Skip if already covered by custom mapping
      if (addedFields.has(field.name)) continue;

      // Skip sub-fields of arrays (like arms.action_id) - we only want the parent array
      const parentArrayField = Object.keys(arrayFields).find(af => field.name.startsWith(af + '.'));
      if (parentArrayField) continue;

      // Check if this is an array field
      if (field.isArrayStruct || field.isArrayPrimitive) {
        // Add raw array field
        items.push({
          value: field.name,
          label: field.name,
          type: field.type,
          isCustom: false,
          isBinary: false,
          isRawArray: true
        });

        // Generate array operation items
        const opItems = this.generateArrayOperationItems(
          field.name,
          arrayFields[field.name],
          arrayFieldHints
        );
        arrayOpItems.push(...opItems);
      } else {
        // Regular field
        items.push({
          value: field.name,
          label: field.name,
          type: field.type,
          isCustom: false,
          isBinary: field.type === 'binary'
        });
      }

      addedFields.add(field.name);
    }

    // Add separator and array operation items at the end
    if (arrayOpItems.length > 0) {
      items.push({
        value: '__separator__',
        label: '── Array Operations ──',
        type: 'separator',
        isSeparator: true
      });
      items.push(...arrayOpItems);
    }

    return items;
  }

  /**
   * Filter fields for a specific table by query
   * @param {string} query - Search query
   * @param {string} tableName - Table name
   * @returns {Array} Filtered items
   */
  filterFieldsForTable(query, tableName) {
    const items = this.getAutocompleteItemsForTable(tableName);
    if (!query) return items;

    const lowerQuery = query.toLowerCase();
    const filtered = items.filter(item => {
      // Always exclude separators in filtered results
      if (item.isSeparator) return false;

      // For array operations, match on the base field name
      if (item.isArrayOp) {
        return item.value.toLowerCase().startsWith(lowerQuery);
      }

      return item.label.toLowerCase().startsWith(lowerQuery);
    });

    // If we have array operation items in filtered results, add separator
    const hasArrayOps = filtered.some(item => item.isArrayOp);
    const hasRegularFields = filtered.some(item => !item.isArrayOp);

    if (hasArrayOps && hasRegularFields) {
      const regularItems = filtered.filter(item => !item.isArrayOp);
      const arrayOpItems = filtered.filter(item => item.isArrayOp);

      return [
        ...regularItems,
        {
          value: '__separator__',
          label: '── Array Operations ──',
          type: 'separator',
          isSeparator: true
        },
        ...arrayOpItems
      ];
    }

    return filtered;
  }

  /**
   * Check if a field is binary for a specific table
   * @param {string} fieldName - Field name
   * @param {string} tableName - Table name
   * @returns {boolean} True if binary
   */
  isBinaryFieldForTable(fieldName, tableName) {
    const schema = getTableSchema(tableName);
    if (!schema) return false;

    const fields = schema.fields || [];
    const field = fields.find(f => f.name === fieldName);
    return field ? field.type === 'binary' : false;
  }

  /**
   * Get array fields for the current table
   * @returns {object} Object mapping field names to array info
   */
  getArrayFields() {
    if (!this.currentSchema) {
      return {};
    }
    return this.getArrayFieldsForTable(this.currentTable);
  }

  /**
   * Get array fields for a specific table
   * @param {string} tableName - Table name
   * @returns {object} Object mapping field names to array info
   */
  getArrayFieldsForTable(tableName) {
    const schema = getTableSchema(tableName);
    if (!schema) return {};

    const result = {};
    const fields = schema.fields || [];

    for (const field of fields) {
      if (field.isArrayStruct) {
        result[field.name] = {
          type: 'array<struct>',
          elementFields: field.elementFields || []
        };
      } else if (field.isArrayPrimitive) {
        result[field.name] = {
          type: field.type,
          elementType: field.elementType || 'unknown'
        };
      }
    }

    return result;
  }

  /**
   * Get priority hints for array field subfields
   * @returns {object} Object mapping array field names to suggested subfields
   */
  getArrayFieldHints() {
    return {
      arms: { suggestedSubField: 'action_id' },
      actions: { suggestedSubField: 'action_id' },
      losing_bids: { suggestedSubField: 'cid' },
      mmp_trackings: { suggestedSubField: 'mmp_event' },
      topics: { suggestedSubField: 'id' }
    };
  }
}
