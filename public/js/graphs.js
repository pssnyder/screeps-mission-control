/**
 * GRAPHS - Chart.js Integration
 * Historical performance graphs
 */

let cpuChart, energyChart;
const maxDataPoints = 60; // Keep last 60 data points

// Initialize charts
document.addEventListener('DOMContentLoaded', () => {
    // CPU Chart
    const cpuCtx = document.getElementById('chart-cpu').getContext('2d');
    cpuChart = new Chart(cpuCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'CPU Usage',
                data: [],
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#e0e6ed'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 20,
                    grid: {
                        color: '#2a3444'
                    },
                    ticks: {
                        color: '#8b92a0'
                    }
                },
                x: {
                    grid: {
                        color: '#2a3444'
                    },
                    ticks: {
                        color: '#8b92a0',
                        maxTicksLimit: 10
                    }
                }
            }
        }
    });
    
    // Energy Chart
    const energyCtx = document.getElementById('chart-energy').getContext('2d');
    energyChart = new Chart(energyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Energy',
                data: [],
                borderColor: '#ffc700',
                backgroundColor: 'rgba(255, 199, 0, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#e0e6ed'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#2a3444'
                    },
                    ticks: {
                        color: '#8b92a0'
                    }
                },
                x: {
                    grid: {
                        color: '#2a3444'
                    },
                    ticks: {
                        color: '#8b92a0',
                        maxTicksLimit: 10
                    }
                }
            }
        }
    });
});

// Export for use in app.js
window.Graphs = {
    addCPUData: (value) => {
        const now = new Date().toLocaleTimeString();
        
        cpuChart.data.labels.push(now);
        cpuChart.data.datasets[0].data.push(value);
        
        // Keep only last N points
        if (cpuChart.data.labels.length > maxDataPoints) {
            cpuChart.data.labels.shift();
            cpuChart.data.datasets[0].data.shift();
        }
        
        cpuChart.update('none'); // Update without animation for performance
    },
    
    addEnergyData: (value) => {
        const now = new Date().toLocaleTimeString();
        
        energyChart.data.labels.push(now);
        energyChart.data.datasets[0].data.push(value);
        
        // Keep only last N points
        if (energyChart.data.labels.length > maxDataPoints) {
            energyChart.data.labels.shift();
            energyChart.data.datasets[0].data.shift();
        }
        
        energyChart.update('none');
    }
};
