#!/bin/bash
set -e

# Rsync-like deployment script
SOURCE_DIR="/opt/codedeploy-agent/deployment-root/$DEPLOYMENT_GROUP_ID/$DEPLOYMENT_ID/deployment-archive"
DEST_DIR="/opt/Fuelizer"

echo "Starting deployment from $SOURCE_DIR to $DEST_DIR"

# Validate source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "Source directory $SOURCE_DIR does not exist" >&2
    exit 1
fi

# Create destination if it doesn't exist
mkdir -p "$DEST_DIR"

# Rsync with delete option (removes files not in source)
if ! rsync -av --delete "$SOURCE_DIR/" "$DEST_DIR/"; then
    echo "Deployment failed" >&2
    exit 1
fi

echo "Code deployment completed successfully"