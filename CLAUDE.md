# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension (Manifest v3) that helps generate Spark SQL queries for the `imp_join_all2` table. It provides a visual query builder interface to compose complex SQL with predefined field mappings and UDFs.

## Project Structure

```text
spark_helper/
├── manifest.json           # Extension configuration (Manifest v3)
├── popup.html              # UI interface definition
├── src/
│   ├── js/
│   │   ├── app.js          # Main entry point, event wiring
│   │   ├── state.js        # AppState class for state management
│   │   ├── queryBuilder.js # QueryBuilder class for SQL generation
│   │   ├── ui.js           # UIManager class for DOM operations
│   │   ├── schemaParser.js # SchemaParser class for field fetching
│   │   ├── fieldMappings.js# Field and condition definitions
│   │   └── defaultSchema.js# Fallback HTML schema template
│   ├── css/
│   │   └── styles.css      # Styling
│   └── assets/
│       └── icon.svg        # Extension icon
└── spec/                   # Version specification documents
```

## Architecture

### Core Classes

1. **AppState** (`src/js/state.js`)
   - Centralized state management
   - Stores available fields and query type
   - Provides helper methods for field filtering

2. **QueryBuilder** (`src/js/queryBuilder.js`)
   - SQL query generation logic
   - Timezone conversion (local → UTC)
   - Builds SELECT, FROM, and WHERE clauses

3. **UIManager** (`src/js/ui.js`)
   - DOM manipulation and event handling
   - Field/condition row creation and management
   - Clipboard operations (modern API with fallback)

4. **SchemaParser** (`src/js/schemaParser.js`)
   - Fetches field schema from Appier Data Catalog
   - Parses HTML table to extract field names and types
   - Auto-generates BYTES2STR mappings for binary fields
   - Falls back to embedded HTML template if fetch fails

5. **Field Mappings** (`src/js/fieldMappings.js`)
   - `FIELD_MAPPINGS`: Predefined SQL field expressions
   - `WHERE_CONDITIONS`: Predefined WHERE clause templates
   - Uses Spark UDFs: `CID2OID()`, `BYTES2STR()`, `NVL()`, `APPTYPE2NAME()`, `PARTNERID2STR()`, `OS2STR()`

### Data Flow

```text
popup.html (UI)
    ↓
app.js (Event handlers)
    ↓
UIManager (DOM operations) ← AppState (State)
    ↓
SchemaParser (Field fetching) ← defaultSchema.js (Fallback)
    ↓
QueryBuilder (SQL generation) ← fieldMappings.js (SQL templates)
    ↓
queryOutput textarea
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

## Adding New Features

### Add a new predefined field

Add to `FIELD_MAPPINGS` in `src/js/fieldMappings.js`:

```javascript
new_field: {
  sql: 'SPARK_UDF(column_name)',
  alias: 'new_field'
}
```

The field will automatically appear in the "Customize Fields" dropdown group.

### Add a new WHERE condition

1. Add to `WHERE_CONDITIONS` in `src/js/fieldMappings.js`
2. Add `<option>` in `UIManager.addConditionRow()` in `src/js/ui.js`
3. Add handling in `QueryBuilder.buildWherePart()` in `src/js/queryBuilder.js`

### Add a new timezone

Add `<option>` to timezone select in `popup.html`. The `QueryBuilder.formatDateTimeToUTC()` handles any offset automatically.

## Key Constraints

- **No persistence**: All query state is lost when popup closes
- **Table-specific**: Hardcoded for `imp_join_all2` schema and UDFs
- **UTC output only**: All time ranges converted to UTC for Spark queries
- **Manifest v3**: Uses modern Chrome extension APIs (no background scripts)
- **Schema Fetching**: Requires host permission for `data-catalog.dp.arepa.appier.info`; falls back to embedded HTML if fetch fails or user is not logged in
