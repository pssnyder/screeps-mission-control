/**
 * COLONY MANAGEMENT DASHBOARD
 * Admin-only control panel for Screeps colony
 */

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBFiTMZNAtcUWKsfh-H2toWcNWyWWrgAtY",
    authDomain: "rts-labs-f3981.firebaseapp.com",
    projectId: "rts-labs-f3981",
    storageBucket: "rts-labs-f3981.firebasestorage.app",
    messagingSenderId: "649339903544",
    appId: "1:649339903544:web:85b16aee1b339420ae90cd"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let authToken = null;

// Check auth state on load
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        user.getIdToken().then(token => {
            authToken = token;
            document.getElementById('authPrompt').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            loadCurrentBranch();
            loadCurrentConfig();
        });
    } else {
        document.getElementById('authPrompt').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
    }
});

/**
 * Login
 */
async function login() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const errorEl = document.getElementById('authError');
    
    try {
        errorEl.textContent = '';
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        errorEl.textContent = error.message;
    }
}

/**
 * Logout
 */
function logout() {
    auth.signOut();
}

/**
 * Execute console command
 */
async function executeCommand(command) {
    const outputEl = document.getElementById('commandOutput');
    outputEl.textContent = `Executing: ${command}\n\nWaiting for response...`;
    
    try {
        const response = await fetch('/api/screepsConsole', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ command })
        });
        
        const result = await response.json();
        
        if (result.success) {
            outputEl.textContent = `> ${command}\n\n${JSON.stringify(result.output, null, 2)}`;
        } else {
            outputEl.textContent = `> ${command}\n\nError: ${result.error || 'Command failed'}`;
        }
        
        // Store in history
        await db.collection('console_history').add({
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            user: currentUser.uid,
            command: command,
            success: result.success
        });
    } catch (error) {
        outputEl.textContent = `Error: ${error.message}`;
    }
}

/**
 * Switch active branch
 */
async function switchBranch() {
    const branch = document.getElementById('branchSelect').value;
    const outputEl = document.getElementById('branchOutput');
    outputEl.textContent = `Switching to ${branch}...\n`;
    
    try {
        // Execute Screeps console command to switch branch
        const command = `Memory.activeBranch = '${branch}'`;
        const response = await fetch('/api/screepsConsole', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ command })
        });
        
        const result = await response.json();
        
        if (result.success) {
            outputEl.textContent = `✓ Successfully switched to ${branch}\n\nCode will reload on next tick.`;
            document.getElementById('branchIndicator').textContent = `Active Branch: ${branch}`;
            document.getElementById('branchIndicator').classList.add('active');
            
            // Update Firestore
            await db.collection('system_state').doc('active_branch').set({
                branch: branch,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                user: currentUser.uid
            });
            
            // Show browser notification
            if (Notification.permission === 'granted') {
                new Notification('Branch Switched', {
                    body: `Active branch is now: ${branch}`,
                    icon: '/favicon.ico'
                });
            }
        } else {
            outputEl.textContent = `✗ Failed to switch branch: ${result.error}`;
        }
    } catch (error) {
        outputEl.textContent = `Error: ${error.message}`;
    }
}

/**
 * Load current active branch
 */
async function loadCurrentBranch() {
    try {
        const doc = await db.collection('system_state').doc('active_branch').get();
        if (doc.exists) {
            const branch = doc.data().branch;
            document.getElementById('branchIndicator').textContent = `Active Branch: ${branch}`;
            document.getElementById('branchSelect').value = branch;
            document.getElementById('branchOutput').textContent = `Current active branch: ${branch}`;
        }
    } catch (error) {
        console.error('Error loading branch:', error);
    }
}

/**
 * Save configuration
 */
