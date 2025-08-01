#!/bin/bash
set -e

# Set PATH to include Node.js bin directory where PM2 is installed
export PATH=$PATH:/usr/local/node-v22.17.0/bin

echo "Fetching .env file from SSM Parameter Store"
if ! aws ssm get-parameter --name "/fuelizer/backend/env" --with-decryption --query "Parameter.Value" --output text > /opt/Fuelizer/backend/.env; then
    echo "Failed to fetch .env file from SSM" >&2
    exit 1
fi

# Validate .env file was created and is not empty
if [ ! -s /opt/Fuelizer/backend/.env ]; then
    echo ".env file is empty or was not created" >&2
    exit 1
fi
echo ".env file fetched successfully"

echo "Restarting Backend with PM2"
cd /opt/Fuelizer/backend

# Try to restart existing process, if it fails, start new one
if ! pm2 restart fuelizer-backend 2>/dev/null; then
    echo "Process not found, starting new PM2 process"
    pm2 start index.js --name fuelizer-backend
fi

pm2 save
echo "Backend restarted successfully"