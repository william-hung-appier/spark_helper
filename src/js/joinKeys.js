/**
 * Common join keys between table pairs
 * Used to suggest likely join fields in the ON clause
 */
const COMMON_JOIN_KEYS = {
  'creative_event:imp_join_all2': ['cid', 'oid', 'campaign_id'],
  'creative_perf_event:imp_join_all2': ['cid', 'oid', 'campaign_id'],
  'creative_quality:imp_join_all2': ['cid', 'oid'],
  'creative_event:creative_perf_event': ['cid', 'type'],
  'creative_event:creative_quality': ['cid'],
  'creative_perf_event:creative_quality': ['cid']
};

/**
 * Get suggested join keys for a table pair
 * @param {string} table1 - First table name
 * @param {string} table2 - Second table name
 * @returns {Array} Array of suggested field names
 */
function getJoinKeySuggestions(table1, table2) {
  // Sort table names to create consistent lookup key
  const key = [table1, table2].sort().join(':');
  return COMMON_JOIN_KEYS[key] || [];
}
