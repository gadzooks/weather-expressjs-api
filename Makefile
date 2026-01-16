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

	# Remove unnecessary files from node_modules to reduce package size
	cd $(ARTIFACTS_DIR) && find node_modules -type d \( -name "test" -o -name "tests" -o -name "example" -o -name "examples" -o -name "docs" -o -name ".github" \) -exec rm -rf {} + 2>/dev/null || true
	cd $(ARTIFACTS_DIR) && find node_modules -type f \( -name "*.map" -o -name "*.ts" -o -name "*.md" -o -name "LICENSE*" -o -name "README*" -o -name "CHANGELOG*" \) -delete 2>/dev/null || true

	# Copy only necessary files
	cp lambda.js $(ARTIFACTS_DIR)/
	cp -r dist $(ARTIFACTS_DIR)/
	cp git.properties $(ARTIFACTS_DIR)/ || true

	@echo "Build complete. Artifacts in $(ARTIFACTS_DIR)"
	@du -sh $(ARTIFACTS_DIR)
	@echo "Node modules size:"
	@du -sh $(ARTIFACTS_DIR)/node_modules || true
