# Screeps API Rate Limiting - Solutions

## Problem
Mission Control hit Screeps API rate limits showing errors like:
```
Rate limit exceeded, retry after 78915353ms (21.9 hours)
```

## Why This Happens
- Screeps API has strict rate limiting on auth tokens
- Our old settings polled every 2 seconds (telemetry) and 5 seconds (status)
- Even with our new 10s/30s intervals, we may have already exceeded limits during testing

## Solutions

### Option 1: Enable No-Rate-Limit on Your Token (Recommended)
1. Go to: https://screeps.com/a/#!/account/auth-tokens/noratelimit?token=YOUR_TOKEN
2. Click to disable rate limiting on your API token
3. Restart Mission Control

**Pros**: Unlimited API calls, real-time updates  
**Cons**: None for personal use

### Option 2: Use Longer Polling Intervals
Edit `.env`:
```
TELEMETRY_UPDATE_INTERVAL=60000    # 1 minute
STATUS_UPDATE_INTERVAL=120000       # 2 minutes
```

**Pros**: Stays within free rate limits  
**Cons**: Less real-time (but dashboard telemetry updates every 100 ticks in-game anyway)

### Option 3: Wait Out the Rate Limit
- Current ban: ~22 hours
- Just wait, it will automatically reset
- During wait time, dashboard will show last known data

### Option 4: Use Offline Mode (Future Enhancement)
We could add a mode that:
- Reads directly from your local Screeps client files
- No API calls needed
- Only works if you have Screeps installed locally

## Our Current Architecture
Mission Control is designed to work WITH rate limits:

1. **In-Game Telemetry** (`analytics.js`):
   - Runs every 100 ticks (~5 minutes)
   - Stores data in `Memory.dashboard[roomName]`
   - No API cost - happens in-game

2. **Mission Control Polling** (`server/index.js`):
   - Polls `Memory.dashboard` via API
   - Default: 10s for telemetry, 30s for status
   - This is where rate limiting applies

3. **Data Freshness**:
   - Real data updates every 100 ticks in-game
   - API just reads the cached data
   - So even 60-second polling is fine!

## Recommended Settings

### For Development/Testing:
```env
# Enable no-rate-limit on token first, then:
TELEMETRY_UPDATE_INTERVAL=10000    # 10 seconds
STATUS_UPDATE_INTERVAL=30000        # 30 seconds
```

### For Production/24/7 Monitoring:
```env
# Without no-rate-limit:
TELEMETRY_UPDATE_INTERVAL=60000    # 1 minute
STATUS_UPDATE_INTERVAL=120000       # 2 minutes

# Data is still only 100 ticks old max, so this is fine
```

## Emergency: Skip Polling Entirely
Comment out the interval code in `server/index.js` and manually refresh:
```javascript
// const telemetryInterval = setInterval(async () => { ... }, 10000);
// const statusInterval = setInterval(async () => { ... }, 30000);
```

Then only fetch data when you click a "Refresh" button.

## Future Enhancements
1. Add "Refresh" button instead of auto-polling
2. Show "Last Updated" timestamp on dashboard
3. Implement WebSocket connection to Screeps (if supported)
4. Local file reading mode (parse Screeps client storage)
5. Rate limit detection with automatic backoff
