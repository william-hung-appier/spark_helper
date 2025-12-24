# Appier Spark Helper

A Chrome extension that helps generate Spark SQL queries for the `imp_join_all2` table. It provides a visual query builder interface to compose complex SQL with predefined field mappings and UDFs.

## Installation

### Step 1: Download the Extension

Clone or download this repository to your local machine:

```bash
git clone <repository-url>
```

Or download and extract the ZIP file.

### Step 2: Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** using the toggle in the top-right corner
3. Click **Load unpacked** button
4. Select the `spark_helper` folder (the one containing `manifest.json`)

### Step 3: Pin the Extension (Optional)

1. Click the puzzle piece icon in Chrome's toolbar
2. Find "Appier Spark Helper" and click the pin icon

## Usage

1. Click the Appier Spark Helper icon in your Chrome toolbar
2. Select the query type and date range
3. Add fields and conditions as needed
4. Click **Generate Query** to build your SQL
5. Click **Copy** to copy the query to clipboard

## Features

- Visual query builder for `imp_join_all2` table
- Predefined field mappings with Spark UDFs
- Automatic timezone conversion (local time to UTC)
- Dynamic schema field selector from Appier Data Catalog
- Light/Dark mode support

## Permissions

- **clipboardWrite**: Required to copy generated queries to clipboard
- **Host permission** for `data-catalog.dp.arepa.appier.info`: Required to fetch the latest field schema

## Troubleshooting

### Extension not appearing after installation
- Make sure Developer mode is enabled
- Verify you selected the correct folder containing `manifest.json`

### Schema fields not loading
- Ensure you are logged into the Appier Data Catalog
- The extension will fall back to embedded schema if fetch fails

### Reloading after updates
1. Go to `chrome://extensions/`
2. Click the reload icon on the Appier Spark Helper card