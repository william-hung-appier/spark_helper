# Appier Spark Helper

A Chrome extension and macOS app that helps generate Spark SQL queries with a visual query builder interface. Supports multiple tables with searchable field selection and predefined UDFs.

The macOS app provides the same functionality for browsers that don't support Chrome's Side Panel API (e.g., Arc).

## Features

- **Multi-table support**: `imp_join_all2`, `creative_event`, `creative_perf_event`, `creative_quality`
- **Searchable field selection**: Type-to-search with autocomplete and debouncing
- **Custom table support**: Enter any table name for manual field input
- **Predefined field mappings**: Common SQL expressions with Spark UDFs
- **Automatic binary field handling**: Binary fields auto-wrapped with `BYTES2STR()`
- **Timezone conversion**: Local time automatically converted to UTC
- **Light/Dark mode**: Toggle between themes
- **Editable output**: Modify generated queries directly in the output area

## Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd spark_helper
```

### Step 2: Setup

Run the setup command to initialize submodules and generate schemas:

```bash
make setup
```

Or manually:

```bash
git submodule init
git submodule update
npm install
node scripts/generate-schemas.js
```

### Step 3a: Load in Chrome (Extension)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** using the toggle in the top-right corner
3. Click **Load unpacked** button
4. Select the `spark_helper` folder (the one containing `manifest.json`)

### Step 3b: Build macOS App (for Arc/other browsers)

Prerequisites (one-time):

```bash
mise use rust@latest
cargo install tauri-cli
```

Build the app:

```bash
make tauri-build
```

The app will be at `src-tauri/target/release/bundle/macos/Spark Helper.app`

Double-click to run, or drag to Applications folder.

### Step 4: Pin the Extension (Optional, Chrome only)

1. Click the puzzle piece icon in Chrome's toolbar
2. Find "Appier Spark Helper" and click the pin icon

## Usage

1. Click the Appier Spark Helper icon in your Chrome toolbar
2. **Select a table** from the FROM section (type to search or enter custom table)
3. **Set the time range** and timezone
4. **Add fields** to the SELECT section (type to search available fields)
5. **Add conditions** to the WHERE section (optional)
6. Click **Generate Query** to build your SQL
7. Edit the generated query directly if needed
8. Click **Copy to Clipboard** to copy the query (or **Clear** to reset)

## Supported Tables

| Table | Fields | Description |
|-------|--------|-------------|
| `imp_join_all2` | 199 | AD session logs |
| `creative_event` | 25 | Creative user behavior logs |
| `creative_perf_event` | 8 | Performance events |
| `creative_quality` | 8 | Quality metrics |

## Updating Schemas

To fetch the latest schema definitions from the upstream repository:

```bash
make update-spark-schema
```

## Available Commands

```bash
make help                # Show available commands
make setup               # Initial setup (for new clones)
make update-spark-schema # Update schemas from submodule
make generate-schemas    # Regenerate JS from existing YAML
make tauri-dev           # Run macOS app in development mode
make tauri-build         # Build macOS app for distribution
```

## Custom Field Mappings

Predefined SQL expressions are defined in `src/js/mappings/{table_name}.js`. To add custom mappings:

```javascript
// src/js/mappings/imp_join_all2.js
const IMP_JOIN_ALL2_MAPPINGS = {
  fields: {
    my_field: {
      sql: "MY_UDF(column_name)",
      alias: "my_field"
    }
  },
  conditions: {
    my_condition: {
      label: "My Condition",
      sql: "column IS NOT NULL"
    }
  }
};
```

## Permissions

- **clipboardWrite**: Required to copy generated queries to clipboard

## Troubleshooting

### Extension not appearing after installation

- Make sure Developer mode is enabled
- Verify you selected the correct folder containing `manifest.json`

### Schemas not generating

- Ensure the schemas submodule is initialized: `git submodule update --init`
- Check that Node.js is installed and `npm install` was run

### Reloading after updates

1. Go to `chrome://extensions/`
2. Click the reload icon on the Appier Spark Helper card
