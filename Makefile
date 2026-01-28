# Spark Helper Makefile

.PHONY: setup update-spark-schema generate-schemas tauri-dev tauri-build help

# Default target
help:
	@echo "Spark Helper Commands:"
	@echo "  make setup               - Initial setup (init submodule and generate schemas)"
	@echo "  make update-spark-schema - Update schemas from submodule and regenerate JS"
	@echo "  make generate-schemas    - Regenerate JS schemas from existing YAML files"
	@echo "  make tauri-dev           - Run macOS app in development mode"
	@echo "  make tauri-build         - Build macOS app for distribution"

# Initial setup for new clones
setup:
	@echo "Initializing git submodule..."
	git submodule init
	git submodule update
	@echo "Installing dependencies..."
	npm install
	@echo "Generating schemas..."
	node scripts/generate-schemas.js
	@echo "Setup complete!"

# Update schemas from submodule and regenerate JS
update-spark-schema:
	@echo "Updating schemas submodule..."
	git submodule update --remote schemas
	@echo "Generating JS schemas..."
	node scripts/generate-schemas.js
	@echo "Schemas updated successfully!"

# Regenerate JS schemas from existing YAML files
generate-schemas:
	@echo "Generating JS schemas..."
	node scripts/generate-schemas.js
	@echo "Done!"

# Run macOS app in development mode
tauri-dev:
	cargo tauri dev

# Build macOS app for distribution
tauri-build:
	@echo "Building macOS app..."
	cargo tauri build
	@echo "Build complete! App at: src-tauri/target/release/bundle/macos/Spark Helper.app"
