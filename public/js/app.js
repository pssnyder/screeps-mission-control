/**
 * MISSION CONTROL - Main Application
 * Coordinates all components
 */

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    startClock();
});

function initializeApp() {
    addConsoleMessage('system', 'INITIALIZING MISSION CONTROL...');
    window.WebSocket.init();
}

function setupEventListeners() {
    // Console input
    const consoleInput = document.getElementById('console-input');
    const consoleSend = document.getElementById('console-send');
    
    consoleSend.addEventListener('click', () => {
        const command = consoleInput.value.trim();
        if (command) {
            window.WebSocket.sendCommand(command);
            consoleInput.value = '';
        }
    });
    
    consoleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            consoleSend.click();
        }
    });
}

function startClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });
    document.getElementById('timestamp').textContent = timeString;
}

function updateTelemetry(data) {
    // Update gauges
    window.Gauges.updateCPU(data.cpu, data.cpuLimit);
    window.Gauges.updateBucket(data.bucket);
    window.Gauges.updateEnergy(data.energy, data.energyCapacity);
    
    // Add to graphs
    window.Graphs.addCPUData(data.cpu);
    window.Graphs.addEnergyData(data.energy);
    
    // Update room info
    document.getElementById('room-name').textContent = data.room;
    document.getElementById('rcl-level').textContent = data.rcl;
    
    const rclPercent = ((data.rclProgress / data.rclProgressTotal) * 100).toFixed(2);
    document.getElementById('rcl-progress').textContent = rclPercent + '%';
    
    document.getElementById('creep-count').textContent = data.creepCount;
    document.getElementById('spawn-count').textContent = data.structures.spawns;
    document.getElementById('ext-count').textContent = data.structures.extensions;
    document.getElementById('tower-count').textContent = data.structures.towers;
    
    // Show cache status if data is cached
    updateCacheStatus(data);
    
    // Check for alerts and categorize them
    checkAlerts(data);
}

function updateCacheStatus(data) {
    const cacheEl = document.getElementById('cache-status');
    if (data.cached) {
        const ageMinutes = Math.floor((data.cacheAge || 0) / 60000);
        const ageSec = Math.floor(((data.cacheAge || 0) % 60000) / 1000);
        cacheEl.textContent = `📦 CACHED (${ageMinutes}m ${ageSec}s old)`;
        cacheEl.style.display = 'inline';
    } else if (data.offline) {
        cacheEl.textContent = '⚠️ OFFLINE MODE';
        cacheEl.style.display = 'inline';
    } else {
        cacheEl.style.display = 'none';
    }
}

// Alert categorization and management
const alertCategories = {
    CRITICAL: { priority: 1, color: '#ff4444', icon: '🚨' },
    HIGH: { priority: 2, color: '#ff9944', icon: '⚠️' },
    MEDIUM: { priority: 3, color: '#ffdd44', icon: '⚡' },
    LOW: { priority: 4, color: '#44dd88', icon: 'ℹ️' }
};

let activeAlerts = new Map();

function checkAlerts(data) {
    // Clear old alerts
    clearExpiredAlerts();
    
    // CRITICAL: CPU over limit
    if (data.cpu > data.cpuLimit) {
        addAlert('CPU_OVER_LIMIT', 'CRITICAL', `CPU EXCEEDED LIMIT: ${data.cpu}/${data.cpuLimit}`);
    } else {
        removeAlert('CPU_OVER_LIMIT');
    }
    
    // HIGH: CPU warning (>90%)
    if (data.cpu / data.cpuLimit > 0.9 && data.cpu <= data.cpuLimit) {
        addAlert('CPU_HIGH', 'HIGH', `High CPU Usage: ${Math.round((data.cpu / data.cpuLimit) * 100)}%`);
    } else {
        removeAlert('CPU_HIGH');
    }
    
    // HIGH: Low bucket (<1000)
    if (data.bucket < 1000) {
        addAlert('BUCKET_LOW', 'HIGH', `Low Bucket: ${data.bucket}/10000`);
    } else {
        removeAlert('BUCKET_LOW');
    }
    
    // LOW: Low energy (<20%) - not critical, will self-correct
    if (data.energy / data.energyCapacity < 0.2 && data.energy > 0) {
        addAlert('ENERGY_LOW', 'LOW', `Low Energy: ${Math.round((data.energy / data.energyCapacity) * 100)}%`);
    } else {
        removeAlert('ENERGY_LOW');
    }
    
    // Update alert display
    renderAlerts();
}

