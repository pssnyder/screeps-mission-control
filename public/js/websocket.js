/**
 * WEBSOCKET CONNECTION
 * Real-time communication with server
 */

let socket;

function initializeWebSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('[WebSocket] Connected');
        updateConnectionStatus(true);
        addConsoleMessage('system', 'CONNECTED TO MISSION CONTROL SERVER');
    });
    
    socket.on('disconnect', () => {
        console.log('[WebSocket] Disconnected');
        updateConnectionStatus(false);
        addConsoleMessage('error', 'DISCONNECTED FROM SERVER');
    });
    
    socket.on('screeps:connected', (data) => {
        addConsoleMessage('system', `SCREEPS API CONNECTED - ${data.defaultRoom} (${data.defaultShard})`);
    });
    
    socket.on('screeps:telemetry', (data) => {
        updateTelemetry(data);
    });
    
    socket.on('screeps:status', (data) => {
        updateStatus(data);
    });
    
    socket.on('screeps:command:result', (data) => {
        addConsoleMessage('command', `> ${data.command}`);
        if (data.result && data.result.output) {
            data.result.output.forEach(line => {
                addConsoleMessage('result', line);
            });
        }
    });
    
    socket.on('screeps:command:error', (data) => {
        addConsoleMessage('error', `ERROR: ${data.error}`);
    });
    
    socket.on('screeps:error', (data) => {
        addConsoleMessage('error', `API ERROR: ${data.message}`);
        // Alert will be handled by checkAlerts() in app.js
    });
}

function sendCommand(command) {
    if (!socket || !socket.connected) {
        addConsoleMessage('error', 'NOT CONNECTED TO SERVER');
        return;
    }
    
    socket.emit('screeps:command', {
        command: command
    });
}

function updateConnectionStatus(connected) {
    const indicator = document.getElementById('connection-status');
    const text = document.getElementById('connection-text');
    
    if (connected) {
        indicator.classList.add('connected');
        text.textContent = 'CONNECTED';
        text.style.color = '#00ff88';
    } else {
        indicator.classList.remove('connected');
        text.textContent = 'DISCONNECTED';
        text.style.color = '#ff4444';
    }
}

// Export
window.WebSocket = {
    init: initializeWebSocket,
    sendCommand: sendCommand
};
