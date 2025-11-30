/**
 * WIKI - Console Command Reference
 * Quick reference guide for all available Screeps Engine commands
 */

const wikiData = {
    status: {
        title: '📊 Status & Information Commands',
        commands: [
            {
                name: 'help()',
                description: 'Display all available console commands with categories',
                syntax: 'help()',
                example: 'help()',
                output: 'Shows formatted list of all commands organized by category'
            },
            {
                name: 'status()',
                description: 'Comprehensive colony status report including energy, creeps, construction, defense, and alerts. Enhanced in v2.0 with detailed metrics.',
                syntax: 'status()',
                example: 'status()',
                output: 'Multi-section report showing:\n• Room info (RCL, energy, minerals)\n• Infrastructure (extensions, towers, storage)\n• Creep population by role\n• Construction progress\n• Defense status\n• Controller progress\n• Performance metrics\n• Active alerts'
            },
            {
                name: 'profile()',
                description: 'CPU profiling breakdown by module. Shows which parts of your code are consuming the most CPU.',
                syntax: 'profile()',
                example: 'profile()',
                output: 'Bar chart showing CPU usage per module with percentages',
                note: 'Requires profiling enabled in main.js'
            },
            {
                name: 'strategy()',
                description: 'View current strategic decisions including priorities and spawn queue from the last tick.',
                syntax: 'strategy()',
                example: 'strategy()',
                output: 'Shows:\n• Priority list (DEFENSE, ECONOMY, etc.)\n• Current spawn queue\n• Decision score'
            },
            {
                name: 'creeps()',
                description: 'Detailed list of all creeps with role, energy status, and time-to-live.',
                syntax: 'creeps()',
                example: 'creeps()',
                output: 'List of all creeps showing:\n• Name and working status\n• Role assignment\n• Energy: current/capacity\n• TTL remaining'
            },
            {
                name: 'Memory.engine',
                description: 'View raw engine memory state including version, stats, decisions, and learning data.',
                syntax: 'Memory.engine',
                example: 'Memory.engine.version\nMemory.engine.stats\nMemory.engine.decisions',
                output: 'Raw memory object with engine state'
            }
        ]
    },
    spawning: {
        title: '🚀 Spawning Commands',
        commands: [
            {
                name: 'SpawnHelper.quick()',
                description: 'Display quick spawn commands and current spawn status.',
                syntax: 'SpawnHelper.quick()',
                example: 'SpawnHelper.quick()',
                output: 'Shows available spawn shortcuts and spawn availability'
            },
            {
                name: 'SpawnHelper.h()',
                description: 'Spawn a harvester creep immediately.',
                syntax: 'SpawnHelper.h()',
                example: 'SpawnHelper.h()',
                output: 'Spawns harvester with optimal body for current RCL',
                note: 'Requires sufficient energy in spawn + extensions'
            },
            {
                name: 'SpawnHelper.u()',
                description: 'Spawn an upgrader creep immediately.',
                syntax: 'SpawnHelper.u()',
                example: 'SpawnHelper.u()',
                output: 'Spawns upgrader with optimal body for current RCL'
            },
            {
                name: 'SpawnHelper.b()',
                description: 'Spawn a builder creep immediately.',
                syntax: 'SpawnHelper.b()',
                example: 'SpawnHelper.b()',
                output: 'Spawns builder with optimal body for current RCL'
            },
            {
                name: 'SpawnHelper.auto()',
                description: 'Trigger automatic spawning logic based on current needs.',
                syntax: 'SpawnHelper.auto()',
                example: 'SpawnHelper.auto()',
                output: 'Analyzes colony needs and spawns appropriate creep'
            }
        ]
    },
    testing: {
        title: '🧪 Testing & Analytics Commands',
        commands: [
            {
                name: 'testEngine.quick()',
                description: 'Run quick test suite to verify engine functionality.',
                syntax: 'const testEngine = require("console.tests");\ntestEngine.quick();',
                example: 'const testEngine = require("console.tests");\ntestEngine.quick();',
                output: 'Test results for core engine modules',
                note: 'Only available in simulation environment'
            },
            {
                name: 'Analytics.analyze()',
                description: 'Force immediate analytics analysis and trend detection.',
                syntax: 'Analytics.analyze()',
                example: 'Analytics.analyze()',
                output: 'Runs analytics engine and displays detected patterns/anomalies'
            },
            {
                name: 'Analytics.recordDashboardTelemetry()',
                description: 'Manually trigger dashboard telemetry collection (normally runs every 100 ticks).',
                syntax: 'Analytics.recordDashboardTelemetry()',
                example: 'Analytics.recordDashboardTelemetry()',
                output: 'Updates Memory.dashboard with current room state',
                note: 'Used by Mission Control dashboard for real-time data'
            },
            {
                name: 'Memory.dashboard',
                description: 'View dashboard telemetry data collected for Mission Control.',
                syntax: 'Memory.dashboard.W13N57',
                example: 'Memory.dashboard.W13N57',
                output: 'Shows:\n• timestamp\n• RCL and progress\n• energy available/capacity\n• structure counts\n• construction site details'
            }
        ]
    },
    debug: {
        title: '🔧 Debug & Administration Commands',
        commands: [
            {
                name: 'debug()',
                description: 'Comprehensive simulation diagnostics showing room details, structures, creeps, hostiles, and memory state. Essential for troubleshooting.',
                syntax: 'debug()',
                example: 'debug()',
                output: 'Multi-section diagnostic report:\n• Controller status\n• Source locations and energy\n• All structures by type\n• Construction sites\n• Hostile creeps\n• Creep counts by role\n• Memory engine state'
            },
            {
                name: 'planStructures()',
                description: 'Force structure planning to run immediately, bypassing normal 100-tick throttle. Shows detailed planning diagnostics.',
                syntax: 'planStructures()',
                example: 'planStructures()',
                output: 'For each room:\n• Current structure counts\n• Active construction sites\n• Target counts for RCL\n• Number of new sites placed\n• Final construction summary'
            },
            {
                name: 'kill(name)',
                description: 'Suicide a specific creep by name. Useful for removing stuck or problematic creeps.',
                syntax: 'kill("creepName")',
                example: 'kill("harvester_123_456")',
                output: 'Confirmation message'
            },
            {
                name: 'killAll(role)',
                description: 'Suicide all creeps of a specific role. Useful for resetting a role or clearing old creeps.',
                syntax: 'killAll("role")',
                example: 'killAll("defender")',
                output: 'Number of creeps killed'
            },
            {
                name: 'clear()',
                description: 'Clear console output with newlines.',
                syntax: 'clear()',
                example: 'clear()',
                output: 'Scrolls console with blank lines'
            }
        ]
    },
    memory: {
        title: '💾 Memory Management',
        commands: [
            {
                name: 'Memory.engine.version',
                description: 'View current engine version.',
                syntax: 'Memory.engine.version',
                example: 'Memory.engine.version',
                output: 'Current version string (e.g., "2.0.2")'
            },
            {
                name: 'Memory.engine.stats',
                description: 'View historical statistics collected by analytics.',
                syntax: 'Memory.engine.stats',
                example: 'Memory.engine.stats.economy.totalEnergy',
                output: 'Nested object with metrics by category:\n• economy: totalEnergy, etc.\n• creeps: counts by role\n• performance: CPU, bucket\nEach metric has array of {tick, value} entries'
            },
            {
                name: 'Memory.engine.decisions',
                description: 'View strategic decision history.',
                syntax: 'Memory.engine.decisions',
                example: 'Memory.engine.decisions[Memory.engine.decisions.length - 1]',
                output: 'Array of decision objects with:\n• tick\n• strategy (priorities, spawning)\n• score'
            },
            {
                name: 'MemoryManager.getStat()',
                description: 'Retrieve specific historical statistic.',
                syntax: 'MemoryManager.getStat(category, metric, limit)',
                example: 'MemoryManager.getStat("economy", "totalEnergy", 100)',
                output: 'Array of last N stat entries',
                note: 'Requires memory.manager module'
            },
            {
                name: 'MemoryManager.cleanDeadCreeps()',
                description: 'Manually trigger cleanup of dead creep memory.',
                syntax: 'MemoryManager.cleanDeadCreeps()',
                example: 'MemoryManager.cleanDeadCreeps()',
                output: 'Removes memory for creeps that no longer exist',
                note: 'Runs automatically every tick, manual trigger rarely needed'
            }
        ]
    }
};

