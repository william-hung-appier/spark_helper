/**
 * Quick Queries - Predefined query templates for common use cases
 */

const QUICK_QUERIES = {
  distinct_type_all: {
    label: 'DISTINCT type (all creative tables)',
    tables: [
      { name: 'creative_perf_event', field: 'type' },
      { name: 'creative_quality', field: 'type' },
      { name: 'creative_event', field: 'event_type' }
    ],
    outputAlias: 'type',
    requiresTimeRange: true
  }
};
