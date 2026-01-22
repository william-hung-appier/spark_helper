/**
 * Table Mappings Index
 *
 * This file provides a unified interface to access table-specific
 * field mappings and WHERE conditions.
 *
 * Individual mapping files are loaded via script tags in popup.html.
 */

const TABLE_MAPPINGS = {
  imp_join_all2: IMP_JOIN_ALL2_MAPPINGS,
  creative_event: CREATIVE_EVENT_MAPPINGS,
  creative_perf_event: CREATIVE_PERF_EVENT_MAPPINGS,
  creative_quality: CREATIVE_QUALITY_MAPPINGS
};

/**
 * Get field mappings for a table
 * @param {string} tableName - Table name
 * @returns {object} Field mappings object or empty object
 */
function getFieldMappings(tableName) {
  const mappings = TABLE_MAPPINGS[tableName];
  return mappings ? mappings.fields : {};
}

/**
 * Get WHERE conditions for a table
 * @param {string} tableName - Table name
 * @returns {object} WHERE conditions object or empty object
 */
function getWhereConditions(tableName) {
  const mappings = TABLE_MAPPINGS[tableName];
  return mappings ? mappings.conditions : {};
}

/**
 * Check if a table has custom mappings
 * @param {string} tableName - Table name
 * @returns {boolean} True if table has mappings
 */
function hasTableMappings(tableName) {
  return tableName in TABLE_MAPPINGS;
}
