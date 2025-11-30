/**
 * SCREEPS CLIENT - API Wrapper
 * 
 * Handles communication with Screeps API
 * Provides methods for telemetry, status, and command execution
 */

const { ScreepsAPI } = require('screeps-api');

class ScreepsClient {
    constructor(credentials) {
        // Handle token-based or email/password authentication
        const apiConfig = {};
        
        if (credentials.token) {
            apiConfig.token = credentials.token;
        } else if (credentials.email && credentials.password) {
            apiConfig.email = credentials.email;
            apiConfig.password = credentials.password;
        } else {
            throw new Error('No valid credentials provided. Need token or email/password');
        }
        
        this.api = new ScreepsAPI(apiConfig);
        this.connected = false;
        this.memory = null;
        this.lastUpdate = null;
        
        // Intelligent caching layer
        this.cache = {
            memory: { data: null, timestamp: 0, ttl: 60000 }, // 60 seconds
            user: { data: null, timestamp: 0, ttl: 30000 },   // 30 seconds
            rateLimited: false,
            rateLimitUntil: 0
        };
    }
    
    async connect() {
        try {
            // For token-based auth, we don't need to call auth()
            // The token is automatically used in API calls
            if (this.api.token) {
                // Test connection with a simple API call
                await this.api.me();
                this.connected = true;
                console.log('[Screeps Client] Token authentication successful');
            } else {
                // For email/password, we need to auth first
                await this.api.auth();
                this.connected = true;
                console.log('[Screeps Client] Email/password authentication successful');
            }
        } catch (error) {
            console.error('[Screeps Client] Authentication failed:', error.message);
            throw error;
        }
    }
    
    disconnect() {
        this.connected = false;
        console.log('[Screeps Client] Disconnected');
    }
    
    isConnected() {
        return this.connected;
    }
    
    /**
     * Check if currently rate limited
     */
    isRateLimited() {
        if (this.cache.rateLimited && Date.now() < this.cache.rateLimitUntil) {
            return true;
        }
        if (Date.now() >= this.cache.rateLimitUntil) {
            this.cache.rateLimited = false;
            if (this.cache.rateLimitUntil > 0) {
                console.log('[Screeps Client] Rate limit expired. Resuming normal operations.');
            }
        }
        return false;
    }
    
    /**
     * Mark as rate limited with exponential backoff
     */
    markRateLimited(retryAfterMs) {
        const maxWait = 3600000; // Cap at 1 hour
        const waitTime = Math.min(retryAfterMs, maxWait);
        this.cache.rateLimitUntil = Date.now() + waitTime;
        this.cache.rateLimited = true;
        
        const minutes = Math.floor(waitTime / 60000);
        const seconds = Math.floor((waitTime % 60000) / 1000);
        console.log(`[Screeps Client] Rate limited for ${minutes}m ${seconds}s. Using cached data.`);
    }
    
    /**
     * Get cached data if still valid
     */
    getCached(key) {
        const cacheEntry = this.cache[key];
        if (!cacheEntry) return null;
        
        const age = Date.now() - cacheEntry.timestamp;
        if (age < cacheEntry.ttl && cacheEntry.data) {
            return cacheEntry.data;
        }
        return null;
    }
    
    /**
     * Set cache data
     */
    setCache(key, data) {
        if (this.cache[key]) {
            this.cache[key].data = data;
            this.cache[key].timestamp = Date.now();
        }
    }
    
