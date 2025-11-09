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

                    // Optionally delete the server channel
                    if (server.channelId) {
                        const serverChannel = await client.channels.fetch(server.channelId).catch(() => null);
                        if (serverChannel) {
                            await serverChannel.send({
                                embeds: [{
                                    title: '⏰ Boost Period Ended',
                                    description: 'This server\'s boost period has ended. Thank you for playing!',
                                    color: 0xFEE75C
                                }]
                            });
                            
                            // Delete channel after 5 minutes
                            setTimeout(async () => {
                                await serverChannel.delete().catch(console.error);
                            }, 5 * 60 * 1000);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in boost checker:', error);
        }
    }, 60000); // Check every minute

    console.log('✅ Boost checker started');
};
