#!/bin/bash

# Bash wrapper for gcloud deployment
# This script ensures gcloud works in bash by using PowerShell as a fallback

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Cloud Run deployment for Stock Trading App${NC}"

# Check if gcloud is available in bash
if command -v gcloud &> /dev/null; then
    echo -e "${GREEN}✅ gcloud found in bash PATH${NC}"
    # Use the original bash script
    ./scripts/deploy-cloud-run.sh
elif command -v powershell &> /dev/null; then
    echo -e "${YELLOW}⚠️  gcloud not found in bash, using PowerShell fallback${NC}"
    # Use PowerShell script
    powershell -ExecutionPolicy Bypass -File ./scripts/deploy-cloud-run.ps1
elif command -v pwsh &> /dev/null; then
    echo -e "${YELLOW}⚠️  gcloud not found in bash, using PowerShell Core fallback${NC}"
    # Use PowerShell Core
    pwsh -File ./scripts/deploy-cloud-run.ps1
else
    echo -e "${RED}❌ Neither gcloud nor PowerShell found${NC}"
    echo -e "${YELLOW}Please either:${NC}"
    echo "1. Add gcloud to your bash PATH"
    echo "2. Install PowerShell"
    echo "3. Run the deployment from PowerShell directly"
    exit 1
fi
