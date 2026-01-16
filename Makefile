.PHONY: build-WeatherApiFunction

# SAM uses ARTIFACTS_DIR to specify where to output the built artifacts
build-WeatherApiFunction:
	@echo "Building Lambda function..."

	# Build TypeScript
	yarn build

	# Install production dependencies in a clean directory
	mkdir -p $(ARTIFACTS_DIR)
	cp package.json $(ARTIFACTS_DIR)/
	cp yarn.lock $(ARTIFACTS_DIR)/
	cd $(ARTIFACTS_DIR) && npm install --production --ignore-scripts
	cd $(ARTIFACTS_DIR) && npm prune --production

	# Aggressively remove unnecessary files to reduce package size
	@echo "Cleaning up node_modules..."
	# Remove test directories
	find $(ARTIFACTS_DIR)/node_modules -type d -name test -prune -exec rm -rf {} \; 2>/dev/null || true
	find $(ARTIFACTS_DIR)/node_modules -type d -name tests -prune -exec rm -rf {} \; 2>/dev/null || true
	find $(ARTIFACTS_DIR)/node_modules -type d -name __tests__ -prune -exec rm -rf {} \; 2>/dev/null || true
	# Remove example/doc directories
	find $(ARTIFACTS_DIR)/node_modules -type d -name example -prune -exec rm -rf {} \; 2>/dev/null || true
	find $(ARTIFACTS_DIR)/node_modules -type d -name examples -prune -exec rm -rf {} \; 2>/dev/null || true
	find $(ARTIFACTS_DIR)/node_modules -type d -name docs -prune -exec rm -rf {} \; 2>/dev/null || true
	find $(ARTIFACTS_DIR)/node_modules -type d -name documentation -prune -exec rm -rf {} \; 2>/dev/null || true
	find $(ARTIFACTS_DIR)/node_modules -type d -name .github -prune -exec rm -rf {} \; 2>/dev/null || true
	find $(ARTIFACTS_DIR)/node_modules -type d -name coverage -prune -exec rm -rf {} \; 2>/dev/null || true
	# Remove unnecessary file types
	find $(ARTIFACTS_DIR)/node_modules -type f -name "*.map" -delete 2>/dev/null || true
	find $(ARTIFACTS_DIR)/node_modules -type f -name "*.ts" ! -name "*.d.ts" -delete 2>/dev/null || true
	find $(ARTIFACTS_DIR)/node_modules -type f -name "*.md" -delete 2>/dev/null || true
	find $(ARTIFACTS_DIR)/node_modules -type f -name "*.markdown" -delete 2>/dev/null || true
	find $(ARTIFACTS_DIR)/node_modules -type f -name "LICENSE*" -delete 2>/dev/null || true
	find $(ARTIFACTS_DIR)/node_modules -type f -name "CHANGELOG*" -delete 2>/dev/null || true
	find $(ARTIFACTS_DIR)/node_modules -type f -name "*.spec.js" -delete 2>/dev/null || true
	find $(ARTIFACTS_DIR)/node_modules -type f -name "*.test.js" -delete 2>/dev/null || true

	# Copy only necessary files
	cp lambda.js $(ARTIFACTS_DIR)/
	cp -r dist $(ARTIFACTS_DIR)/
	cp git.properties $(ARTIFACTS_DIR)/ || true

	@echo "Build complete. Artifacts in $(ARTIFACTS_DIR)"
	@du -sh $(ARTIFACTS_DIR)
	@echo "Node modules size:"
	@du -sh $(ARTIFACTS_DIR)/node_modules || true
	@echo "Largest directories in node_modules:"
	@du -sh $(ARTIFACTS_DIR)/node_modules/* 2>/dev/null | sort -hr | head -10 || true
