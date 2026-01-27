/**
 * QueryBuilder - Generates Spark SQL queries from UI data
 */

class QueryBuilder {
  constructor(state) {
    this.state = state;
  }

  /**
   * Parse date-time input string
   * @param {string} dateTimeStr - Date string in YYYY-MM-DD or YYYY-MM-DD-HH format
   * @returns {object|null} Parsed date parts or null
   */
  parseDateTimeInput(dateTimeStr) {
    if (!dateTimeStr) return null;

    const parts = dateTimeStr.split('-');
    const isValidLength = parts.length >= 3 && parts.length <= 4;
    if (!isValidLength) return null;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const hour = parts.length === 4 ? parseInt(parts[3], 10) : 0;

    const hasInvalidNumber = [year, month, day, hour].some(isNaN);
    if (hasInvalidNumber) return null;

    return { year, month, day, hour };
  }

  /**
   * Convert parsed date to a Date object for comparison
   * @param {string} dateTimeStr - Date string in YYYY-MM-DD or YYYY-MM-DD-HH format
   * @returns {Date|null} Date object or null if invalid
   */
  parseToDate(dateTimeStr) {
    const parsed = this.parseDateTimeInput(dateTimeStr);
    if (!parsed) return null;

    const { year, month, day, hour } = parsed;
    return new Date(year, month - 1, day, hour);
  }

  /**
   * Validate that end time is greater than start time
   * @param {string} startTime - Start time string
   * @param {string} endTime - End time string
   * @returns {object} Validation result { valid: boolean, error: string|null }
   */
  validateTimeRange(startTime, endTime) {
    if (!startTime || !endTime) {
      return { valid: false, error: 'Please enter start and end time' };
    }

    const startDate = this.parseToDate(startTime);
    const endDate = this.parseToDate(endTime);

    if (!startDate) {
      return { valid: false, error: 'Invalid start time format (use YYYY-MM-DD or YYYY-MM-DD-HH)' };
    }

    if (!endDate) {
      return { valid: false, error: 'Invalid end time format (use YYYY-MM-DD or YYYY-MM-DD-HH)' };
    }

    if (endDate <= startDate) {
      return { valid: false, error: 'End time must be greater than start time' };
    }

    return { valid: true, error: null };
  }

