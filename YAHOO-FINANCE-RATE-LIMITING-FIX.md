# Yahoo Finance API Rate Limiting Fix

## Issue
The StockService was encountering JSON parsing errors when calling the Yahoo Finance API:

```
ERROR [StockService] Error updating stock price for LOW:
Unexpected token 'E', "Edge: Too "... is not valid JSON
ERROR [StockService] Error updating stock price for INTU:        
Unexpected token 'E', "Edge: Too "... is not valid JSON
```

### Root Cause
- **Aggressive cron schedule**: Running every 5 seconds was exceeding Yahoo Finance API rate limits
- **Rate limiting response**: Instead of JSON, the API was returning error messages like "Edge: Too many requests"
- **Poor error handling**: The code was attempting to parse error messages as JSON quote data
- **No backoff mechanism**: Continued making requests even when rate limited

## Solution Implemented

### 1. Enhanced Error Handling

**File**: `backend/src/modules/stock/stock.service.ts`

```typescript
// Before: Simple API call with no rate limit handling
const quote = await yahooFinance.quote(symbol, {}, { validateResult: false });

// After: Intelligent error handling with rate limit detection
try {
  quote = await Promise.race([
    yahooFinance.quote(symbol, {}, { validateResult: false }),
    timeoutPromise,
  ]);
} catch (apiError) {
  if (apiError.message && (
    apiError.message.includes('Too many requests') || 
    apiError.message.includes('Unexpected token')
  )) {
    this.consecutiveErrors++;
    if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
      // Trigger backoff period
      this.isRateLimited = true;
      this.rateLimitBackoffUntil = new Date(Date.now() + this.RATE_LIMIT_BACKOFF_MINUTES * 60 * 1000);
    }
    return null; // Gracefully skip this update
  }
  throw apiError; // Re-throw other errors
}
```

### 2. Intelligent Backoff Mechanism

**Added properties to track rate limiting:**
```typescript
private isRateLimited = false;
private rateLimitBackoffUntil: Date | null = null;
private consecutiveErrors = 0;
private readonly MAX_CONSECUTIVE_ERRORS = 3;
private readonly RATE_LIMIT_BACKOFF_MINUTES = 2;
```

**Backoff logic in cron job:**
```typescript
// Check if we're in rate limit backoff period
if (this.isRateLimited && this.rateLimitBackoffUntil) {
  if (new Date() < this.rateLimitBackoffUntil) {
    // Skip all updates during backoff
    return;
  } else {
    // Reset when backoff period ends
    this.isRateLimited = false;
    this.rateLimitBackoffUntil = null;
    this.consecutiveErrors = 0;
  }
}
```

### 3. Automatic Recovery

**Success handler to reset error state:**
```typescript
// Reset consecutive errors on successful API call
if (this.consecutiveErrors > 0) {
  this.consecutiveErrors = 0;
  this.logger.debug('API calls successful - reset error counter');
}
```

## How It Works

1. **Error Detection**: When API returns rate limit errors (either "Too many requests" or JSON parsing errors), increment error counter
2. **Backoff Trigger**: After 3 consecutive errors, enter 2-minute backoff period
3. **Graceful Degradation**: During backoff, skip all price updates but continue serving cached data
4. **Automatic Recovery**: After backoff period, resume normal operations
5. **Success Reset**: Reset error counter when API calls succeed again

## Benefits

- **No more JSON parsing errors** - Gracefully handles rate limit responses
- **Intelligent backoff** - Reduces API pressure when rate limited
- **Automatic recovery** - Resumes normal operation when rate limits reset
- **Cached data availability** - Users still see last known prices during backoff
- **Better logging** - Clear visibility into rate limiting events

## Configuration

- `MAX_CONSECUTIVE_ERRORS = 3` - Trigger backoff after 3 errors
- `RATE_LIMIT_BACKOFF_MINUTES = 2` - Wait 2 minutes before resuming
- Existing logging controls still apply via environment variables

## Future Optimizations

Consider these additional improvements:
1. **Increase cron interval** from 5 seconds to 10-15 seconds
2. **Batch API calls** to reduce total request count
3. **Smart scheduling** based on market hours
4. **Exponential backoff** for persistent rate limiting

---

**Date**: July 2, 2025  
**Status**: ✅ Completed  
**Impact**: Eliminated JSON parsing errors and improved API reliability
