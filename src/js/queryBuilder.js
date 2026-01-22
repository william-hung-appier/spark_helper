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
   * Handles custom mappings, binary fields, and regular fields
   * @param {object} fieldData - Field data from UI
   * @returns {string|null} SQL SELECT expression or null
   */
  buildSelectPart(fieldData) {
    const { fieldName, fieldType, isCustom, isBinary, sql, alias } = fieldData;

    if (!fieldName) return null;

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
   * @returns {string|null} SQL WHERE expression or null
   */
  buildFieldCondition(conditionData) {
    const { fieldName, isBinary, operator, value, values } = conditionData;

    if (!fieldName) return null;

    // Determine the field expression (wrap binary fields with BYTES2STR)
    const isBinaryField = isBinary || this.state.isBinaryField(fieldName);
    const fieldExpr = isBinaryField ? `BYTES2STR(${fieldName})` : fieldName;

    if (operator === '=') {
      if (!value && value !== 0) return null;
      const escapedValue = this.escapeSqlString(value);
      return `  ${fieldExpr} = '${escapedValue}'`;
    }

    if (operator === 'IN' || operator === 'NOT IN') {
      if (!values || values.length === 0) return null;
      const escapedValues = values
        .map(v => `'${this.escapeSqlString(v.trim())}'`)
        .join(', ');
      return `  ${fieldExpr} ${operator} (${escapedValues})`;
    }

    return null;
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
