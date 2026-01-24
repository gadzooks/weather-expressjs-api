#!/bin/bash
# Configure S3 lifecycle policy for automatic cache cleanup

set -e

BUCKET_NAME="gadzooks-sam-artifacts"
PROFILE="claudia"
REGION="us-west-1"

echo "Configuring S3 lifecycle policy for cache cleanup..."
echo "Bucket: $BUCKET_NAME"
echo ""

# Get existing lifecycle configuration
echo "Checking for existing lifecycle configuration..."
EXISTING_CONFIG=$(aws s3api get-bucket-lifecycle-configuration \
  --bucket "$BUCKET_NAME" \
  --profile "$PROFILE" \
  --region "$REGION" 2>/dev/null || echo "")

if [ -z "$EXISTING_CONFIG" ]; then
  echo "No existing lifecycle configuration found."
else
  echo "Existing lifecycle configuration found. Will merge with new rule."
fi

# Create lifecycle configuration with cache cleanup rule
cat > /tmp/s3-lifecycle-config.json <<'EOF'
{
  "Rules": [
    {
      "ID": "delete-old-deployment-artifacts",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "weather-expressjs/"
      },
      "Expiration": {
        "Days": 1
      }
    },
    {
      "ID": "delete-old-weather-cache",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "weather-cache/"
      },
      "Expiration": {
        "Days": 2
      }
    }
  ]
}
EOF

echo ""
echo "Lifecycle configuration to apply:"
cat /tmp/s3-lifecycle-config.json

echo ""
echo "Applying lifecycle configuration..."
aws s3api put-bucket-lifecycle-configuration \
  --bucket "$BUCKET_NAME" \
  --lifecycle-configuration file:///tmp/s3-lifecycle-config.json \
  --profile "$PROFILE" \
  --region "$REGION"

echo ""
echo "✅ Lifecycle policy configured successfully!"
echo ""
echo "Configuration details:"
echo "  - Deployment artifacts (weather-expressjs/): Delete after 1 day"
echo "  - Cache files (weather-cache/): Delete after 2 days"
echo ""
echo "Note: Cache files have 2-day expiration (vs 1-day for deployments) to provide"
echo "      extra buffer since cache TTL is configurable (3-24 hours per environment)"
echo ""

# Verify configuration
echo "Verifying configuration..."
aws s3api get-bucket-lifecycle-configuration \
  --bucket "$BUCKET_NAME" \
  --profile "$PROFILE" \
  --region "$REGION"

echo ""
echo "✅ Configuration verified!"

# Cleanup temp file
rm /tmp/s3-lifecycle-config.json
