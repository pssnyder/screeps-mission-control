# Screeps Mission Control - AI Instructions

## Project Overview
**Screeps Mission Control** is a web-based dashboard and HUD interface for monitoring and controlling Screeps colonies. Inspired by aviation cockpits, space mission control, and nuclear power plant control rooms, this provides real-time telemetry and remote command execution.

## Tech Stack
- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (no framework - performance critical)
- **API**: screeps-api npm package for remote Screeps access
- **Real-time**: WebSocket connections for live updates

## Design Philosophy
1. **Mission-Critical Interface**: Clear, readable, high-contrast design
2. **Aviation/Space Aesthetics**: Gauges, dials, status indicators, warning lights
3. **Real-time Telemetry**: Live CPU, bucket, energy, creep counts
4. **Remote Control**: Execute console commands, trigger actions
5. **Analytics Focus**: Graphs, trends, performance metrics

## Key Features
- Real-time gauges (CPU usage, bucket level, energy capacity)
- Colony status dashboard (RCL, construction, infrastructure)
- Creep roster with role distribution
- Live performance graphs (CPU history, energy trends)
- Command console for remote execution
- Alert system (low energy, CPU spikes, hostile threats)
- Multi-room support (when user expands)

## Integration with Screeps Engine
- Connects to existing `screeps-engine` codebase in parent directory
- Uses same console commands: `status()`, `profile()`, `debug()`, `strategy()`
- Respects v2.0.1 architecture (chess-engine decision tree)
- Analytics-driven (user has analytics background)

## File Structure
```
mission-control/
├── server/
│   ├── index.js           # Express server + Socket.IO
│   ├── screeps-client.js  # Screeps API wrapper
│   └── config.js          # Credentials (gitignored)
├── public/
│   ├── index.html         # Main HUD interface
│   ├── css/
│   │   └── mission-control.css  # Cockpit styling
│   ├── js/
│   │   ├── app.js         # Main application logic
│   │   ├── gauges.js      # Gauge rendering (canvas)
│   │   ├── graphs.js      # Chart.js integration
│   │   └── websocket.js   # Real-time connection
│   └── assets/
│       └── sounds/        # Alert sounds (optional)
├── package.json
├── .env.example
└── README.md
```

## Coding Conventions
- Use async/await for API calls
- WebSocket events prefixed with `screeps:` (e.g., `screeps:status`)
- Canvas-based gauges for performance
- CSS custom properties for theming
- Error handling with retry logic (Screeps API can be flaky)

## Development Workflow
1. Start server: `npm run dev`
2. Open browser: `http://localhost:3000`
3. Configure Screeps credentials in `.env`
4. Real-time updates via WebSocket

## Security
- Never commit `.env` file
- Store Screeps token securely
- Localhost only by default (no external access)

## Performance
- Throttle API calls (respect rate limits)
- Use WebSocket for updates (avoid polling)
- Canvas rendering for gauges (avoid DOM updates)
- Lazy load graphs (only when visible)

## Future Enhancements
- Multi-room dashboard grid
- Historical playback (scrub through time)
- Alert notifications (desktop/sound)
- Command shortcuts/macros
- Touch-friendly mobile view
