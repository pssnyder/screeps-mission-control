/**
 * ANALYTICS DASHBOARD
 * Public-facing historical metrics visualization
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
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    console.warn('Firestore persistence error:', err);
});

// Chart instances
let cpuChart, energyChart, rclChart, creepChart;

// Current room (will support dropdown in future)
const ROOM = 'W13N57';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set up date range buttons
    document.querySelectorAll('.date-selector button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.date-selector button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const days = parseInt(btn.dataset.range);
            loadAnalytics(days);
        });
    });
    
    // Load initial data (last 7 days)
    loadAnalytics(7);
});

/**
 * Load analytics data from Firestore
 */
async function loadAnalytics(days) {
    try {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('charts').style.display = 'none';
        
        // Calculate date range
        let query = db.collection('telemetry_daily')
            .where('room', '==', ROOM)
            .orderBy('date', 'asc');
        
        if (days > 0) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const startDateStr = startDate.toISOString().split('T')[0];
            query = query.where('date', '>=', startDateStr);
        }
        
        // Fetch data
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            document.getElementById('loading').textContent = 'No data available yet. Analytics collected daily at 2 AM.';
            return;
        }
        
        const data = snapshot.docs.map(doc => doc.data());
        
        // Render charts
        renderCharts(data);
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('charts').style.display = 'grid';
    } catch (error) {
        console.error('Error loading analytics:', error);
        document.getElementById('loading').textContent = `Error loading data: ${error.message}`;
    }
}

/**
 * Render all charts
 */
function renderCharts(data) {
    const labels = data.map(d => d.date);
    
    // CPU Usage Chart
    const cpuData = data.map(d => d.avgCpu || 0);
    renderCpuChart(labels, cpuData);
    
    // Energy Capacity Chart
    const energyData = data.map(d => d.energyCapacity || 0);
    const currentEnergyData = data.map(d => d.currentEnergy || 0);
    renderEnergyChart(labels, energyData, currentEnergyData);
    
    // RCL Progression Chart
    const rclData = data.map(d => ({
        rcl: d.rcl,
        progress: d.rclProgress / d.rclProgressTotal * 100
    }));
    renderRclChart(labels, rclData);
    
    // Creep Population Chart
    const creepData = data.map(d => d.creepCount || 0);
    renderCreepChart(labels, creepData);
}

/**
 * CPU Usage Chart
 */
function renderCpuChart(labels, data) {
    const ctx = document.getElementById('cpuChart').getContext('2d');
    
    if (cpuChart) {
        cpuChart.destroy();
    }
    
    cpuChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average CPU',
                data: data,
                borderColor: '#00ff00',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: '#00ff00', font: { family: 'Courier New' } }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#00ff00', font: { family: 'Courier New' } },
                    grid: { color: '#2a2a2a' }
                },
                y: {
                    ticks: { color: '#00ff00', font: { family: 'Courier New' } },
                    grid: { color: '#2a2a2a' },
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Energy Capacity Chart
 */
function renderEnergyChart(labels, capacityData, currentData) {
    const ctx = document.getElementById('energyChart').getContext('2d');
    
    if (energyChart) {
        energyChart.destroy();
    }
    
    energyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Energy Capacity',
                    data: capacityData,
                    borderColor: '#00ff00',
                    backgroundColor: 'rgba(0, 255, 0, 0.1)',
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: 'Current Energy',
                    data: currentData,
                    borderColor: '#ffff00',
                    backgroundColor: 'rgba(255, 255, 0, 0.1)',
                    borderWidth: 2,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: '#00ff00', font: { family: 'Courier New' } }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#00ff00', font: { family: 'Courier New' } },
                    grid: { color: '#2a2a2a' }
                },
                y: {
                    ticks: { color: '#00ff00', font: { family: 'Courier New' } },
                    grid: { color: '#2a2a2a' },
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * RCL Progression Chart
 */
function renderRclChart(labels, data) {
    const ctx = document.getElementById('rclChart').getContext('2d');
    
    if (rclChart) {
        rclChart.destroy();
    }
    
    rclChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'RCL Progress %',
                data: data.map(d => d.progress),
                backgroundColor: '#00ff00',
                borderColor: '#00ff00',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: '#00ff00', font: { family: 'Courier New' } }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const rcl = data[context.dataIndex].rcl;
                            const progress = context.parsed.y.toFixed(1);
                            return `RCL ${rcl}: ${progress}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#00ff00', font: { family: 'Courier New' } },
                    grid: { color: '#2a2a2a' }
                },
                y: {
                    ticks: { color: '#00ff00', font: { family: 'Courier New' } },
                    grid: { color: '#2a2a2a' },
                    min: 0,
                    max: 100
                }
            }
        }
    });
}

/**
 * Creep Population Chart
 */
function renderCreepChart(labels, data) {
    const ctx = document.getElementById('creepChart').getContext('2d');
    
    if (creepChart) {
        creepChart.destroy();
    }
    
    creepChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Creeps',
                data: data,
                borderColor: '#00ff00',
                backgroundColor: 'rgba(0, 255, 0, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: '#00ff00', font: { family: 'Courier New' } }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#00ff00', font: { family: 'Courier New' } },
                    grid: { color: '#2a2a2a' }
                },
                y: {
                    ticks: { color: '#00ff00', font: { family: 'Courier New' }, stepSize: 1 },
                    grid: { color: '#2a2a2a' },
                    beginAtZero: true
                }
            }
        }
    });
}
