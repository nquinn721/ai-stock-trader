# Multi-stage Docker build for AI Stock Trader - Cloud Run Optimized
# Stage 1: Build frontend
FROM node:22-alpine AS frontend-build

# Set working directory
WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm ci --only=production --silent

# Copy source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:22-alpine AS backend-build

# Set working directory
WORKDIR /app/backend

# Copy package files and install dependencies
COPY backend/package*.json ./
RUN npm ci --only=production --silent

# Copy source and build
COPY backend/ ./
RUN npm run build

# Stage 3: Production runtime - optimized for Cloud Run
FROM node:22-alpine AS production

# Install required system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/* \
    && update-ca-certificates

# Create app directory
WORKDIR /app

# Copy package.json for production dependencies
COPY backend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production --silent && npm cache clean --force

# Copy backend build files
COPY --from=backend-build /app/backend/dist ./dist

# Copy frontend build to be served by backend
COPY --from=frontend-build /app/frontend/build ./public

# Create non-root user for security (Cloud Run best practice)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port (Cloud Run will set PORT environment variable)
EXPOSE 8080

# Add environment variables for Cloud Run
ENV NODE_ENV=production
ENV PORT=8080

# Health check optimized for Cloud Run
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Use dumb-init to handle signals properly (important for Cloud Run)
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]