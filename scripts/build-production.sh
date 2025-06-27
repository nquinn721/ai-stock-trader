#!/bin/bash

# Simple production build script (alternative to Docker)

echo "🚀 Building production version..."

# Build backend
echo "📦 Building backend..."
cd backend
npm run build
cd ..

# Build frontend
echo "📦 Building frontend..."
cd frontend
REACT_APP_API_URL=http://localhost:8080 npm run build
cd ..

# Copy builds to production directory
mkdir -p production
cp -r backend/dist production/backend
cp -r frontend/build production/frontend

echo "✅ Production build complete!"
echo "📍 Files ready in ./production/"
echo ""
echo "To run production:"
echo "  Backend: cd production/backend && node main.js"
echo "  Frontend: Serve ./production/frontend with any static server"
