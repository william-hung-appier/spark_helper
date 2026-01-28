# Spark Helper macOS App (Tauri)

## Overview

Wrap existing Chrome extension UI as a standalone macOS app using Tauri for team members using browsers that don't support Chrome Side Panel API (e.g., Arc).

## Approach

- Tauri with Rust backend, reusing existing HTML/JS/CSS frontend
- No code duplication - Tauri loads `sidepanel.html` directly
- Local builds only, distribution via file sharing

## Project Structure

```txt
spark_helper/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   └── main.rs
│   └── icons/
│       └── icon.icns
├── src/                    (existing)
├── sidepanel.html          (existing, reused)
└── package.json            (add tauri scripts)
```

## Files to Create

| File | Purpose |
|------|---------|
| `src-tauri/Cargo.toml` | Rust dependencies |
| `src-tauri/tauri.conf.json` | App configuration |
| `src-tauri/src/main.rs` | Entry point |
| `src-tauri/icons/icon.icns` | macOS app icon |

## Files to Modify

| File | Change |
|------|--------|
| `Makefile` | Add tauri-dev and tauri-build targets |
| `src/js/app.js` | Guard chrome.* calls |
| `.gitignore` | Add src-tauri/target/ |

## Build Commands

- `make tauri-dev` - Development with hot reload
- `make tauri-build` - Production build

## Output

`src-tauri/target/release/bundle/macos/Spark Helper.app`