async function saveConfig() {
    const outputEl = document.getElementById('configOutput');
    outputEl.textContent = 'Saving configuration...\n';
    
    const config = {
        autoSpawn: document.getElementById('autoSpawn').checked,
        autoStructurePlanning: document.getElementById('autoPlanning').checked,
        posture: document.getElementById('posture').value,
        towerRepairThreshold: parseFloat(document.getElementById('repairThreshold').value) / 100,
        cpuLimit: parseInt(document.getElementById('cpuLimit').value)
    };
    
    try {
        // Build console command to update Memory.config
        const command = `
            if (!Memory.config) Memory.config = {};
            Memory.config.autoSpawn = ${config.autoSpawn};
            Memory.config.autoStructurePlanning = ${config.autoStructurePlanning};
            Memory.config.posture = '${config.posture}';
            Memory.config.towerRepairThreshold = ${config.towerRepairThreshold};
            Memory.config.cpuLimit = ${config.cpuLimit};
            'Configuration updated successfully'
        `.trim();
        
        const response = await fetch('/api/screepsConsole', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ command })
        });
        
        const result = await response.json();
        
        if (result.success) {
            outputEl.textContent = '✓ Configuration saved successfully';
            
            // Store config history
            await db.collection('config_history').add({
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                user: currentUser.uid,
                config: config
            });
        } else {
            outputEl.textContent = `✗ Failed to save: ${result.error}`;
        }
    } catch (error) {
        outputEl.textContent = `Error: ${error.message}`;
    }
}

/**
 * Load current configuration
 */
async function loadCurrentConfig() {
    try {
        // Execute command to get current config
        const response = await fetch('/api/screepsConsole', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ command: 'Memory.config' })
        });
        
        const result = await response.json();
        if (result.success && result.output) {
            const config = result.output;
            if (config.autoSpawn !== undefined) {
                document.getElementById('autoSpawn').checked = config.autoSpawn;
            }
            if (config.autoStructurePlanning !== undefined) {
                document.getElementById('autoPlanning').checked = config.autoStructurePlanning;
            }
            if (config.posture) {
                document.getElementById('posture').value = config.posture;
            }
            if (config.towerRepairThreshold !== undefined) {
                const percent = Math.round(config.towerRepairThreshold * 100);
                document.getElementById('repairThreshold').value = percent;
                document.getElementById('repairValue').textContent = percent + '%';
            }
            if (config.cpuLimit !== undefined) {
                document.getElementById('cpuLimit').value = config.cpuLimit;
                document.getElementById('cpuValue').textContent = config.cpuLimit;
            }
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

/**
 * Refresh quick metrics
 */
async function refreshMetrics() {
    try {
        const response = await fetch('/api/screepsConsole', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ command: 'Memory.dashboard["W13N57"]' })
        });
        
        const result = await response.json();
        if (result.success && result.output) {
            renderQuickChart(result.output);
        }
    } catch (error) {
        console.error('Error refreshing metrics:', error);
    }
}

/**
 * Render quick metrics chart
 */
function renderQuickChart(data) {
    const ctx = document.getElementById('quickChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Energy', 'RCL Progress', 'Extensions', 'Towers'],
            datasets: [{
                label: 'Current Status',
                data: [
                    data.energy || 0,
                    Math.round((data.rclProgress / data.rclProgressTotal) * 100) || 0,
                    data.structures?.extensions || 0,
                    data.structures?.towers || 0
                ],
                backgroundColor: [
                    'rgba(0, 255, 0, 0.6)',
                    'rgba(255, 255, 0, 0.6)',
                    'rgba(0, 200, 255, 0.6)',
                    'rgba(255, 100, 0, 0.6)'
                ],
                borderColor: '#00ff00',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#00ff00', font: { family: 'Courier New' } },
                    grid: { color: '#2a2a2a' }
                },
                x: {
                    ticks: { color: '#00ff00', font: { family: 'Courier New' } },
                    grid: { color: '#2a2a2a' }
                }
            }
        }
    });
}

// Request notification permission on load
if (Notification.permission === 'default') {
    Notification.requestPermission();
}

// Auto-refresh metrics every 60 seconds
setInterval(() => {
    if (currentUser) {
        refreshMetrics();
    }
}, 60000);
