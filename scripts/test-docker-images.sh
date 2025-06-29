#!/bin/bash

# Docker Image Testing Script
# Tests different Docker base images for the Stock Trading App

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Docker Image Testing Script${NC}"
echo "Testing different base images for optimal performance"
echo ""

# Function to test Docker build
test_docker_build() {
    local dockerfile=$1
    local tag=$2
    local description=$3
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "Dockerfile: $dockerfile"
    echo "Tag: $tag"
    
    start_time=$(date +%s)
    
    if docker build -f "$dockerfile" -t "$tag" .; then
        end_time=$(date +%s)
        build_time=$((end_time - start_time))
        image_size=$(docker images "$tag" --format "table {{.Size}}" | tail -n 1)
        
        echo -e "${GREEN}✅ Build successful${NC}"
        echo "Build time: ${build_time}s"
        echo "Image size: $image_size"
        echo ""
        
        return 0
    else
        echo -e "${RED}❌ Build failed${NC}"
        echo ""
        return 1
    fi
}

# Function to test container run
test_container_run() {
    local tag=$1
    local port=$2
    
    echo -e "${YELLOW}Testing container runtime: $tag${NC}"
    
    # Run container in background
    if docker run -d --name "test-$tag" -p "$port:8000" "$tag"; then
        sleep 10
        
        # Test health endpoint
        if curl -f "http://localhost:$port/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Container running and healthy${NC}"
            docker stop "test-$tag" && docker rm "test-$tag"
            return 0
        else
            echo -e "${RED}❌ Container not responding to health check${NC}"
            docker logs "test-$tag"
            docker stop "test-$tag" && docker rm "test-$tag"
            return 1
        fi
    else
        echo -e "${RED}❌ Container failed to start${NC}"
        return 1
    fi
}

# Clean up previous test images
echo -e "${YELLOW}🧹 Cleaning up previous test images...${NC}"
docker rmi stock-app-alpine stock-app-slim stock-app-ubuntu stock-app-tf stock-app-distroless 2>/dev/null || true
echo ""

# Test current Alpine-based Dockerfile
echo -e "${BLUE}=== Testing Current Alpine Implementation ===${NC}"
test_docker_build "backend/Dockerfile.prod" "stock-app-alpine" "Current Alpine-based"

# Test Node.js Slim
echo -e "${BLUE}=== Testing Node.js Slim Implementation ===${NC}"
test_docker_build "backend/Dockerfile.node-slim" "stock-app-slim" "Node.js Slim (Recommended)"

# Test Ubuntu
echo -e "${BLUE}=== Testing Ubuntu Implementation ===${NC}"
test_docker_build "backend/Dockerfile.ubuntu" "stock-app-ubuntu" "Ubuntu 22.04 (Maximum Compatibility)"

# Test TensorFlow optimized
echo -e "${BLUE}=== Testing TensorFlow Optimized Implementation ===${NC}"
test_docker_build "backend/Dockerfile.tensorflow" "stock-app-tf" "TensorFlow Optimized"

# Test Distroless
echo -e "${BLUE}=== Testing Distroless Implementation ===${NC}"
test_docker_build "backend/Dockerfile.distroless" "stock-app-distroless" "Google Distroless (Security Focused)"

# Summary
echo -e "${BLUE}=== Build Summary ===${NC}"
echo "All builds completed. Image sizes:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep "stock-app"
echo ""

# Test runtime (optional)
read -p "Test container runtime? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}=== Runtime Testing ===${NC}"
    
    # Only test the ones that built successfully
    for image in stock-app-alpine stock-app-slim stock-app-ubuntu stock-app-tf stock-app-distroless; do
        if docker images -q "$image" > /dev/null; then
            test_container_run "$image" "$(shuf -i 8001-8010 -n 1)"
            echo ""
        fi
    done
fi

echo -e "${GREEN}🎉 Testing completed!${NC}"
echo ""
echo -e "${YELLOW}Recommendations:${NC}"
echo "1. Node.js Slim: Best balance of size, compatibility, and performance"
echo "2. Ubuntu: Use if you encounter native module issues"
echo "3. Distroless: Use for maximum security in production"
echo "4. TensorFlow: Use for heavy ML workloads"
echo ""
echo "Update your main Dockerfile with the best performing option."
