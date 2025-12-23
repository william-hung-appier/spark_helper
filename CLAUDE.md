# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension (Manifest v3) that helps generate Spark SQL queries for the `imp_join_all2` table. It provides a visual query builder interface to compose complex SQL with predefined field mappings and UDFs.

## Architecture

### Core Components

1. **Field Mapping System** (`fieldMappings.js`)
   - Central source of truth for SQL field definitions and WHERE conditions
   - Maps user-friendly field names to complex Spark SQL expressions
   - All predefined fields use custom Spark UDFs: `CID2OID()`, `BYTES2STR()`, `NVL()`, `APPTYPE2NAME()`, `PARTNERID2STR()`, `OS2STR()`
   - The `channel` field has complex CASE logic: returns `bundle_id` for apps, `web_host` for web

2. **Schema Parser System** (`schemaParser.js`, `defaultSchema.js`)
   - Fetches field schema from the Appier Data Catalog webpage
   - Parses HTML table to extract field names and types
   - Falls back to default HTML template if user is not logged in
   - Merges schema fields with customize fields from `FIELD_MAPPINGS`
   - Dropdown displays fields as `<Field Name> | <Field Type>` or `<Field Name> | Customize`

3. **Query Generation Flow** (`popup.js`)
   - Dynamic field/condition management with unique timestamp-based IDs
   - Timezone conversion: User's local timezone → UTC (YYYYMMDDHH format)
   - Table naming pattern: `{table}_{startYYYYMMDDHH}_{endYYYYMMDDHH}`
   - Multi-line SQL handling preserves formatting from field mappings
   - State is ephemeral (no persistence between popup sessions)

3. **UI Patterns** (`popup.html`)
   - Dynamic DOM: fields and conditions added/removed via buttons
   - Auto-population: selecting predefined field auto-fills alias and disables editing
   - Custom field/condition options allow free-form SQL input
   - Generate button triggers query assembly, Copy button uses `document.execCommand('copy')`

### Data Model

The extension targets Appier's `imp_join_all2` table which contains:

- RTB (Real-Time Bidding) event data
- Fields stored in custom formats requiring UDF conversion
- Time-partitioned data (YYYYMMDDHH granularity)

Common query pattern:

```sql
SELECT
  CID2OID(cid) AS oid,
  CASE WHEN ... END AS channel
FROM
  imp_join_all2_2024120100_2024120200
WHERE
  is_external IS NULL AND win_time IS NOT NULL  -- RTB win bids only
```

## Development Commands

This is a pure client-side Chrome extension with no build process.

### Testing the Extension

1. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select this directory

2. **Reload after changes:**
   - Go to `chrome://extensions/`
   - Click reload button under "Appier Spark Helper"

3. **Test the popup:**
   - Click the extension icon in Chrome toolbar
   - Or use Chrome DevTools on the popup: right-click extension icon → "Inspect popup"

### No Build/Test Commands

There are no npm/build/test scripts. All files are loaded directly by Chrome.

## Adding New Features

### Add a new predefined field (Customize field)

1. Add to `FIELD_MAPPINGS` in `fieldMappings.js`:

   ```javascript
   new_field: {
     sql: 'SPARK_UDF(column_name)',
     alias: 'new_field'
   }
   ```

2. The field will automatically appear in the "Customize Fields" group in the dropdown

### Add a new WHERE condition

1. Add to `WHERE_CONDITIONS` in `fieldMappings.js`
2. Add `<option>` to condition selector in `addWhereCondition()` (popup.js:76-80)
3. Add handling logic in `generateQuery()` (popup.js:182-193)

### Add a new timezone

1. Add `<option>` to timezone select in `popup.html` (line 37-41)
2. `formatDateTimeWithTimezone()` automatically handles any offset

## Key Constraints

- **No persistence**: All query state is lost when popup closes
- **Table-specific**: Hardcoded for `imp_join_all2` schema and UDFs
- **UTC output only**: All time ranges converted to UTC for Spark queries
- **Manifest v3**: Uses modern Chrome extension APIs (no background scripts)
- **Copy API**: Uses deprecated `document.execCommand('copy')` - consider updating to Clipboard API
- **Schema Fetching**: Requires host permission for `data-catalog.dp.arepa.appier.info`; falls back to embedded HTML if fetch fails or user is not logged in
