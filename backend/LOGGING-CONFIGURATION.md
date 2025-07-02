# Backend Logging Configuration

This document explains how to control the logging output of the Stock Trading App backend, particularly for stock data updates.

## Overview

The backend has been updated to use organized logging instead of verbose console output. You can now control the amount of logging through environment variables.

## Environment Variables

### Stock Service Logging

Add these variables to your `.env` file or environment configuration:

```bash
# Enable verbose debug logging for stock operations
STOCK_VERBOSE_LOGGING=false

# Enable price update logging (individual stock price updates)
STOCK_PRICE_LOGGING=false

# Enable WebSocket connection logging (client connect/disconnect)
WEBSOCKET_CONNECTION_LOGGING=false

# Enable verbose WebSocket operation logging
WEBSOCKET_VERBOSE_LOGGING=false
```

### Logging Levels

#### Default (Recommended)

```bash
STOCK_VERBOSE_LOGGING=false
STOCK_PRICE_LOGGING=false
WEBSOCKET_CONNECTION_LOGGING=false
WEBSOCKET_VERBOSE_LOGGING=false
```

- Shows only important logs (errors, warnings, startup, and periodic summaries)
- Reduces console noise significantly
- Summary logs every minute instead of every 5 seconds

#### Verbose Mode

```bash
STOCK_VERBOSE_LOGGING=true
STOCK_PRICE_LOGGING=false
WEBSOCKET_CONNECTION_LOGGING=false
WEBSOCKET_VERBOSE_LOGGING=true
```

- Shows detailed operation logs
- Useful for debugging signal calculations and API calls
- Still reduces price update noise

#### Full Debug Mode

```bash
STOCK_VERBOSE_LOGGING=true
STOCK_PRICE_LOGGING=true
WEBSOCKET_CONNECTION_LOGGING=true
WEBSOCKET_VERBOSE_LOGGING=true
```

- Shows all logging including individual price updates and connections
- Use only for development/debugging
- Can be very verbose with frequent updates

## What Changed

### Before (Noisy)

- Every stock price update logged individually
- Cron job updates logged every 5 seconds
- Emoji-heavy console output
- Mixed console.log and console.error usage

### After (Organized)

- NestJS Logger with proper log levels
- Environment-controlled verbosity
- Summary logging every minute instead of every 5 seconds
- Consistent error handling and logging
- Clean, professional log messages

## Log Types

### Always Shown

- ✅ **Errors**: API failures, database errors, critical issues
- ✅ **Warnings**: Missing data, API timeouts, configuration issues
- ✅ **Service Startup**: Service initialization messages
- ✅ **Periodic Summaries**: Every minute summary of updates (instead of every 5 seconds)

### Controlled by `STOCK_VERBOSE_LOGGING=true`

- 🔍 **Debug Operations**: Signal calculations, API calls, data processing
- 🔍 **Detailed Status**: Individual operation results

### Controlled by `STOCK_PRICE_LOGGING=true`

- 📊 **Price Updates**: Individual stock price update logs
- 📊 **WebSocket Broadcasts**: Real-time data transmission logs

## Usage Examples

### Production (Minimal Logging)

```bash
# .env
STOCK_VERBOSE_LOGGING=false
STOCK_PRICE_LOGGING=false
```

### Development (Moderate Logging)

```bash
# .env
STOCK_VERBOSE_LOGGING=true
STOCK_PRICE_LOGGING=false
```

### Debugging (Full Logging)

```bash
# .env
STOCK_VERBOSE_LOGGING=true
STOCK_PRICE_LOGGING=true
```

## Implementation Details

### Logger Usage

- Uses NestJS built-in Logger
- Proper log levels: `log()`, `debug()`, `warn()`, `error()`
- Contextual logger with service name

### Rate Limiting

- Summary logs every 12 cron cycles (1 minute with 5-second intervals)
- Prevents log spam while maintaining visibility
- Individual price updates only logged when enabled

### Error Handling

- All errors properly logged with context
- Stack traces preserved for debugging
- Graceful degradation on API failures

## Benefits

1. **Reduced Noise**: Clean console output for development
2. **Configurable**: Adjust logging based on needs
3. **Production Ready**: Minimal logging for production deployments
4. **Debug Friendly**: Full visibility when debugging issues
5. **Professional**: Consistent, structured logging approach

## Monitoring

With reduced logging, you can now:

- Focus on actual issues and errors
- Monitor periodic summaries for system health
- Enable detailed logging only when needed
- Have cleaner CI/CD pipeline logs
- Better Docker container log management
