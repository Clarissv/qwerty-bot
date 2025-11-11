const config = require('../config');

module.exports = {
    // Server info embed for member panel
    serverInfoEmbed(server, slotCount) {
        const fields = [
            {
                name: '🖥️ Server Status',
                value: server.isOpen ? '✅ Open' : '❌ Closed',
                inline: true
            },
            {
                name: '💰 Price',
                value: `IDR ${server.price.toLocaleString()}`,
                inline: true
            },
            {
                name: '⚡ Boost Status',
                value: server.boostActivated ? '✅ Active' : '⏳ Pending',
                inline: true
            },
            {
                name: '👥 Slots',
                value: `${slotCount}/${config.maxSlotsPerServer}`,
                inline: true
            },
            {
                name: '⏱️ Duration',
                value: `${server.boostDuration} hours`,
                inline: true
            }
        ];

        if (server.boostActivated && server.boostEndTime) {
            const endTime = new Date(server.boostEndTime);
            const now = new Date();
            const timeRemaining = Math.floor((endTime - now) / 1000 / 60 / 60);
            
            if (timeRemaining > 0) {
                fields.push({
                    name: '⏰ Time Remaining',
                    value: `${timeRemaining.toFixed(1)} hours`,
                    inline: true
                });
            }
            
            fields.push({
                name: timeRemaining > 0 ? '🕐 Ends At' : '⏰ Ended At',
                value: `<t:${Math.floor(endTime.getTime() / 1000)}:F>`,
                inline: true
            });
        }

        // Add member list
        if (server.slots && server.slots.length > 0) {
            let membersList = '';
            let usernameCount = 0;
            
            server.slots.forEach((slot) => {
                const slotCount = slot.robloxUsernames ? slot.robloxUsernames.length : 0;
                membersList += `<@${slot.userId}> (${slotCount} slot${slotCount !== 1 ? 's' : ''})\n`;
                usernameCount += slotCount;
            });
            
            fields.push({
                name: `👤 Members (${usernameCount} total slots)`,
                value: membersList || 'No members yet',
                inline: false
            });
        }

        return {
            title: `🖥️ Server ${server.serverId}`,
            color: server.boostActivated ? config.successColor : config.warningColor,
            fields,
            timestamp: new Date()
        };
    },

    // Ticket confirmation embed
    ticketConfirmEmbed(server, robloxUsernames) {
        return {
            title: '🎫 Purchase Confirmation',
            description: 'Please confirm your purchase details below:',
            color: config.infoColor,
            fields: [
                {
                    name: '🖥️ Server',
                    value: `Server ${server.serverId}`,
                    inline: true
                },
                {
                    name: '💰 Price per Slot',
                    value: `IDR ${server.price.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '👥 Slots',
                    value: robloxUsernames.length.toString(),
                    inline: true
                },
                {
                    name: '💵 Total Price',
                    value: `IDR ${(server.price * robloxUsernames.length).toLocaleString()}`,
                    inline: false
                },
                {
                    name: '📝 Roblox Usernames',
                    value: robloxUsernames.map((name, i) => `${i + 1}. ${name}`).join('\n'),
                    inline: false
                }
            ],
            footer: {
                text: 'Click Confirm to create your ticket'
            }
        };
    },

    // Payment embed
    paymentEmbed(qrisUrl) {
        return {
            title: '💳 Payment Information',
            description: 'Please scan the QR code below to complete your payment.',
            color: config.infoColor,
            image: {
                url: qrisUrl
            },
            footer: {
                text: 'After payment, please wait for staff verification'
            }
        };
    },

    // Approval embed for staff
    approvalEmbed(user, server, ticket) {
        return {
            title: '✅ Pending Approval',
            description: `New ticket from ${user.tag}`,
            color: config.warningColor,
            fields: [
                {
                    name: '👤 User',
                    value: `<@${user.id}>`,
                    inline: true
                },
                {
                    name: '🖥️ Server',
                    value: `Server ${server.serverId}`,
                    inline: true
                },
                {
                    name: '👥 Slots',
                    value: ticket.slotCount.toString(),
                    inline: true
                },
                {
                    name: '💰 Total Price',
                    value: `IDR ${server.price.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '📝 Roblox Usernames',
                    value: ticket.robloxUsernames.map((name, i) => `${i + 1}. ${name}`).join('\n'),
                    inline: false
                }
            ],
            timestamp: new Date()
        };
    },

    // Success embed
    successEmbed(title, description) {
        return {
            title: `✅ ${title}`,
            description,
            color: config.successColor,
            timestamp: new Date()
        };
    },

    // Error embed
    errorEmbed(title, description) {
        return {
            title: `❌ ${title}`,
            description,
            color: config.errorColor,
            timestamp: new Date()
        };
    },

    // Info embed
    infoEmbed(title, description) {
        return {
            title: `ℹ️ ${title}`,
            description,
            color: config.infoColor,
            timestamp: new Date()
        };
    }
};