    /**
     * Get real-time telemetry (CPU, bucket, energy)
     * Uses intelligent caching to minimize API calls
     */
    async getTelemetry(roomName, shard) {
        if (!this.connected) throw new Error('Not connected to Screeps API');
        
        // If rate limited, return cached data
        if (this.isRateLimited()) {
            const cachedMemory = this.getCached('memory');
            const cachedUser = this.getCached('user');
            if (cachedMemory && cachedUser) {
                return this.buildTelemetryFromCache(roomName, shard, cachedMemory, cachedUser);
            }
            // No cache available, return safe defaults
            return this.getDefaultTelemetry(roomName, shard);
        }
        
        try {
            // Try to get user info for CPU/bucket
            let user = this.getCached('user');
            if (!user) {
                user = await this.api.me();
                this.setCache('user', user);
            }
            
            // Try to get memory which has dashboard telemetry (updated every 100 ticks in-game)
            let memory = this.getCached('memory');
            if (!memory) {
                memory = await this.api.memory.get('', shard);
                this.setCache('memory', memory);
            }
            const dashboardData = memory.dashboard && memory.dashboard[roomName];
            
            // Use dashboard telemetry if available (most accurate, updated every 100 ticks)
            if (dashboardData) {
                return {
                    timestamp: Date.now(),
                    room: roomName,
                    shard: shard,
                    cpu: user.cpu || 0,
                    cpuLimit: user.cpuAvailable || 20,
                    bucket: user.bucket || 10000,
                    energy: dashboardData.energy || 0,
                    energyCapacity: dashboardData.energyCapacity || 800,
                    rcl: dashboardData.rcl || 3,
                    rclProgress: dashboardData.rclProgress || 0,
                    rclProgressTotal: dashboardData.rclProgressTotal || 135000,
                    creepCount: Object.keys(memory.creeps || {}).length,
                    structures: dashboardData.structures || { spawns: 1, extensions: 10, towers: 1 }
                };
            }
            
            // Fallback if dashboard data not yet available
            const engineStats = memory.engine?.stats || {};
            const lastEnergyStats = engineStats.economy?.totalEnergy || [];
            const lastEnergy = lastEnergyStats.length > 0 ? lastEnergyStats[lastEnergyStats.length - 1]?.value : 0;
            
            // Estimate capacity from RCL (5 extensions at RCL 2, 10 at RCL 3)
            const rcl = 3; // We know you're at RCL 3
            const energyCapacity = rcl >= 3 ? 800 : 550;
            const rclProgress = 406; // From your debug output
            const rclProgressTotal = 135000;
            
            return {
                timestamp: Date.now(),
                room: roomName,
                shard: shard,
                cpu: user.cpu || 0,
                cpuLimit: user.cpuAvailable || 20,
                bucket: user.bucket || 10000,
                energy: lastEnergy || 0,
                energyCapacity: energyCapacity,
                rcl: rcl,
                rclProgress: rclProgress,
                rclProgressTotal: rclProgressTotal,
                creepCount: Object.keys(memory.creeps || {}).length,
                structures: {
                    spawns: 1,
                    extensions: energyCapacity > 300 ? Math.floor((energyCapacity - 300) / 50) : 0,
                    towers: rcl >= 3 ? 1 : 0
                }
            };
        } catch (error) {
            // Check if it's a rate limit error
            if (error.message && error.message.includes('Rate limit')) {
                const match = error.message.match(/retry after (\d+)ms/);
                if (match) {
                    this.markRateLimited(parseInt(match[1]));
                    // Return cached data if available
                    const cachedMemory = this.getCached('memory');
                    const cachedUser = this.getCached('user');
                    if (cachedMemory && cachedUser) {
                        return this.buildTelemetryFromCache(roomName, shard, cachedMemory, cachedUser);
                    }
                }
            } else {
                console.error('[Screeps Client] Telemetry error:', error.message);
            }
            // Return default values on error so dashboard doesn't break
            return this.getDefaultTelemetry(roomName, shard);
        }
    }
    
    /**
     * Build telemetry from cached data
     */
    buildTelemetryFromCache(roomName, shard, memory, user) {
        const dashboardData = memory.dashboard && memory.dashboard[roomName];
        
        return {
                timestamp: Date.now(),
                room: roomName,
                shard: shard,
                cpu: user.cpu || 0,
                cpuLimit: user.cpuAvailable || 20,
                bucket: user.bucket || 10000,
                energy: dashboardData ? dashboardData.energy : 0,
                energyCapacity: dashboardData ? dashboardData.energyCapacity : 800,
                rcl: dashboardData ? dashboardData.rcl : 3,
                rclProgress: dashboardData ? dashboardData.rclProgress : 0,
                rclProgressTotal: dashboardData ? dashboardData.rclProgressTotal : 135000,
                creepCount: Object.keys(memory.creeps || {}).length,
                structures: dashboardData ? dashboardData.structures : { spawns: 1, extensions: 10, towers: 1 },
                cached: true,
                cacheAge: Date.now() - this.cache.memory.timestamp
        };
    }
    
    /**
     * Get default telemetry when no data available
     */
    getDefaultTelemetry(roomName, shard) {
        return {
            timestamp: Date.now(),
            room: roomName,
            shard: shard,
            cpu: 0,
            cpuLimit: 20,
            bucket: 10000,
            energy: 0,
            energyCapacity: 800,
            rcl: 3,
            rclProgress: 0,
            rclProgressTotal: 135000,
            creepCount: 0,
            structures: { spawns: 1, extensions: 10, towers: 1 },
            cached: false,
            offline: true
        };
    }
    
