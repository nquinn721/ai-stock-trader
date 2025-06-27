# Production Deployment Guide

## Overview

This document explains how to run both development and production versions of the Stock Trading App simultaneously.

## Port Allocation

### Development Environment

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **Project Management**: http://localhost:5000

### Production Environment

- **Frontend**: http://localhost:3080
- **Backend**: http://localhost:8080
- **Database**: localhost:5433 (PostgreSQL)
- **Redis**: localhost:6380

## Quick Start

### 1. Deploy Production Environment

```bash
# Using npm scripts
npm run prod:deploy

# Or using VS Code tasks
# Ctrl+Shift+P → "Tasks: Run Task" → "Production: Build and Deploy"
```

### 2. Continue Development

```bash
# Keep development servers running
npm run dev:start

# Or use existing VS Code tasks for individual services
```

## Production Management Commands

### Deployment

```bash
npm run prod:deploy     # Full deployment with health checks
npm run prod:build      # Build containers only
npm run prod:start      # Start existing containers
npm run prod:stop       # Stop all production containers
```

### Monitoring

```bash
npm run prod:logs       # View real-time logs
npm run prod:status     # Check container status
npm run prod:health     # Run health checks
```

### Docker Commands

```bash
# View running containers
docker-compose -f docker-compose.prod.yml ps

# View logs for specific service
docker-compose -f docker-compose.prod.yml logs -f backend-prod

# Restart specific service
docker-compose -f docker-compose.prod.yml restart frontend-prod

# Scale services (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale backend-prod=2
```

## Environment Configuration

### Production Environment Variables

Create `.env.production` with:

```bash
NODE_ENV=production
PROD_DATABASE_URL=postgresql://...
YAHOO_FINANCE_API_KEY=your_api_key
NEWS_API_KEY=your_api_key
JWT_SECRET=secure_production_secret
```

### Frontend Environment

Production build uses:

```bash
REACT_APP_API_URL=http://localhost:8080
```

## Security Considerations

### Container Security

- Non-root user in containers
- Read-only file systems where possible
- Limited resource allocation
- Health checks for service monitoring

### Network Security

- Isolated Docker network for production
- Nginx reverse proxy with security headers
- CORS configuration for production domains

### Data Security

- Separate production database
- Encrypted environment variables
- Secure JWT secrets

## Development Workflow

### Simultaneous Development

1. **Keep production running**: `npm run prod:start`
2. **Continue development**: Use existing dev servers on ports 3000/8000
3. **Test changes**: Deploy to production when ready
4. **Monitor both**: Use different browser tabs/windows

### Hot Deployment

```bash
# Make changes in development
# Test thoroughly
# Deploy to production
npm run prod:deploy

# Production will rebuild and restart automatically
```

## Monitoring and Debugging

### Health Checks

- **Backend**: http://localhost:8080/health
- **Frontend**: http://localhost:3080/health

### Log Access

```bash
# All services
npm run prod:logs

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend-prod
```

### Performance Monitoring

- Container resource usage: `docker stats`
- Application metrics: Check backend logs
- Frontend performance: Browser dev tools on port 3080

## Troubleshooting

### Common Issues

1. **Port Conflicts**

   ```bash
   # Check what's using ports
   netstat -an | findstr "8080\|3080"

   # Stop production if needed
   npm run prod:stop
   ```

2. **Container Issues**

   ```bash
   # Rebuild containers
   npm run prod:build

   # View container logs
   docker-compose -f docker-compose.prod.yml logs
   ```

3. **Database Connection**
   ```bash
   # Check database container
   docker-compose -f docker-compose.prod.yml logs database-prod
   ```

### Recovery Procedures

1. **Full Reset**

   ```bash
   npm run prod:stop
   docker system prune -f
   npm run prod:deploy
   ```

2. **Data Recovery**
   ```bash
   # Backup production data
   docker-compose -f docker-compose.prod.yml exec database-prod pg_dump...
   ```

## VS Code Integration

### Available Tasks

- **Production: Build and Deploy**
- **Production: Start**
- **Production: Stop**
- **Production: View Logs**
- **Production: Health Check**
- **Development: Start All**

### Usage

1. `Ctrl+Shift+P`
2. Type "Tasks: Run Task"
3. Select desired production task

## Best Practices

### Development

- Keep production running for stakeholder demos
- Test major changes in production environment
- Use production for integration testing

### Deployment

- Always run health checks after deployment
- Monitor logs during deployment
- Keep backups of production data

### Monitoring

- Check production health regularly
- Monitor resource usage
- Set up alerts for production issues

## Cloud Deployment (Future)

This setup is ready for cloud deployment:

- **AWS**: ECS, EKS, or EC2 with Docker
- **Azure**: Container Instances or AKS
- **GCP**: Cloud Run or GKE
- **DigitalOcean**: App Platform or Droplets

Simply update environment variables and DNS configuration.
