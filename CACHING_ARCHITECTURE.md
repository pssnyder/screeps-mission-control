# Mission Control - Intelligent Caching Architecture

## High Cohesion, Low Coupling Design

### Game Engine (In-Game Data Collection)
**Location**: `simulation/analytics.js` → `Analytics.recordDashboardTelemetry()`

**Runs**: Every 100 ticks (~5 minutes real-time)

**Collects**:
```javascript
Memory.dashboard[roomName] = {
    timestamp: Game.time,
    rcl, rclProgress, rclProgressTotal,
    energy, energyCapacity,
    structures: { extensions, towers, spawns },
    construction: { total, byType }
}
```

**Independence**: Game engine collects data regardless of whether Mission Control is running. No coupling to external systems.

---

### Mission Control (Dashboard Client)
**Location**: `mission-control/server/screeps-client.js`

**Polls**: Configurable intervals (default: 10s telemetry, 30s status)

**Architecture**: 3-tier caching strategy

#### Tier 1: Memory Cache
- **TTL**: 60 seconds for memory, 30 seconds for user data
- **Purpose**: Avoid redundant API calls within short timeframes
- **Implementation**:
```javascript
cache = {
    memory: { data, timestamp, ttl: 60000 },
    user: { data, timestamp, ttl: 30000 }
}
```

#### Tier 2: Rate Limit Detection
- **Detects**: API rate limit errors automatically
- **Action**: Switches to cached data, stops polling
- **Recovery**: Auto-resumes when rate limit expires
- **User Notification**: Shows "📦 CACHED (Xm Ys old)" in dashboard

#### Tier 3: Offline Mode
- **Trigger**: No cache available + rate limited
- **Response**: Shows safe defaults with "⚠️ OFFLINE MODE"
- **Graceful**: Dashboard remains functional, just shows stale data

---

## Data Freshness Guarantee

### In-Game Collection
- Data refreshed every **100 ticks** (3-5 minutes real-time depending on server)
- Stored in `Memory.dashboard[roomName]`
- Zero API cost - happens server-side in Screeps

### API Polling
- Default: **10 seconds** (telemetry), **30 seconds** (status)
- Actual data age: **Max 100 ticks + polling interval**
- Example: With 10s polling, data is at most ~5 minutes old

### Why This Works
- Game state changes slowly (buildings take minutes to construct, RCL takes hours)
- Real-time precision not needed for strategy games
- 5-minute-old data is perfectly usable for monitoring

---

## Rate Limit Handling

### Detection
```javascript
if (error.message.includes('Rate limit')) {
    const match = error.message.match(/retry after (\d+)ms/);
    this.markRateLimited(parseInt(match[1]));
}
```

### Response
1. Stop all API calls immediately
2. Serve cached data if available
3. Show cache age in UI: "📦 CACHED (2m 34s old)"
4. Set timer for rate limit expiration
5. Auto-resume when clear

### Exponential Backoff
- Rate limit duration capped at 1 hour max
- Prevents infinite bans from cascading errors
- User notified of time remaining

---

## Configuration

### Environment Variables (`.env`)
```bash
# Conservative defaults (free tier safe)
TELEMETRY_UPDATE_INTERVAL=10000    # 10 seconds
STATUS_UPDATE_INTERVAL=30000        # 30 seconds

# For no-rate-limit tokens (more real-time)
TELEMETRY_UPDATE_INTERVAL=5000     # 5 seconds
STATUS_UPDATE_INTERVAL=15000        # 15 seconds

# Ultra-conservative (minimal API usage)
TELEMETRY_UPDATE_INTERVAL=60000    # 1 minute
STATUS_UPDATE_INTERVAL=120000       # 2 minutes
```

### Cache TTLs (in `screeps-client.js`)
```javascript
memory: { ttl: 60000 },  // 1 minute
user: { ttl: 30000 }     // 30 seconds
```

---

## API Endpoints

### GET /api/health
Returns connection status + cache status:
```json
{
    "status": "operational",
    "connected": true,
    "timestamp": 1701234567890,
    "cache": {
        "rateLimited": false,
        "rateLimitUntil": 0,
        "rateLimitRemaining": 0,
        "memoryCache": {
            "valid": true,
            "age": 15234
        },
        "userCache": {
            "valid": true,
            "age": 8123
        }
    }
}
```

### Telemetry Response (with cache indicators)
```json
{
    "timestamp": 1701234567890,
    "cpu": 10.5,
    "bucket": 10000,
    "energy": 149,
    "energyCapacity": 800,
    "cached": true,
    "cacheAge": 45000,
    "offline": false
}
```

---

## Benefits

### For Development
- **Fast iterations**: Change polling intervals without touching game code
- **Rate limit immunity**: Automatic fallback to cached data
- **Debugging**: Cache status visible in UI and API

### For Production
- **Minimal API usage**: Configurable intervals + caching = very few calls
- **Resilient**: Works even when rate limited
- **Transparent**: User always knows if data is cached

### For Scalability
- **Multiple rooms**: Cache shared across all room queries
- **Multiple clients**: Each client has independent cache
- **Extensible**: Easy to add more cache tiers (Redis, file-based, etc.)

---

## Monitoring

### In UI
- Connection indicator: Green = live, Yellow = cached, Red = offline
- Cache age: "📦 CACHED (2m 34s old)"
- Tooltips explain what each metric means

### In Console
Server logs show:
```
[Screeps Client] Rate limited for 22 minutes. Using cached data.
[Screeps Client] Returning cached memory (age: 45.2s)
[Screeps Client] Rate limit expired, resuming normal operation
```

### Via API
```bash
curl http://localhost:3000/api/health
```

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Intelligent caching with TTL
- ✅ Rate limit detection and fallback
- ✅ UI cache status indicators

### Phase 2 (Planned)
- Manual refresh button (bypass intervals)
- Configurable cache TTLs via UI
- Cache invalidation on user command

### Phase 3 (Advanced)
- WebSocket connection to Screeps (if supported)
- Local file reading mode (parse Screeps client storage)
- Multi-room cache coordination
- Redis cache for multi-instance deployments

---

## Troubleshooting

### "Rate limited for X hours"
**Cause**: Too many API calls in short timeframe  
**Solution**: Enable no-rate-limit on token OR increase polling intervals  
**Workaround**: Dashboard works with cached data, just shows age

### "OFFLINE MODE" showing
**Cause**: No cached data available + rate limited  
**Solution**: Wait for rate limit to expire, dashboard will auto-recover  
**Prevention**: Don't poll more frequently than every 10 seconds

### Cache not updating
**Cause**: In-game telemetry not running (check `Memory.dashboard`)  
**Solution**: Verify `Analytics.recordDashboardTelemetry()` is called in `main.js`  
**Debug**: Run `Memory.dashboard.W13N57` in Screeps console

---

## Architecture Principles

### High Cohesion
- Game engine focused on gameplay and data collection
- Dashboard focused on display and user interaction
- Each component has single, clear responsibility

### Low Coupling
- Game works without dashboard (stores in Memory)
- Dashboard works without game (uses cached data)
- Communication only via Memory object (data contract)

### Resilience
- No single point of failure
- Graceful degradation when API unavailable
- Always functional, even with stale data

### Performance
- Minimal CPU usage in-game (100-tick intervals)
- Minimal API calls (configurable, cached, rate-limit aware)
- Efficient rendering (only updates changed data)
