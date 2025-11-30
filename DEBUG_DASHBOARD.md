# Dashboard Telemetry Debugging Guide

## Issue: Dashboard showing incorrect energy values

### Step 1: Verify telemetry is being collected in-game

In Screeps console, run:
```javascript
Memory.dashboard
```

**Expected output:**
```javascript
{
  W13N57: {
    timestamp: 12345678,
    rcl: 3,
    rclProgress: 27513,
    rclProgressTotal: 135000,
    energy: 65,              // Current energy
    energyCapacity: 800,     // Max capacity
    structures: { extensions: 10, towers: 1, spawns: 1 },
    construction: { total: 7, byType: {...} }
  }
}
```

**If undefined:** Dashboard telemetry hasn't run yet. Wait for next 100-tick cycle (~5 minutes).

**If values are swapped:** There's a bug in `analytics.js` recording.

---

### Step 2: Check API is reading correct data

In browser console (F12), check WebSocket messages:
```javascript
// Look for telemetry updates every 2 seconds
// Should show: { energy: 65, energyCapacity: 800, ... }
```

**If swapped here:** Bug is in `screeps-client.js` getTelemetry() mapping.

---

### Step 3: Check gauge rendering

In browser console:
```javascript
// Check if gauge is receiving correct values
window.Gauges.updateEnergy(65, 800);  // Should show 8% gauge
window.Gauges.updateEnergy(800, 800); // Should show 100% gauge
```

**If gauge shows wrong percentage:** Bug is in `gauges.js` setValue() or render().

---

## Common Issues

### Issue: "Dashboard shows 100% energy when actually at 8%"

**Possible causes:**
1. **Energy and energyCapacity swapped** - Check Memory.dashboard values
2. **Gauge maxValue not updating** - Check gauges.js line 116
3. **API returning wrong field** - Check screeps-client.js line 83-84

**Quick test in Screeps console:**
```javascript
Game.rooms.W13N57.energyAvailable      // Should be ~65
Game.rooms.W13N57.energyCapacityAvailable  // Should be ~800
```

---

### Issue: "Dashboard shows hardcoded values"

**Cause:** Dashboard telemetry hasn't run yet (needs 100 ticks after deployment)

**Solution:** 
1. Deploy code: `./deploy.sh deploy`
2. Wait ~5 minutes for Game.time % 100 === 0
3. Check `Memory.dashboard` in console
4. Restart Mission Control server

---

## Debugging Commands

### In Screeps Console:
```javascript
// Check if telemetry function exists
Analytics.recordDashboardTelemetry

// Manually trigger telemetry (for testing)
Analytics.recordDashboardTelemetry()

// View collected data
Memory.dashboard.W13N57

// Check room energy values
const room = Game.rooms.W13N57;
console.log(`Energy: ${room.energyAvailable}/${room.energyCapacityAvailable}`);
```

### In Browser Console (F12):
```javascript
// Test gauge directly
window.Gauges.updateEnergy(100, 800);  // Should show 12.5%

// Check WebSocket connection
window.WebSocket

// Manually trigger telemetry fetch
// (Server should be logging API responses)
```

---

## Expected vs Actual

### Expected Behavior:
- Energy gauge shows 8% (65/800)
- Displays "65/800" below gauge
- Yellow color (warning threshold < 30%)

### If showing 100%:
- Bug: Likely `energy` and `energyCapacity` are swapped
- Check: `screeps-client.js` line 83-84
- Verify: `dashboardData.energy` vs `dashboardData.energyCapacity`

### If showing 0%:
- Dashboard telemetry not collected yet
- Wait for 100-tick cycle
- Check Memory.dashboard exists
