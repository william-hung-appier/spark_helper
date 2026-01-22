# Spark Helper Makefile

.PHONY: setup update-spark-schema generate-schemas help

# Default target
help:
	@echo "Spark Helper Commands:"
	@echo "  make setup              - Initial setup (init submodule and generate schemas)"
	@echo "  make update-spark-schema - Update schemas from submodule and regenerate JS"
	@echo "  make generate-schemas   - Regenerate JS schemas from existing YAML files"

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
