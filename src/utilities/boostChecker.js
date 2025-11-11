const database = require('../database');

module.exports = (client) => {
    // Check every minute for expired boosts
    setInterval(async () => {
        try {
            const servers = await database.getActiveServers();
            const now = new Date();

            for (const server of servers) {
                if (server.boostActivated && server.boostEndTime && new Date(server.boostEndTime) <= now) {
                    console.log(`⏰ Server ${server.serverId} boost has expired`);
                    
                    // Mark server as inactive
                    await database.updateServer(server.serverId, {
                        isActive: false,
                        isOpen: false
                    });

                    // Get config
                    const config = await database.getConfig();
                    
                    // Send notification to audit log
                    if (config.auditLogChannelId) {
                        const auditChannel = await client.channels.fetch(config.auditLogChannelId).catch(() => null);
                        if (auditChannel) {
                            await auditChannel.send({
                                embeds: [{
                                    title: '⏰ Server Boost Expired',
                                    description: `Server ${server.serverId} boost has expired and been automatically closed.`,
                                    color: 0xFEE75C,
                                    timestamp: new Date()
                                }]
                            });
                        }
                    }

                    // Get all purchases for this server to DM users
                    const purchases = await database.db.collection('purchases').find({ serverId: server.serverId }).toArray();
                    const uniqueUsers = [...new Set(purchases.map(p => p.userId))];

                    // Send detailed DM to each user
                    for (const userId of uniqueUsers) {
                        try {
                            const user = await client.users.fetch(userId).catch(() => null);
                            if (user) {
                                const userPurchases = purchases.filter(p => p.userId === userId);
                                const totalSlots = userPurchases.reduce((sum, p) => sum + p.slotCount, 0);
                                const totalPaid = userPurchases.reduce((sum, p) => sum + (p.price * p.slotCount), 0);

                                await user.send({
                                    embeds: [{
                                        title: '⏰ Server Boost Has Ended',
                                        description: `Thank you for purchasing slots on **Server ${server.serverId}**!\n\nThe boost period has now ended.`,
                                        color: 0x5865F2,
                                        fields: [
                                            {
                                                name: '📊 Your Purchase Summary',
                                                value: `**Slots Purchased:** ${totalSlots}\n**Total Paid:** IDR ${totalPaid.toLocaleString()}\n**Boost Duration:** ${server.boostDuration} hours`,
                                                inline: false
                                            },
                                            {
                                                name: '⏱️ Boost Period',
                                                value: `**Started:** <t:${Math.floor(new Date(server.boostStartTime).getTime() / 1000)}:F>\n**Ended:** <t:${Math.floor(new Date(server.boostEndTime).getTime() / 1000)}:F>`,
                                                inline: false
                                            },
                                            {
                                                name: '🎉 Thank You!',
                                                value: 'We hope you enjoyed the x8 boost experience!\n\nWatch for announcements about new servers opening soon!',
                                                inline: false
                                            }
                                        ],
                                        footer: {
                                            text: `Server ${server.serverId} | Boost Expired`
                                        },
                                        timestamp: new Date()
                                    }]
                                }).catch(() => {
                                    console.log(`Failed to DM user ${userId} about server ${server.serverId} expiration`);
                                });
                            }
                        } catch (dmError) {
                            console.error(`Error sending DM to user ${userId}:`, dmError);
                        }
                    }

                    // Delete server channel
                    if (server.channelId) {
                        const serverChannel = await client.channels.fetch(server.channelId).catch(() => null);
                        if (serverChannel) {
                            await serverChannel.delete().catch(console.error);
                        }
                    }

                    // Delete server role
                    if (server.roleId) {
                        const guild = client.guilds.cache.first();
                        if (guild) {
                            const role = await guild.roles.fetch(server.roleId).catch(() => null);
                            if (role) {
                                await role.delete().catch(console.error);
                            }
                        }
                    }

                    // Delete all tickets for this server
                    const tickets = await database.db.collection('tickets').find({ serverId: server.serverId }).toArray();
                    for (const ticket of tickets) {
                        if (ticket.channelId) {
                            const ticketChannel = await client.channels.fetch(ticket.channelId).catch(() => null);
                            if (ticketChannel) {
                                await ticketChannel.delete().catch(console.error);
                            }
                        }
                    }

                    // Mark tickets as closed in database
                    await database.db.collection('tickets').updateMany(
                        { serverId: server.serverId },
                        { $set: { status: 'closed', closedAt: new Date() } }
                    );
                }
            }
        } catch (error) {
            console.error('Error in boost checker:', error);
        }
    }, 60000); // Check every minute

    console.log('✅ Boost checker started');
};
