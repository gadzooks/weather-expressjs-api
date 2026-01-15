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

	# Copy only necessary files
	cp lambda.js $(ARTIFACTS_DIR)/
	cp -r dist $(ARTIFACTS_DIR)/
	cp git.properties $(ARTIFACTS_DIR)/ || true

	@echo "Build complete. Artifacts in $(ARTIFACTS_DIR)"
	@du -sh $(ARTIFACTS_DIR)
