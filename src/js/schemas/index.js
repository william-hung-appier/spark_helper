/**
 * Schema Index
 * Auto-generated - DO NOT EDIT MANUALLY
 *
 * This file provides a mapping of table names to their schemas.
 * Individual schema files are loaded via script tags in popup.html.
 */

const TABLE_SCHEMAS = {
  "imp_join_all2": IMP_JOIN_ALL2_SCHEMA,
  "creative_event": CREATIVE_EVENT_SCHEMA,
  "creative_perf_event": CREATIVE_PERF_EVENT_SCHEMA,
  "creative_quality": CREATIVE_QUALITY_SCHEMA
};

/**
 * Get schema for a table
 * @param {string} tableName - Table name
 * @returns {object|null} Schema object or null if not found
 */
function getTableSchema(tableName) {
  return TABLE_SCHEMAS[tableName] || null;
}

/**
 * Get list of supported table names
 * @returns {Array} Array of table names
 */
function getSupportedTables() {
  return Object.keys(TABLE_SCHEMAS);
}
