# 🚀 Screeps Mission Control

**Aviation-inspired dashboard and HUD interface for real-time Screeps colony monitoring and control.**

![Mission Control Status](https://img.shields.io/badge/status-operational-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

---

## 🎯 Features

### Real-Time Telemetry
- **Circular Gauges**: CPU usage, bucket level, energy capacity
- **Live Graphs**: Historical CPU and energy trends (60-point rolling window)
- **Status Dashboard**: RCL progress, creep counts, infrastructure inventory

### Command & Control
- **Console Interface**: Execute any Screeps console command remotely
- **Quick Commands**: `status()`, `profile()`, `debug()`, `strategy()`
- **WebSocket Updates**: Sub-second latency for critical metrics

### Aviation Aesthetics
- **Cockpit-Style UI**: High-contrast dark theme with cyan/green accents
- **Mission-Critical Design**: Clear, readable, functional layout
- **Alert System**: Visual warnings for low energy, high CPU, low bucket

---

## 📋 Prerequisites

- **Node.js** 14.0.0 or higher
- **Screeps Account** with API access
- **Screeps Engine** v2.0+ (from parent directory)

---

## 🔧 Installation

### 1. Install Dependencies

```bash
cd mission-control
npm install
```

### 2. Configure Credentials

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your Screeps credentials:

```env
# Option 1: Email/Password
SCREEPS_EMAIL=your_email@example.com
SCREEPS_PASSWORD=your_password_here

# Option 2: API Token (recommended)
SCREEPS_TOKEN=your_api_token_here

# Server Configuration
PORT=3000
DEFAULT_ROOM=W13N57
DEFAULT_SHARD=shard3

# Update Intervals (milliseconds)
STATUS_UPDATE_INTERVAL=5000
TELEMETRY_UPDATE_INTERVAL=2000
```

**Get API Token**: https://screeps.com/a/#!/account/auth-tokens

### 3. Launch Mission Control

```bash
npm start
# or for development with auto-restart:
npm run dev
```

### 4. Open Dashboard

Navigate to: **http://localhost:3000**

---

## 🎮 Usage

### Dashboard Overview

```
┌─────────────────────────────────────────────────────────┐
│ ⬡ SCREEPS MISSION CONTROL        ● CONNECTED  12:34:56 │
├───────────┬─────────────────────────┬───────────────────┤
│ TELEMETRY │   COLONY STATUS         │  PERFORMANCE      │
│           │                         │                   │
│  ○ CPU    │  ROOM: W13N57          │  [CPU Graph]      │
│  ○ BUCKET │  RCL: 3 (0.35%)        │                   │
│  ○ ENERGY │  CREEPS: 11            │  [Energy Graph]   │
│           │                         │                   │
│           │  CREEP ROSTER          │                   │
│           │  builder: 3             │                   │
│           │  harvester: 4           │                   │
│           │  upgrader: 3            │                   │
│           │                         │                   │
│           │  CONSTRUCTION           │                   │
│           │  extension: 5           │                   │
│           │  tower: 1               │                   │
├───────────┴─────────────────────────┴───────────────────┤
│ COMMAND CONSOLE                                         │
│ > status()                          [SEND]             │
└─────────────────────────────────────────────────────────┘
```

### Console Commands

Execute any Screeps command:

```javascript
// Engine commands
status()
profile()
debug()
strategy()

// Memory queries
Memory.engine.version
Game.cpu.getUsed()
Game.rooms.W13N57.energyAvailable

// Custom logic
SpawnHelper.quick()
Analytics.analyze()
```

### Quick Commands (Browser Console)

```javascript
quickCommand.status()   // Run status()
quickCommand.profile()  // Run profile()
quickCommand.debug()    // Run debug()
quickCommand.strategy() // Run strategy()
```

---

## 📊 Telemetry Metrics

### Gauges
- **CPU**: Real-time CPU usage (0-20, warning >70%, danger >90%)
- **Bucket**: CPU bucket level (0-10000, warning <3000, danger <1000)
- **Energy**: Colony energy (current/capacity, warning <30%, danger <10%)

### Graphs
- **CPU History**: Rolling 60-point trend line
- **Energy History**: Rolling 60-point trend line

### Status Dashboard
- Room name and shard
- RCL level and progress percentage
- Creep count and role distribution
- Infrastructure counts (spawns, extensions, towers)
- Construction site breakdown
- Engine version

---

## 🏗️ Architecture

### Backend (`server/`)
```
index.js            - Express + Socket.IO server
screeps-client.js   - Screeps API wrapper
```

### Frontend (`public/`)
```
index.html          - Main HUD interface
css/
  mission-control.css - Cockpit styling
js/
  app.js            - Main application logic
  gauges.js         - Canvas gauge rendering
  graphs.js         - Chart.js integration
  websocket.js      - Real-time connection
```

### Data Flow
```
Screeps API
    ↓
Server (screeps-client.js)
    ↓
WebSocket (Socket.IO)
    ↓
Frontend (gauges + graphs)
```

---

## 🔐 Security

- **Credentials**: Never commit `.env` file (already in `.gitignore`)
- **API Token**: Use token authentication (more secure than password)
- **Localhost Only**: Default configuration binds to `localhost:3000`
- **Rate Limiting**: Built-in throttling respects Screeps API limits

---

## 🎨 Customization

### Update Intervals

Edit `.env`:
```env
STATUS_UPDATE_INTERVAL=5000     # Status checks (ms)
TELEMETRY_UPDATE_INTERVAL=2000  # Gauge updates (ms)
```

### Color Theme

Edit `public/css/mission-control.css`:
```css
:root {
    --accent-blue: #00d4ff;    /* Primary accent */
    --accent-green: #00ff88;   /* Success/healthy */
    --accent-yellow: #ffc700;  /* Warning */
    --accent-red: #ff4444;     /* Danger/error */
}
```

### Add Custom Commands

Edit `public/js/app.js`:
```javascript
window.quickCommand = {
    status: () => window.WebSocket.sendCommand('status()'),
    myCustomCmd: () => window.WebSocket.sendCommand('myFunction()')
};
```

---

## 🐛 Troubleshooting

### "Failed to connect to Screeps"
- Check credentials in `.env`
- Verify Screeps API token is valid
- Ensure network connection to screeps.com

### "Disconnected from server"
- Restart Mission Control: `npm start`
- Check console for error messages

### Gauges not updating
- Verify WebSocket connection (green indicator)
- Check browser console for JavaScript errors
- Ensure Screeps room `W13N57` exists (or update `DEFAULT_ROOM`)

### High CPU on Mission Control
- Increase update intervals in `.env`
- Reduce `maxDataPoints` in `graphs.js`

---

## 🚀 Integration with Screeps Engine

Mission Control works seamlessly with the parent `screeps-engine` codebase:

### Console Commands
All custom commands from `console.helper.js` work:
- `status()` - Enhanced v2.0 colony status
- `profile()` - CPU profiling breakdown
- `debug()` - Simulation diagnostics
- `strategy()` - Current strategic priorities

### Version Detection
Dashboard displays `Memory.engine.version` from your game code (currently v2.0.1).

### Analytics
Real-time telemetry feeds into your analytics background - track trends, identify bottlenecks, optimize performance.

---

## 📈 Roadmap

### v1.1 (Next)
- [ ] Multi-room grid view
- [ ] Desktop notifications for alerts
- [ ] Historical playback (time scrubbing)
- [ ] Touch-friendly mobile layout

### v2.0 (Future)
- [ ] Command macros/shortcuts
- [ ] Custom gauge configurations
- [ ] Export telemetry data (CSV/JSON)
- [ ] Integration with machine learning predictions

---

## 📝 License

MIT License - see parent project for details.

---

## 🙏 Acknowledgments

- Inspired by aviation cockpits, NASA mission control, and nuclear power plant HUDs
- Built for analytics-driven Screeps optimization
- Designed by Pat Snyder for the Screeps Engine v2.0+ ecosystem

---

**🎮 Ready for deployment? Launch Mission Control and take command of your colonies!**

```bash
npm start
```

**Dashboard**: http://localhost:3000