function addAlert(id, category, message) {
    activeAlerts.set(id, {
        id,
        category,
        message,
        timestamp: Date.now(),
        ...alertCategories[category]
    });
}

function removeAlert(id) {
    activeAlerts.delete(id);
}

function clearExpiredAlerts() {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    for (const [id, alert] of activeAlerts) {
        if (now - alert.timestamp > fiveMinutes) {
            activeAlerts.delete(id);
        }
    }
}

function renderAlerts() {
    const alertBar = document.getElementById('alert-bar');
    
    if (activeAlerts.size === 0) {
        alertBar.style.display = 'none';
        return;
    }
    
    // Sort by priority
    const sorted = Array.from(activeAlerts.values()).sort((a, b) => a.priority - b.priority);
    
    // Show highest priority alert
    const topAlert = sorted[0];
    const alertMessage = document.getElementById('alert-message');
    
    alertMessage.innerHTML = `${topAlert.icon} <strong>${topAlert.category}:</strong> ${topAlert.message}`;
    alertBar.style.display = 'flex';
    alertBar.style.borderLeftColor = topAlert.color;
    
    // Show count if multiple alerts
    if (activeAlerts.size > 1) {
        alertMessage.innerHTML += ` <span style="opacity: 0.7">(+${activeAlerts.size - 1} more)</span>`;
    }
}

function updateStatus(data) {
    // Update version
    document.getElementById('engine-version').textContent = data.version;
    
    // Update creep roster
    const rosterContent = document.getElementById('creep-roster-content');
    rosterContent.innerHTML = '';
    
    for (const role in data.creeps.byRole) {
        const item = document.createElement('div');
        item.className = 'roster-item';
        item.textContent = `${role}: ${data.creeps.byRole[role]}`;
        rosterContent.appendChild(item);
    }
    
    // Update construction
    const constructionContent = document.getElementById('construction-content');
    constructionContent.innerHTML = '';
    
    if (data.construction.total === 0) {
        const item = document.createElement('div');
        item.className = 'construction-item';
        item.textContent = 'No active construction';
        item.style.color = '#8b92a0';
        constructionContent.appendChild(item);
    } else {
        for (const type in data.construction.byType) {
            const item = document.createElement('div');
            item.className = 'construction-item';
            item.textContent = `${type}: ${data.construction.byType[type]}`;
            constructionContent.appendChild(item);
        }
    }
}

function addConsoleMessage(type, message) {
    const output = document.getElementById('console-output');
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = message;
    output.appendChild(line);
    
    // Auto-scroll to bottom
    output.scrollTop = output.scrollHeight;
    
    // Keep only last 100 lines
    while (output.children.length > 100) {
        output.removeChild(output.firstChild);
    }
}

// Removed annoying popup showAlert function - now using persistent alert bar

// Quick command shortcuts
window.quickCommand = {
    status: () => window.WebSocket.sendCommand('status()'),
    profile: () => window.WebSocket.sendCommand('profile()'),
    debug: () => window.WebSocket.sendCommand('debug()'),
    strategy: () => window.WebSocket.sendCommand('strategy()')
};

// Wiki modal controls
document.addEventListener('DOMContentLoaded', () => {
    const wikiToggle = document.getElementById('wiki-toggle');
    const wikiModal = document.getElementById('wiki-modal');
    const wikiClose = document.getElementById('wiki-close');
    
    wikiToggle.addEventListener('click', () => {
        wikiModal.style.display = 'flex';
        window.Wiki.init();
    });
    
    wikiClose.addEventListener('click', () => {
        wikiModal.style.display = 'none';
    });
    
    // Close on background click
    wikiModal.addEventListener('click', (e) => {
        if (e.target === wikiModal) {
            wikiModal.style.display = 'none';
        }
    });
    
    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && wikiModal.style.display === 'flex') {
            wikiModal.style.display = 'none';
        }
    });
});