  /**
   * Convert local time to UTC
   * @param {string} dateTimeStr - Date string
   * @param {string} timezoneOffset - Timezone offset
   * @returns {string} UTC date string in YYYYMMDDHH format
   */
  formatDateTimeToUTC(dateTimeStr, timezoneOffset) {
    const parsed = this.parseDateTimeInput(dateTimeStr);
    if (!parsed) return dateTimeStr;

    const { year, month, day, hour } = parsed;
    const offsetHours = parseInt(timezoneOffset, 10);
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour - offsetHours));

    const utcYear = utcDate.getUTCFullYear();
    const utcMonth = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    const utcDay = String(utcDate.getUTCDate()).padStart(2, '0');
    const utcHour = String(utcDate.getUTCHours()).padStart(2, '0');

    return `${utcYear}${utcMonth}${utcDay}${utcHour}`;
  }

  /**
   * Build SELECT part for a single field
   * Handles custom mappings, binary fields, array operations, and regular fields
   * @param {object} fieldData - Field data from UI
   * @returns {string|null} SQL SELECT expression or null
   */
  buildSelectPart(fieldData) {
    const { fieldName, fieldType, isCustom, isBinary, sql, alias } = fieldData;

    if (!fieldName) return null;

    // Handle array operations
    if (fieldData.isArrayOp || fieldType === 'array-op') {
      return this.buildArrayOperationSelect(fieldData);
    }

    // Custom mapping with predefined SQL (e.g., oid, channel)
    if (isCustom && sql) {
      const finalAlias = alias || fieldName;
      return `  ${sql} AS ${finalAlias}`;
    }

    // Regular schema field or user-typed field
    const finalAlias = alias || this.getBaseName(fieldName);

    // Check if binary field needs BYTES2STR wrapping
    // Check both the passed isBinary flag AND the schema directly
    // This handles cases where user types field name without selecting from dropdown
    const isBinaryField = isBinary || this.state.isBinaryField(fieldName);

    if (isBinaryField && !this.state.isFieldCoveredByMapping(fieldName)) {
      return `  BYTES2STR(${fieldName}) AS ${finalAlias}`;
    }

    return `  ${fieldName} AS ${finalAlias}`;
  }

  /**
   * Build SELECT part for array operations (EXISTS, COUNT, FILTER)
   * @param {object} fieldData - Field data with array operation info
   * @param {string} prefix - Optional table prefix (t1, t2) for JOIN mode
   * @returns {string|null} SQL SELECT expression or null
   */
  buildArrayOperationSelect(fieldData, prefix = null) {
    const { fieldName, operation, subField, subFieldType, matchValue, alias } = fieldData;

    if (!fieldName || !operation || !matchValue) return null;

    const escapedValue = this.escapeSqlString(matchValue);
    const prefixedField = prefix ? `${prefix}.${fieldName}` : fieldName;

    // Determine value quoting based on type
    const isNumericType = subFieldType && ['integer', 'long', 'double', 'float', 'int'].includes(subFieldType.toLowerCase());
    const quotedValue = isNumericType ? escapedValue : `'${escapedValue}'`;

    // Build the lambda expression
    const lambda = subField
      ? `x -> x.${subField} = ${quotedValue}`   // struct array: x.action_id = 'value'
      : `x -> x = ${quotedValue}`;               // primitive array: x = 7

    const finalAlias = alias || this.generateArrayOpAlias(fieldName, subField, operation);

    switch (operation) {
      case 'EXISTS':
        // IF(EXISTS(arms, x -> x.action_id = 'value'), 1, 0) AS alias
        return `  IF(EXISTS(${prefixedField}, ${lambda}), 1, 0) AS ${finalAlias}`;

      case 'COUNT':
        // SIZE(FILTER(arms, x -> x.action_id = 'value')) AS alias
        return `  SIZE(FILTER(${prefixedField}, ${lambda})) AS ${finalAlias}`;

      case 'FILTER':
        // FILTER(arms, x -> x.action_id = 'value') AS alias
        return `  FILTER(${prefixedField}, ${lambda}) AS ${finalAlias}`;

      default:
        return null;
    }
  }

  /**
   * Generate default alias for array operations
   * @param {string} fieldName - Array field name
   * @param {string} subField - Sub-field name (null for primitive arrays)
   * @param {string} operation - Operation (EXISTS, COUNT, FILTER)
   * @returns {string} Generated alias
   */
  generateArrayOpAlias(fieldName, subField, operation) {
    const parts = [fieldName];
    if (subField) parts.push(subField);
    parts.push(operation.toLowerCase());
    return parts.join('_');
  }

  /**
   * Get base name from a potentially dotted field name
   * @param {string} fieldName - Field name
   * @returns {string} Base name
   */
  getBaseName(fieldName) {
    return fieldName.includes('.') ? fieldName.split('.').pop() : fieldName;
  }

  /**
   * Escape single quotes in SQL string values
   * @param {string} value - Value to escape
   * @returns {string} Escaped value
   */
  escapeSqlString(value) {
    if (value == null) return '';
    return String(value).replace(/'/g, "''");
  }

  /**
   * Check if a field type is numeric (should not be quoted in SQL)
   * @param {string} fieldType - Field type from schema
   * @returns {boolean} True if numeric type
   */
  isNumericType(fieldType) {
    if (!fieldType) return false;
    const numericTypes = ['integer', 'int', 'long', 'double', 'float', 'decimal', 'short', 'byte'];
    return numericTypes.includes(fieldType.toLowerCase());
  }

  /**
   * Check if a value looks numeric (can be safely used without quotes)
   * @param {string} value - Value to check
   * @returns {boolean} True if value looks numeric
   */
  isNumericValue(value) {
    if (value == null || value === '') return false;
    // Match integers, decimals, negative numbers, scientific notation
    return /^-?\d+\.?\d*([eE][+-]?\d+)?$/.test(String(value).trim());
  }

  /**
   * Build WHERE part for a single condition (handles both field and template conditions)
   * @param {object} conditionData - Condition data from UI
   * @returns {string|null} SQL WHERE expression or null
   */
  buildWherePart(conditionData) {
    if (!conditionData) return null;

    // Handle field-based conditions
    if (conditionData.type === 'field') {
      return this.buildFieldCondition(conditionData);
    }

    // Handle template conditions (legacy behavior)
    const { conditionType, customValue } = conditionData;

    if (!conditionType) return null;

    if (conditionType === 'custom') {
      return customValue ? `  ${customValue}` : null;
    }

    const conditions = this.state.getWhereConditions();
    const condition = conditions[conditionType];
    return condition ? `  ${condition.sql}` : null;
  }

  /**
   * Build SQL for a field-based condition
   * @param {object} conditionData - Field condition data
   * @param {string} prefix - Optional table prefix for JOIN mode
   * @returns {string|null} SQL WHERE expression or null
   */
  buildFieldCondition(conditionData, prefix = null) {
    const { fieldName, fieldType, isBinary, operator, value, values, sql, isCustom } = conditionData;

    if (!fieldName) return null;

    // Handle array operation conditions
    if (conditionData.isArrayOp) {
      return this.buildArrayOperationCondition(conditionData, prefix);
    }

    // Determine the field expression
    let fieldExpr;
    if (isCustom && sql) {
      // Use custom SQL expression (e.g., NVL(PARTNERID2STR(partner_id), ''))
      // For custom functions, don't add prefix - they already reference the correct field
      fieldExpr = sql;
    } else {
      // Regular field - wrap binary fields with BYTES2STR, add prefix if needed
      const isBinaryField = isBinary || this.state.isBinaryField(fieldName);
      const prefixedField = prefix ? `${prefix}.${fieldName}` : fieldName;
      fieldExpr = isBinaryField ? `BYTES2STR(${prefixedField})` : prefixedField;
    }

    // For custom functions that return strings, always quote values
    // For schema fields, check the type
    const resolvedType = fieldType || this.state.getFieldType(fieldName);
    // Custom functions typically return strings, so treat them as non-numeric
    const isNumericField = !isCustom && this.isNumericType(resolvedType);

    if (operator === '=') {
      if (!value && value !== 0) return null;
      const escapedValue = this.escapeSqlString(value);
      // Only skip quotes if field is numeric AND value is numeric
      const shouldQuote = !(isNumericField && this.isNumericValue(value));
      const formattedValue = shouldQuote ? `'${escapedValue}'` : escapedValue;
      return `  ${fieldExpr} = ${formattedValue}`;
    }

    if (operator === 'IN' || operator === 'NOT IN') {
      if (!values || values.length === 0) return null;
      const escapedValues = values
        .map(v => {
          const escaped = this.escapeSqlString(v.trim());
          // Only skip quotes if field is numeric AND this value is numeric
          const shouldQuote = !(isNumericField && this.isNumericValue(v.trim()));
          return shouldQuote ? `'${escaped}'` : escaped;
        })
        .join(', ');
      return `  ${fieldExpr} ${operator} (${escapedValues})`;
    }

    return null;
  }

  /**
   * Build WHERE condition for array operations (EXISTS pattern)
   * @param {object} conditionData - Condition data with array operation info
   * @param {string} prefix - Optional table prefix for JOIN mode
   * @returns {string|null} SQL WHERE expression or null
   */
  buildArrayOperationCondition(conditionData, prefix = null) {
    const { fieldName, operation, subField, subFieldType, matchValue, value } = conditionData;
    const matchVal = matchValue || value;

    if (!fieldName || !matchVal) return null;

    const escapedValue = this.escapeSqlString(matchVal);
    const prefixedField = prefix ? `${prefix}.${fieldName}` : fieldName;

    // Determine value quoting based on type
    const isNumericType = subFieldType && ['integer', 'long', 'double', 'float', 'int'].includes(subFieldType.toLowerCase());
    const quotedValue = isNumericType ? escapedValue : `'${escapedValue}'`;

    // Build the lambda expression
    const lambda = subField
      ? `x -> x.${subField} = ${quotedValue}`   // struct array
      : `x -> x = ${quotedValue}`;               // primitive array

    // For WHERE clause, always use EXISTS pattern (no IF wrapper needed)
    return `  EXISTS(${prefixedField}, ${lambda})`;
  }

  /**
   * Build FROM clause with table name and time range
   * @param {string} tableName - Table name
   * @param {string} startTime - Start time
   * @param {string} endTime - End time
   * @param {string} timezone - Timezone offset
   * @returns {string} FROM clause
   */
  buildFromClause(tableName, startTime, endTime, timezone) {
    if (!startTime || !endTime) return tableName;

    const adjustedStart = this.formatDateTimeToUTC(startTime, timezone);
    const adjustedEnd = this.formatDateTimeToUTC(endTime, timezone);
    return `${tableName}_${adjustedStart}_${adjustedEnd}`;
  }

  /**
   * Build JOIN clause with table alias and time range
   * @param {string} joinType - JOIN type
   * @param {string} tableName - Table name
   * @param {string} startTime - Start time
   * @param {string} endTime - End time
   * @param {string} timezone - Timezone offset
   * @param {string} alias - Table alias (t2)
   * @returns {string} JOIN clause
   */
  buildJoinClause(joinType, tableName, startTime, endTime, timezone, alias) {
    const tableWithTime = this.buildFromClause(tableName, startTime, endTime, timezone);
    return `${joinType}\n  ${tableWithTime} ${alias}`;
  }

  /**
   * Resolve field expression for JOIN ON clause
   * Handles custom mappings by extracting SQL and prefixing field references
   * @param {string} fieldName - Field name (may be custom mapping key)
   * @param {string} tableName - Table name to check for custom mappings
   * @param {string} alias - Table alias (t1 or t2)
   * @returns {string} SQL expression for the field
   */
  resolveOnFieldExpression(fieldName, tableName, alias) {
    // Check if this field has a custom mapping for the table
    const mappings = TABLE_MAPPINGS[tableName];
    const customField = mappings?.fields?.[fieldName];

    if (customField && customField.sql) {
      // Custom mapping found - prefix field references in the SQL
      // e.g., "BYTES2STR(bid_appier_id)" -> "BYTES2STR(t1.bid_appier_id)"
      const sql = customField.sql;

      // Extract field names from the SQL and prefix them
      // This handles patterns like: BYTES2STR(field), CID2OID(field), NVL(field, '')
      const prefixedSql = sql.replace(
        /\b([a-z_][a-z0-9_]*)\b(?=\s*[,)])/gi,
        (match, field) => {
          // Don't prefix SQL keywords, function names, or string literals
          const upperMatch = match.toUpperCase();
          const sqlKeywords = ['NULL', 'AS', 'AND', 'OR', 'NOT', 'IN', 'IS', 'LIKE', 'BETWEEN', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'];
          const sparkFunctions = ['BYTES2STR', 'CID2OID', 'NVL', 'COALESCE', 'IF', 'CONCAT', 'SUBSTR', 'TRIM', 'UPPER', 'LOWER', 'APPTYPE2NAME', 'PARTNERID2STR', 'OS2STR'];

          if (sqlKeywords.includes(upperMatch) || sparkFunctions.includes(upperMatch)) {
            return match;
          }
          return `${alias}.${field}`;
        }
      );

      return prefixedSql;
    }

    // Check if the field is binary and needs BYTES2STR wrapping
    const isBinary = this.state.schemaParser?.isBinaryFieldForTable(fieldName, tableName);
    if (isBinary) {
      return `BYTES2STR(${alias}.${fieldName})`;
    }

    // Regular field - just prefix with alias
    return `${alias}.${fieldName}`;
  }

  /**
   * Build ON clause for JOIN
   * @param {string} field1 - Field from first table
   * @param {string} field2 - Field from second table
   * @param {string} table1 - First table name (for custom mapping lookup)
   * @param {string} table2 - Second table name (for custom mapping lookup)
   * @returns {string} ON clause
   */
  buildOnClause(field1, field2, table1, table2) {
    const expr1 = this.resolveOnFieldExpression(field1, table1, 't1');
    const expr2 = this.resolveOnFieldExpression(field2, table2, 't2');
    return `ON ${expr1} = ${expr2}`;
  }

  /**
   * Generate SQL query with JOIN
   * @param {object} config - Query configuration
   * @returns {string} Generated SQL query
   */
  generateJoinQuery(config) {
    const {
      fieldRowsT1,
      fieldRowsT2,
      conditionRows,
      table1,
      table2,
      joinType,
      onField1,
      onField2,
      startTime,
      endTime,
      timezone,
      isDistinct
    } = config;

    // Build SELECT parts with table prefixes
    const selectPartsT1 = fieldRowsT1
      .map(row => this.buildSelectPartWithPrefix(row, 't1', table1))
      .filter(Boolean);

    const selectPartsT2 = fieldRowsT2
      .map(row => this.buildSelectPartWithPrefix(row, 't2', table2))
      .filter(Boolean);

    const allSelectParts = [...selectPartsT1, ...selectPartsT2];

    // Build WHERE parts with table prefixes
    const whereParts = conditionRows
      .map(row => this.buildWherePartWithPrefix(row))
      .filter(Boolean);

    // Build FROM clause with alias
    const fromClause = this.buildFromClause(table1, startTime, endTime, timezone);

    // Build JOIN clause
    const joinClause = this.buildJoinClause(joinType, table2, startTime, endTime, timezone, 't2');

    // Build ON clause with custom field resolution
    const onClause = this.buildOnClause(onField1, onField2, table1, table2);

    // Assemble query
    let query = isDistinct ? 'SELECT DISTINCT\n' : 'SELECT\n';

    if (allSelectParts.length > 0) {
      query += allSelectParts.join(',\n');
    }

    query += '\nFROM\n';
    query += `  ${fromClause} t1\n`;
    query += joinClause + '\n';
    query += onClause;

    if (whereParts.length > 0) {
      query += '\nWHERE\n';
      query += whereParts.join('\n  AND ');
    }

    return query;
  }

  /**
   * Build SELECT part with table prefix
   * @param {object} fieldData - Field data
   * @param {string} prefix - Table prefix (t1 or t2)
   * @param {string} tableName - Table name for binary check
   * @returns {string|null} SQL SELECT expression
   */
  buildSelectPartWithPrefix(fieldData, prefix, tableName) {
    const { fieldName, fieldType, isCustom, isBinary, sql, alias } = fieldData;

    if (!fieldName) return null;

    // Handle array operations with prefix
    if (fieldData.isArrayOp || fieldType === 'array-op') {
      return this.buildArrayOperationSelect(fieldData, prefix);
    }

    // Custom mapping with predefined SQL
    if (isCustom && sql) {
      // Replace field references with prefixed versions
      const prefixedSql = sql.replace(/(\w+)(?=\s*[,)]|$)/g, (match) => {
        // Don't prefix function names or string literals
        if (/^[A-Z_]+$/.test(match) || /^'/.test(match)) {
          return match;
        }
        return `${prefix}.${match}`;
      });
      const finalAlias = alias || fieldName;
      return `  ${prefixedSql} AS ${finalAlias}`;
    }

    // Regular schema field
    const finalAlias = alias || this.getBaseName(fieldName);
    const prefixedField = `${prefix}.${fieldName}`;

    // Check if binary field needs BYTES2STR wrapping
    const isBinaryField = isBinary || this.state.schemaParser?.isBinaryFieldForTable(fieldName, tableName);

    if (isBinaryField) {
      return `  BYTES2STR(${prefixedField}) AS ${finalAlias}`;
    }

    return `  ${prefixedField} AS ${finalAlias}`;
  }

  /**
   * Build WHERE part with table prefix
   * @param {object} conditionData - Condition data
   * @returns {string|null} SQL WHERE expression
   */
  buildWherePartWithPrefix(conditionData) {
    if (!conditionData) return null;

    // Handle field-based conditions with prefix
    if (conditionData.type === 'field') {
      const { fieldName, fieldType, tablePrefix, isBinary, operator, value, values, sql, isCustom } = conditionData;

      if (!fieldName) return null;

      const prefix = tablePrefix || 't1';

      // Handle array operation conditions
      if (conditionData.isArrayOp) {
        return this.buildArrayOperationCondition(conditionData, prefix);
      }

      // Determine the field expression
      let fieldExpr;
      if (isCustom && sql) {
        // Use custom SQL expression (e.g., NVL(PARTNERID2STR(partner_id), ''))
        // For custom functions, don't add prefix - they already reference the correct field
        fieldExpr = sql;
      } else {
        // Regular field - wrap binary fields with BYTES2STR, add prefix
        const prefixedField = `${prefix}.${fieldName}`;
        fieldExpr = isBinary ? `BYTES2STR(${prefixedField})` : prefixedField;
      }

      // For custom functions that return strings, always quote values
      // For schema fields, check the type
      const resolvedType = fieldType || this.state.getFieldType(fieldName);
      const isNumericField = !isCustom && this.isNumericType(resolvedType);

      if (operator === '=') {
        if (!value && value !== 0) return null;
        const escapedValue = this.escapeSqlString(value);
        // Only skip quotes if field is numeric AND value is numeric
        const shouldQuote = !(isNumericField && this.isNumericValue(value));
        const formattedValue = shouldQuote ? `'${escapedValue}'` : escapedValue;
        return `  ${fieldExpr} = ${formattedValue}`;
      }

      if (operator === 'IN' || operator === 'NOT IN') {
        if (!values || values.length === 0) return null;
        const escapedValues = values
          .map(v => {
            const escaped = this.escapeSqlString(v.trim());
            // Only skip quotes if field is numeric AND this value is numeric
            const shouldQuote = !(isNumericField && this.isNumericValue(v.trim()));
            return shouldQuote ? `'${escaped}'` : escaped;
          })
          .join(', ');
        return `  ${fieldExpr} ${operator} (${escapedValues})`;
      }

      return null;
    }

    // Template conditions pass through as-is
    return this.buildWherePart(conditionData);
  }

  /**
   * Generate complete SQL query
   * @param {object} config - Query configuration
   * @returns {string} Generated SQL query
   */
  generate(config) {
    const { fieldRows, conditionRows, tableName, startTime, endTime, timezone, isDistinct } = config;

    const selectParts = fieldRows
      .map(row => this.buildSelectPart(row))
      .filter(Boolean);

    const whereParts = conditionRows
      .map(row => this.buildWherePart(row))
      .filter(Boolean);

    const fromClause = this.buildFromClause(tableName, startTime, endTime, timezone);

    let query = isDistinct ? 'SELECT DISTINCT\n' : 'SELECT\n';

    if (selectParts.length > 0) {
      query += selectParts.join(',\n');
    }

    query += '\nFROM\n';
    query += `  ${fromClause}`;

    if (whereParts.length > 0) {
      query += '\nWHERE\n';
      query += whereParts.join('\n  AND ');
    }

    return query;
  }

  /**
   * Generate a quick query from predefined template
   * @param {string} queryKey - Quick query key
   * @param {object} options - Query options (startTime, endTime, timezone)
   * @returns {string} Generated SQL query
   */
  generateQuickQuery(queryKey, options) {
    const config = QUICK_QUERIES[queryKey];
    if (!config) {
      console.error(`Quick query configuration not found: ${queryKey}`);
      return '-- Error: Quick query configuration not found';
    }

    return this.generateUnionDistinct({
      tables: config.tables,
      outputAlias: config.outputAlias,
      startTime: options.startTime,
      endTime: options.endTime,
      timezone: options.timezone
    });
  }

  /**
   * Generate UNION ALL query for DISTINCT values across multiple tables
   * @param {object} options - Generation options
   * @param {Array} options.tables - Array of {name, field} objects
   * @param {string} options.outputAlias - Unified column name in output
   * @param {string} options.startTime - Start time
   * @param {string} options.endTime - End time
   * @param {string} options.timezone - Timezone offset
   * @returns {string} Generated UNION ALL query
   */
  generateUnionDistinct(options) {
    const { tables, outputAlias, startTime, endTime, timezone } = options;

    const queries = tables.map(({ name, field }) => {
      const tableWithTime = this.buildFromClause(name, startTime, endTime, timezone);
      return `SELECT '${name}' AS table_name, ${field} AS ${outputAlias}
FROM ${tableWithTime}`;
    });

    return `SELECT DISTINCT table_name, ${outputAlias}
FROM (
${queries.join('\nUNION ALL\n')}
)
ORDER BY table_name, ${outputAlias}`;
  }
}
