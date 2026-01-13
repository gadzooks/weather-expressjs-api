#!/bin/bash

# Create S3 bucket for SAM deployment artifacts
# This script is idempotent - safe to run multiple times

set -e

BUCKET_NAME="gadzooks-sam-artifacts"
REGION="us-west-1"
PROFILE="claudia"

echo "Creating S3 bucket: $BUCKET_NAME in region: $REGION"

# Check if bucket already exists
if aws s3api head-bucket --bucket "$BUCKET_NAME" --profile "$PROFILE" 2>/dev/null; then
    echo "✅ Bucket $BUCKET_NAME already exists"
else
    echo "Creating bucket $BUCKET_NAME..."
    aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$REGION" \
        --profile "$PROFILE" \
        --create-bucket-configuration LocationConstraint="$REGION"
    echo "✅ Bucket created successfully"
fi

echo "Configuring bucket settings..."

# Block all public access
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --profile "$PROFILE" \
    --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
echo "✅ Public access blocked"

# Disable versioning (ensures only 1 version stored)
aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --profile "$PROFILE" \
    --versioning-configuration Status=Suspended
echo "✅ Versioning disabled"

# Apply lifecycle policy to delete objects older than 1 day
cat > /tmp/lifecycle-policy.json <<EOF
{
    "Rules": [
        {
            "ID": "DeleteOldArtifacts",
            "Status": "Enabled",
            "Expiration": {
                "Days": 1
            },
            "NoncurrentVersionExpiration": {
                "NoncurrentDays": 1
            },
            "Filter": {}
        }
    ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
    --bucket "$BUCKET_NAME" \
    --profile "$PROFILE" \
    --lifecycle-configuration file:///tmp/lifecycle-policy.json
echo "✅ Lifecycle policy applied (1-day retention)"

# Add tags
aws s3api put-bucket-tagging \
    --bucket "$BUCKET_NAME" \
    --profile "$PROFILE" \
    --tagging 'TagSet=[{Key=Purpose,Value=SAM-Deployment-Artifacts},{Key=ManagedBy,Value=Script}]'
echo "✅ Tags applied"

# Clean up temp file
rm /tmp/lifecycle-policy.json

echo ""
echo "🎉 S3 bucket setup complete!"
echo ""
echo "Bucket structure:"
echo "  gadzooks-sam-artifacts/"
echo "    ├── weather-expressjs/"
echo "    │   ├── dev/"
echo "    │   ├── qa/"
echo "    │   └── prod/"
echo "    └── <future-projects>/"
echo ""
echo "Verify with: aws s3 ls s3://$BUCKET_NAME --profile $PROFILE"
