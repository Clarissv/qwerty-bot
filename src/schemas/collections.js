// Schema definitions for database collections

module.exports = {
    // Config schema
    config: {
        _id: 'bot_config',
        chatroomCategoryId: String,
        ticketCategoryId: String,
        staffRoleId: String,
        approvalChannelId: String,
        auditLogChannelId: String,
        qrisUrl: String
    },

    // Server schema
    server: {
        serverId: Number,
        boostDuration: Number,
        price: Number,
        isOpen: Boolean,
        boostActivated: Boolean,
        boostStartTime: Date,
        boostEndTime: Date,
        slots: [{
            userId: String,
            robloxUsernames: [String],
            addedAt: Date
        }],
        maxSlots: Number,
        roleId: String,
        channelId: String,
        createdAt: Date,
        createdBy: String,
        isActive: Boolean
    },

    // Ticket schema
    ticket: {
        ticketId: String,
        userId: String,
        serverId: Number,
        slotCount: Number,
        robloxUsernames: [String],
        channelId: String,
        status: String, // pending, approved, declined, closed
        createdAt: Date,
        approvedBy: String,
        approvedAt: Date
    },

    // Purchase schema
    purchase: {
        purchaseId: String,
        userId: String,
        serverId: Number,
        ticketId: String,
        slotCount: Number,
        price: Number,
        robloxUsernames: [String],
        createdAt: Date
    }
};
