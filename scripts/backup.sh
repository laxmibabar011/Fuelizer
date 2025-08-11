#!/bin/bash
set -e

# Backup Fuelizer directory using rsync with compress option
echo "Starting backup of Fuelizer application"
if ! rsync -az --delete /opt/Fuelizer/ /opt/Fuelizer_backup/; then
    echo "Backup failed" >&2
    exit 1
fi
echo "Backup completed successfully"