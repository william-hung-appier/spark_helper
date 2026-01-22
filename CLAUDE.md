# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension (Manifest v3) that helps generate Spark SQL queries for multiple tables. It provides a visual query builder interface with searchable field selection, predefined field mappings, and automatic binary field handling.

## Supported Tables

- `imp_join_all2` - AD session logs (199 fields)
- `creative_event` - Creative user behavior logs (25 fields)
- `creative_perf_event` - Performance events (8 fields)
- `creative_quality` - Quality metrics (8 fields)
- Custom tables (user-defined, no field suggestions)

## Project Structure

```text
spark_helper/
├── manifest.json           # Extension configuration (Manifest v3)
├── popup.html              # UI interface definition
├── package.json            # NPM config for build scripts
├── Makefile                # Build commands
├── scripts/
│   └── generate-schemas.js # YAML → JS conversion script
├── schemas/                # Git submodule (external schema repo)
│   └── spark/              # Table schema YAML files
├── src/
│   ├── js/
│   │   ├── app.js          # Main entry point, event wiring
│   │   ├── state.js        # AppState class for state management
│   │   ├── queryBuilder.js # QueryBuilder class for SQL generation
│   │   ├── ui.js           # UIManager class for DOM operations
│   │   ├── schemaParser.js # SchemaParser class for bundled schemas
│   │   ├── autocomplete.js # Autocomplete component
│   │   ├── schemas/        # Auto-generated schema JS files
│   │   │   ├── index.js
│   │   │   ├── imp_join_all2.js
│   │   │   ├── creative_event.js
│   │   │   ├── creative_perf_event.js
│   │   │   └── creative_quality.js
│   │   └── mappings/       # Per-table field mappings
│   │       ├── index.js
│   │       ├── imp_join_all2.js
│   │       ├── creative_event.js
│   │       ├── creative_perf_event.js
│   │       └── creative_quality.js
│   ├── css/
│   │   └── styles.css      # Styling with autocomplete support
│   └── assets/
│       └── icon.png        # Extension icon
├── spec/                   # Version specification documents
└── docs/
    └── plans/              # Design documents
```

## Architecture

### Core Classes

1. **AppState** (`src/js/state.js`)
   - Centralized state management
   - Stores selected table and query type
   - Provides access to schema and mapping data via SchemaParser

2. **SchemaParser** (`src/js/schemaParser.js`)
   - Loads bundled schema data from `src/js/schemas/`
   - Provides field lookup and filtering
   - Handles binary field detection

3. **QueryBuilder** (`src/js/queryBuilder.js`)
   - SQL query generation logic
   - Timezone conversion (local → UTC)
   - Automatic BYTES2STR wrapping for binary fields
   - Builds SELECT, FROM, and WHERE clauses

4. **UIManager** (`src/js/ui.js`)
   - DOM manipulation and event handling
   - Manages Autocomplete instances for table and field selection
   - Field/condition row creation and management

5. **Autocomplete** (`src/js/autocomplete.js`)
   - Reusable autocomplete/combobox component
   - Debounced filtering (250ms)
   - Keyboard navigation support
   - Used for both table and field selection

6. **Mappings** (`src/js/mappings/`)
   - Per-table custom field expressions
   - Per-table WHERE condition templates
   - Uses Spark UDFs: `CID2OID()`, `BYTES2STR()`, `NVL()`, etc.

### Data Flow

```text
popup.html (UI)
    ↓
app.js (Initialization)
    ├─ SchemaParser ← src/js/schemas/ (bundled data)
    └─ AppState (connects parser)
    ↓
UIManager
    ├─ Table Autocomplete → AppState.setSelectedTable()
    └─ Field Autocomplete → AppState.filterFields()
    ↓
QueryBuilder (on Generate)
    ├─ buildSelectPart() → auto-wrap binary fields
    ├─ buildWherePart() → table-specific conditions
    └─ buildFromClause() → UTC time conversion
    ↓
queryOutput textarea
```

## Development Commands

### Initial Setup

```bash
make setup
```

### Update Schemas

```bash
make update-spark-schema
```

### Regenerate JS Schemas

```bash
make generate-schemas
```

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
   - Or use Chrome DevTools: right-click extension icon → "Inspect popup"

## Adding New Features

### Add a new predefined field for a table

Add to the fields object in `src/js/mappings/{table_name}.js`:

```javascript
const IMP_JOIN_ALL2_MAPPINGS = {
  fields: {
    new_field: {
      sql: 'SPARK_UDF(column_name)',
      alias: 'new_field'
    }
  },
  // ...
};
```

### Add a new WHERE condition for a table

Add to the conditions object in `src/js/mappings/{table_name}.js`:

```javascript
const IMP_JOIN_ALL2_MAPPINGS = {
  // ...
  conditions: {
    new_condition: {
      label: "My Condition",
      sql: "column IS NOT NULL"
    }
  }
};
```

### Add a new supported table

1. Add YAML schema to `schemas/spark/{table_name}.yaml`
2. Add table name to `TABLES` array in `scripts/generate-schemas.js`
3. Run `make generate-schemas`
4. Create `src/js/mappings/{table_name}.js` with empty fields/conditions
5. Add script tags to `popup.html`
6. Update `src/js/mappings/index.js` to include new mappings

### Add a new timezone

Add `<option>` to timezone select in `popup.html`. The `QueryBuilder.formatDateTimeToUTC()` handles any offset automatically.

## Key Constraints

- **No persistence**: All query state is lost when popup closes
- **Multi-table support**: 4 predefined tables + custom table input
- **UTC output only**: All time ranges converted to UTC for Spark queries
- **Manifest v3**: Uses modern Chrome extension APIs (no background scripts)
- **Bundled schemas**: No network fetching; schemas are bundled at build time
- **Binary auto-wrap**: Binary fields automatically wrapped with `BYTES2STR()`
- **Editable output**: Users can modify generated SQL directly in the output textarea

## Schema Generation

Schemas are converted from YAML to JS at build time:

1. Source: `schemas/spark/{table}.yaml` (git submodule)
2. Script: `scripts/generate-schemas.js`
3. Output: `src/js/schemas/{table}.js`

Nested fields are flattened with dot notation (e.g., `actions.action_id`).
