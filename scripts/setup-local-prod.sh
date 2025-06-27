#!/bin/bash

# Local Production Environment Setup Script

echo "🚀 Setting up Local Production Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env.local-prod exists
if [ ! -f ".env.local-prod" ]; then
    echo "📋 Creating .env.local-prod from example..."
    cp .env.local-prod.example .env.local-prod
    echo "⚠️  Please edit .env.local-prod with your actual API keys before proceeding."
    echo "   Then run this script again."
    exit 1
fi

# Load environment variables
export $(cat .env.local-prod | xargs)

echo "🔧 Building local production images..."
npm run local-prod:build

echo "🗄️ Setting up database..."
# Wait for database to be ready
echo "⏳ Starting services..."
npm run local-prod:start

echo "⏳ Waiting for services to be ready..."
sleep 30

# Check health
echo "🏥 Checking service health..."
npm run local-prod:health

echo "✅ Local Production Environment is ready!"
echo ""
echo "📊 Access your application:"
echo "   Frontend: http://localhost:3100"
echo "   Backend API: http://localhost:8100"
echo "   Database: localhost:5500"
echo "   Redis: localhost:6400"
echo "   Production-like (with Nginx): http://localhost:80"
echo ""
echo "🔧 Useful commands:"
echo "   npm run local-prod:logs    - View logs"
echo "   npm run local-prod:stop    - Stop services"
echo "   npm run local-prod:status  - Check status"
echo "   npm run local-prod:reset   - Reset everything"