class Wiki {
    static init() {
        this.renderCategory('status');
        this.setupEventListeners();
    }

    static setupEventListeners() {
        // Category switching
        document.querySelectorAll('.wiki-category').forEach(cat => {
            cat.addEventListener('click', (e) => {
                document.querySelectorAll('.wiki-category').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                this.renderCategory(e.target.dataset.category);
            });
        });
    }

    static renderCategory(category) {
        const data = wikiData[category];
        if (!data) return;

        const content = document.getElementById('wiki-content');
        
        let html = `<h2>${data.title}</h2>`;
        
        data.commands.forEach(cmd => {
            html += `
                <div class="wiki-command">
                    <div class="wiki-command-header">
                        <div class="wiki-command-name">${cmd.name}</div>
                        <button class="wiki-command-execute" onclick="Wiki.executeCommand('${cmd.example.split('\\n')[0]}')">
                            ▶ Execute
                        </button>
                    </div>
                    <div class="wiki-command-description">${cmd.description}</div>
                    <div class="wiki-command-syntax">
                        <strong>Syntax:</strong><br>
                        <code>${cmd.syntax.replace(/\n/g, '<br>')}</code>
                    </div>
                    ${cmd.output ? `
                        <div class="wiki-command-example">
                            <div class="wiki-command-example-title">Output:</div>
                            <div class="wiki-command-example-code">${cmd.output.replace(/\n/g, '<br>')}</div>
                        </div>
                    ` : ''}
                    ${cmd.note ? `
                        <div class="wiki-note">
                            <div class="wiki-note-title">📌 Note:</div>
                            ${cmd.note}
                        </div>
                    ` : ''}
                </div>
            `;
        });

        content.innerHTML = html;
    }

    static executeCommand(command) {
        // Send command via websocket
        if (window.WebSocket && window.WebSocket.sendCommand) {
            window.WebSocket.sendCommand(command);
        } else {
            console.error('WebSocket not available');
        }
    }
}

// Export for use in app.js
window.Wiki = Wiki;
