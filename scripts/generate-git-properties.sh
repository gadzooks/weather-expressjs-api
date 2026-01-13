#!/bin/bash
# generate-git-properties.sh
# Generates git.properties file for express-actuator info endpoint

set -e

# Output file
OUTPUT_FILE="git.properties"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "Not a git repository. Skipping git.properties generation."
  exit 0
fi

# Get git information (excluding user details for security)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
GIT_COMMIT_ID=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_COMMIT_ID_SHORT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_COMMIT_TIME=$(git log -1 --format=%ci 2>/dev/null || echo "unknown")
GIT_COMMIT_MESSAGE=$(git log -1 --format=%s 2>/dev/null || echo "unknown")

# Create git.properties file (user.name and user.email removed for security)
cat > "$OUTPUT_FILE" << EOF
git.branch=$GIT_BRANCH
git.commit.id=$GIT_COMMIT_ID
git.commit.id.abbrev=$GIT_COMMIT_ID_SHORT
git.commit.time=$GIT_COMMIT_TIME
git.commit.message.short=$GIT_COMMIT_MESSAGE
EOF

echo "Generated $OUTPUT_FILE"
cat "$OUTPUT_FILE"
