const { MongoClient, ServerApiVersion } = require('mongodb');
const config = require('./config');

class Database {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async connect() {
        try {
            if (!config.mongoUri) {
                throw new Error('MONGO_DB environment variable is not set!');
            }

            console.log('🔄 Connecting to MongoDB...');
            
            // Create client with Stable API version
            this.client = new MongoClient(config.mongoUri, {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                }
            });
            
            await this.client.connect();
            
            // Test the connection
            await this.client.db('admin').command({ ping: 1 });
            
            this.db = this.client.db('qwerty_bot');
            console.log('✅ Connected to MongoDB successfully');
            
            // Create indexes
            await this.createIndexes();
            
            return true;
        } catch (error) {
            console.error('❌ MongoDB connection error:', error.message);
            console.error('❌ Full error:', error);
            console.error('⚠️ Please check your MONGO_DB connection string in .env file');
            this.db = null;
            this.client = null;
            return false;
        }
    }

    async createIndexes() {
        try {
            await this.db.collection('servers').createIndex({ serverId: 1 });
            await this.db.collection('servers').createIndex({ isActive: 1 });
            await this.db.collection('tickets').createIndex({ userId: 1 });
            await this.db.collection('tickets').createIndex({ serverId: 1 });
            await this.db.collection('purchases').createIndex({ userId: 1 });
            console.log('✅ Database indexes created');
        } catch (error) {
            console.error('⚠️ Error creating indexes:', error);
        }
    }

    // Config operations
    async getConfig() {
        if (!this.db) {
            console.error('❌ Database not connected!');
            return {};
        }
        return await this.db.collection('config').findOne({ _id: 'bot_config' }) || {};
    }

    async updateConfig(updates) {
        if (!this.db) {
            console.error('❌ Database not connected!');
            return null;
        }
        return await this.db.collection('config').updateOne(
            { _id: 'bot_config' },
            { $set: updates },
            { upsert: true }
        );
    }

    // Server operations
    async createServer(data) {
        if (!this.db) {
            console.error('❌ Database not connected!');
            return null;
        }
        const serverCount = await this.db.collection('servers').countDocuments({ isActive: true });
        const serverId = serverCount + 1;
        
        const server = {
            serverId,
            boostDuration: data.boostDuration,
            price: data.price,
            isOpen: true,
            boostActivated: false,
            boostStartTime: null,
            boostEndTime: null,
            slots: [],
            maxSlots: config.maxSlotsPerServer,
            roleId: null,
            channelId: null,
            createdAt: new Date(),
            createdBy: data.createdBy,
            isActive: true
        };

        await this.db.collection('servers').insertOne(server);
        return server;
    }

    async getServer(serverId) {
        return await this.db.collection('servers').findOne({ serverId, isActive: true });
    }

    async getActiveServers() {
        if (!this.db) {
            console.error('❌ Database not connected! Cannot get active servers.');
            return [];
        }
        return await this.db.collection('servers')
            .find({ isActive: true })
            .sort({ serverId: 1 })
            .toArray();
    }

    async updateServer(serverId, updates) {
        return await this.db.collection('servers').updateOne(
            { serverId },
            { $set: updates }
        );
    }

    async activateBoost(serverId) {
        const server = await this.getServer(serverId);
        if (!server) return null;

        const boostStartTime = new Date();
        const boostEndTime = new Date(boostStartTime.getTime() + server.boostDuration * 60 * 60 * 1000);

        await this.updateServer(serverId, {
            boostActivated: true,
            boostStartTime,
            boostEndTime
        });

        return { boostStartTime, boostEndTime };
    }

    async addSlotToServer(serverId, userId, robloxUsernames) {
        return await this.db.collection('servers').updateOne(
            { serverId },
            { 
                $push: { 
                    slots: {
                        userId,
                        robloxUsernames,
                        addedAt: new Date()
                    }
                }
            }
        );
    }

    async getServerSlotCount(serverId) {
        const server = await this.getServer(serverId);
        if (!server || !server.slots) return 0;
        
        // Count total usernames across all slot purchases
        return server.slots.reduce((total, slot) => {
            return total + (slot.robloxUsernames ? slot.robloxUsernames.length : 0);
        }, 0);
    }

    // Ticket operations
    async createTicket(data) {
        const ticket = {
            ticketId: Date.now().toString(),
            userId: data.userId,
            serverId: data.serverId,
            slotCount: data.slotCount,
            robloxUsernames: data.robloxUsernames,
            channelId: data.channelId,
            status: 'pending', // pending, approved, declined, closed
            createdAt: new Date(),
            approvedBy: null,
            approvedAt: null
        };

        await this.db.collection('tickets').insertOne(ticket);
        return ticket;
    }

    async updateTicket(ticketId, updates) {
        return await this.db.collection('tickets').updateOne(
            { ticketId },
            { $set: updates }
        );
    }

    async getTicket(ticketId) {
        return await this.db.collection('tickets').findOne({ ticketId });
    }

    async getTicketByChannel(channelId) {
        return await this.db.collection('tickets').findOne({ channelId });
    }

    // Purchase operations
    async createPurchase(data) {
        const purchase = {
            purchaseId: Date.now().toString(),
            userId: data.userId,
            serverId: data.serverId,
            ticketId: data.ticketId,
            slotCount: data.slotCount,
            price: data.price,
            robloxUsernames: data.robloxUsernames,
            createdAt: new Date()
        };

        await this.db.collection('purchases').insertOne(purchase);
        return purchase;
    }

    async getUserPurchases(userId) {
        return await this.db.collection('purchases')
            .find({ userId })
            .sort({ createdAt: -1 })
            .toArray();
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            console.log('🔌 Disconnected from MongoDB');
        }
    }
}

module.exports = new Database();
