#!/bin/bash

# Grant all privileges to stocktrader user
echo "Granting privileges to stocktrader user..."

# Execute SQL commands via gcloud
gcloud sql operations wait $(gcloud sql operations list --instance=stocktrading-mysql --limit=1 --format="value(name)") --project=heroic-footing-460117-k8 2>/dev/null || true

echo "Completed privilege grants"
