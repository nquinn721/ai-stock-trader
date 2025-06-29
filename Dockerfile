# Multi-stage Dockerfile for Stock Trading App (Backend + Frontend)
FROM node:18-alpine AS frontend-builder

# Install system dependencies for frontend build
RUN apk add --no-cache python3 make g++

WORKDIR /app/frontend

# Copy frontend package.json and install dependencies
COPY frontend/package.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy frontend source and build
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/tsconfig.json ./
COPY frontend/.eslintrc.js ./
RUN npm run build

# Backend build stage
FROM node:18-alpine AS backend-builder

# Install system dependencies
RUN apk add --no-cache dumb-init python3 make g++

WORKDIR /app

# Copy backend package.json
COPY backend/package.json ./

# Install ALL dependencies (including dev dependencies needed for build)
RUN npm install --no-audit --no-fund

# Copy backend source code
COPY backend/tsconfig*.json ./
COPY backend/nest-cli.json ./
COPY backend/src ./src

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy backend package.json and install production dependencies
COPY backend/package.json ./
RUN npm install --only=production --no-audit --no-fund

# Copy built backend from builder stage
COPY --from=backend-builder /app/dist ./dist

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/frontend/build ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application
CMD ["dumb-init", "node", "dist/main.js"]
