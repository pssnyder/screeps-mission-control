/**
 * GAUGE RENDERING
 * Canvas-based circular gauges for telemetry
 */

class Gauge {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.value = 0;
        this.maxValue = options.maxValue || 100;
        this.unit = options.unit || '';
        this.color = options.color || '#00d4ff';
        this.warningThreshold = options.warningThreshold || 0.7;
        this.dangerThreshold = options.dangerThreshold || 0.9;
        
        this.render();
    }
    
    setValue(value) {
        this.value = Math.min(value, this.maxValue);
        this.render();
    }
    
    render() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 70;
        const percentage = this.value / this.maxValue;
        
        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Determine color based on thresholds
        let fillColor = this.color;
        if (percentage >= this.dangerThreshold) {
            fillColor = '#ff4444';
        } else if (percentage >= this.warningThreshold) {
            fillColor = '#ffc700';
        }
        
        // Draw background circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#1a1f2e';
        ctx.lineWidth = 15;
        ctx.stroke();
        
        // Draw progress arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * percentage));
        ctx.strokeStyle = fillColor;
        ctx.lineWidth = 15;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Draw inner circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 20, 0, Math.PI * 2);
        ctx.fillStyle = '#131824';
        ctx.fill();
        
        // Draw center dot
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
        
        // Draw percentage text
        ctx.font = 'bold 28px Consolas';
        ctx.fillStyle = '#e0e6ed';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(percentage * 100) + '%', centerX, centerY);
    }
}

// Initialize gauges
let cpuGauge, bucketGauge, energyGauge;

document.addEventListener('DOMContentLoaded', () => {
    cpuGauge = new Gauge('gauge-cpu', {
        maxValue: 20,
        color: '#00d4ff',
        warningThreshold: 0.7,
        dangerThreshold: 0.9
    });
    
    bucketGauge = new Gauge('gauge-bucket', {
        maxValue: 10000,
        color: '#00ff88',
        warningThreshold: 0.3, // Warning if bucket < 3000 (inverted)
        dangerThreshold: 0.1   // Danger if bucket < 1000 (inverted)
    });
    
    energyGauge = new Gauge('gauge-energy', {
        maxValue: 1000, // Will be updated dynamically
        color: '#ffc700',
        warningThreshold: 0.3,
        dangerThreshold: 0.1
    });
});

// Export for use in app.js
window.Gauges = {
    updateCPU: (value, max) => {
        cpuGauge.maxValue = max || 20;
        cpuGauge.setValue(value);
        document.getElementById('cpu-value').textContent = value.toFixed(2);
    },
    updateBucket: (value) => {
        bucketGauge.setValue(value);
        document.getElementById('bucket-value').textContent = value;
    },
    updateEnergy: (value, max) => {
        energyGauge.maxValue = max || 1000;
        energyGauge.setValue(value);
        document.getElementById('energy-value').textContent = `${value}/${max}`;
    }
};
