# Simplified Dockerfile for Cloud Run deployment
FROM node:20-alpine AS build-stage

# Install dependencies needed for building and GL libraries
RUN apk add --no-cache \
    python3 \
    py3-setuptools \
    py3-pip \
    make \
    g++ \
    gcc \
    pkgconfig \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    git \
    && ln -sf /usr/bin/python3 /usr/bin/python

# Set working directory
WORKDIR /app

# Copy and install root dependencies - CRITICAL: Use npm install not npm ci
COPY package*.json ./
RUN npm install --ignore-scripts --no-optional

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
COPY frontend/tsconfig.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build backend
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/tsconfig*.json ./
COPY backend/nest-cli.json ./

# Install all dependencies including dev for build
# Use npm install instead of npm ci for compatibility
RUN npm install --ignore-scripts --no-optional

COPY backend/src ./src
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install required system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    cairo \
    pango \
    jpeg \
    giflib \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy package.json for production dependencies
COPY backend/package*.json ./

# Set environment variables
ENV PYTHON=/usr/bin/python3
ENV NODE_ENV=production
ENV PORT=8000
ENV TFJS_BACKEND=cpu
ENV TFJS_DISABLE_WEBGL=true

# Install production dependencies with overrides - CRITICAL: Use npm install not npm ci
RUN npm install --omit=dev --ignore-scripts --no-optional

# Copy built backend
COPY --from=build-stage /app/backend/dist ./dist

# Copy built frontend
COPY --from=build-stage /app/frontend/build ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Change ownership
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 8000

# Health check - Extended startup time for ML/AI modules and database connections
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start command
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