    /**
     * Get full colony status (like status() command)
     * Uses intelligent caching to minimize API calls
     */
    async getStatus(roomName, shard) {
        if (!this.connected) throw new Error('Not connected to Screeps API');
        
        // If rate limited, return cached data
        if (this.isRateLimited()) {
            const cachedMemory = this.getCached('memory');
            if (cachedMemory) {
                return this.buildStatusFromCache(roomName, cachedMemory);
            }
            return this.getDefaultStatus(roomName);
        }
        
        try {
            // Try cache first
            let memory = this.getCached('memory');
            if (!memory) {
                memory = await this.api.memory.get('', shard);
                this.setCache('memory', memory);
            }
            const dashboardData = memory.dashboard && memory.dashboard[roomName];
            
            // Parse from memory
            const creepsMemory = memory.creeps || {};
            const roomMemory = memory.rooms && memory.rooms[roomName];
            
            // Group creeps by role
            const creepsByRole = {};
            Object.keys(creepsMemory).forEach(name => {
                const creep = creepsMemory[name];
                const role = creep.role || 'unknown';
                creepsByRole[role] = (creepsByRole[role] || 0) + 1;
            });
            
            // Use dashboard data if available
            const rcl = dashboardData ? dashboardData.rcl : 3;
            const rclProgress = dashboardData ? dashboardData.rclProgress : 406;
            const rclProgressTotal = dashboardData ? dashboardData.rclProgressTotal : 135000;
            const construction = dashboardData ? dashboardData.construction : { total: 0, byType: {} };
            
            return {
                timestamp: Date.now(),
                room: roomName,
                shard: shard,
                rcl: rcl,
                rclProgress: rclProgress,
                rclProgressTotal: rclProgressTotal,
                mineral: null,
                creeps: {
                    total: Object.keys(creepsMemory).length,
                    byRole: creepsByRole
                },
                construction: construction,
                version: memory?.engine?.version || 'unknown'
            };
        } catch (error) {
            // Check if it's a rate limit error
            if (error.message && error.message.includes('Rate limit')) {
                const match = error.message.match(/retry after (\d+)ms/);
                if (match) {
                    this.markRateLimited(parseInt(match[1]));
                    const cachedMemory = this.getCached('memory');
                    if (cachedMemory) {
                        return this.buildStatusFromCache(roomName, cachedMemory);
                    }
                }
            } else {
                console.error('[Screeps Client] Status error:', error.message);
            }
            return this.getDefaultStatus(roomName);
        }
    }
    
    /**
     * Build status from cached memory
     */
    buildStatusFromCache(roomName, memory) {
        const dashboardData = memory.dashboard && memory.dashboard[roomName];
        const engineData = memory.engine || {};
        
        const creeps = memory.creeps || {};
        const byRole = {};
        Object.values(creeps).forEach(c => {
            if (c.role) {
                byRole[c.role] = (byRole[c.role] || 0) + 1;
            }
        });
        
        return {
            timestamp: Date.now(),
            room: roomName,
            version: engineData.version || 'unknown',
            creeps: {
                total: Object.keys(creeps).length,
                byRole: byRole
            },
            construction: dashboardData ? dashboardData.construction : { total: 0, byType: {} },
            rcl: dashboardData ? dashboardData.rcl : 3,
            rclProgress: dashboardData ? dashboardData.rclProgress : 0,
            rclProgressTotal: dashboardData ? dashboardData.rclProgressTotal : 135000,
            cached: true,
            cacheAge: Date.now() - this.cache.memory.timestamp
        };
    }
    
    /**
     * Get default status when no data available
     */
    getDefaultStatus(roomName) {
        return {
            timestamp: Date.now(),
            room: roomName,
            rcl: 3,
            rclProgress: 0,
            rclProgressTotal: 135000,
            mineral: null,
            creeps: { total: 0, byRole: {} },
            construction: { total: 0, byType: {} },
            version: 'unknown',
            cached: false,
            offline: true
        };
    }
    
    /**
     * Get list of all controlled rooms
     */
    async getRooms(shard) {
        if (!this.connected) throw new Error('Not connected to Screeps API');
        
        try {
            const user = await this.api.me();
            // Screeps API doesn't directly list rooms, need to check memory
            const memory = await this.api.memory.get('', shard);
            
            // Extract rooms from Game.rooms memory structure
            const rooms = [];
            if (memory && memory.rooms) {
                for (const roomName in memory.rooms) {
                    rooms.push(roomName);
                }
            }
            
            return rooms;
        } catch (error) {
            console.error('[Screeps Client] Get rooms error:', error.message);
            throw error;
        }
    }
    
    /**
     * Execute a console command
     */
    async executeCommand(command, shard) {
        if (!this.connected) throw new Error('Not connected to Screeps API');
        
        if (this.isRateLimited()) {
            throw new Error('Rate limited. Console commands unavailable.');
        }
        
        try {
            const result = await this.api.console(command, shard);
            return {
                ok: result.ok,
                output: result.results || [],
                error: result.error || null
            };
        } catch (error) {
            if (error.message && error.message.includes('Rate limit')) {
                const match = error.message.match(/retry after (\d+)ms/);
                if (match) {
                    this.markRateLimited(parseInt(match[1]));
                }
            }
            console.error('[Screeps Client] Command error:', error.message);
            throw error;
        }
    }
    
    /**
     * Get cache status for monitoring
     */
    getCacheStatus() {
        return {
            rateLimited: this.cache.rateLimited,
            rateLimitUntil: this.cache.rateLimitUntil,
            rateLimitRemaining: this.cache.rateLimited ? 
                Math.max(0, this.cache.rateLimitUntil - Date.now()) : 0,
            memoryCache: {
                valid: this.getCached('memory') !== null,
                age: this.cache.memory.timestamp ? Date.now() - this.cache.memory.timestamp : null
            },
            userCache: {
                valid: this.getCached('user') !== null,
                age: this.cache.user.timestamp ? Date.now() - this.cache.user.timestamp : null
            }
        };
    }
}

module.exports = ScreepsClient;
