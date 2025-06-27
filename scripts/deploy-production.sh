#!/bin/bash

# Production deployment script for Stock Trading App

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | xargs)
fi

# Build and start production containers
echo "📦 Building production containers..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🔄 Stopping existing production containers..."
docker-compose -f docker-compose.prod.yml down

echo "🚀 Starting production environment..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Health checks
echo "🏥 Running health checks..."

# Check backend health
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Check frontend health
if curl -f http://localhost:3080/health > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    exit 1
fi

echo "🎉 Production deployment completed successfully!"
echo ""
echo "📍 Production URLs:"
echo "   Frontend: http://localhost:3080"
echo "   Backend:  http://localhost:8080"
echo "   API Docs: http://localhost:8080/api/docs"
echo ""
echo "📊 Monitoring:"
echo "   Logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Status: docker-compose -f docker-compose.prod.yml ps"
