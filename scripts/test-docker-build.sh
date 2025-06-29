#!/bin/bash

# Test Docker Build Script for Stock Trading App
# This script tests the Docker build locally before deploying to Cloud Run

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧪 Testing Docker build for Stock Trading App${NC}"

# Test main Dockerfile
echo -e "${YELLOW}📦 Testing main Dockerfile...${NC}"
docker build -f Dockerfile -t stock-trading-app:test .

# Test if the image was built successfully
if docker images | grep -q "stock-trading-app.*test"; then
    echo -e "${GREEN}✅ Main Dockerfile build successful${NC}"
else
    echo -e "${RED}❌ Main Dockerfile build failed${NC}"
    exit 1
fi

# Test Cloud Run specific Dockerfile
echo -e "${YELLOW}📦 Testing Cloud Run Dockerfile...${NC}"
docker build -f Dockerfile.cloudrun -t stock-trading-app:cloudrun-test .

# Test if the Cloud Run image was built successfully
if docker images | grep -q "stock-trading-app.*cloudrun-test"; then
    echo -e "${GREEN}✅ Cloud Run Dockerfile build successful${NC}"
else
    echo -e "${RED}❌ Cloud Run Dockerfile build failed${NC}"
    exit 1
fi

# Test backend-only Dockerfile
echo -e "${YELLOW}📦 Testing backend Dockerfile...${NC}"
cd backend
docker build -f Dockerfile.prod -t stock-trading-backend:test .
cd ..

# Test if the backend image was built successfully
if docker images | grep -q "stock-trading-backend.*test"; then
    echo -e "${GREEN}✅ Backend Dockerfile build successful${NC}"
else
    echo -e "${RED}❌ Backend Dockerfile build failed${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 All Docker builds completed successfully!${NC}"
echo ""
echo -e "${GREEN}📋 Built images:${NC}"
docker images | grep "stock-trading"
echo ""
echo -e "${YELLOW}🧹 To clean up test images, run:${NC}"
echo "docker rmi stock-trading-app:test stock-trading-app:cloudrun-test stock-trading-backend:test"
