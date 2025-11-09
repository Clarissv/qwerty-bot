const database = require('../../database');
const embedBuilder = require('../../utilities/embedBuilder');
const panelManager = require('../../utilities/panelManager');

module.exports = {
    customId: 'activateBoost',

    async execute(interaction, client) {
        const serverId = parseInt(interaction.values[0].split('_')[1]);
        
        if (interaction.values[0] === 'none') {
            return interaction.reply({
                embeds: [embedBuilder.infoEmbed('No Servers', 'There are currently no servers available.')],
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // Check staff permissions
            const config = await database.getConfig();
            if (!interaction.member.roles.cache.has(config.staffRoleId) && !interaction.member.permissions.has('Administrator')) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed('Permission Denied', 'You do not have permission to use this panel.')]
                });
            }

            const server = await database.getServer(serverId);
            
            if (!server) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed('Error', 'Server not found.')]
                });
            }

            if (server.boostActivated) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed('Already Active', 'This server boost is already activated.')]
                });
            }

            const slotCount = await database.getServerSlotCount(serverId);

            // Activate boost
            const { boostStartTime, boostEndTime } = await database.activateBoost(serverId);

            // Announce in server channel
            if (server.channelId) {
                const serverChannel = await client.channels.fetch(server.channelId).catch(() => null);
                if (serverChannel) {
                    await serverChannel.send({
                        content: `<@&${server.roleId}>`,
                        embeds: [{
                            title: '⚡ BOOST ACTIVATED!',
                            description: `Server ${serverId} boost is now active! All members can join the game server for x8 boost experience.`,
                            color: 0x57F287,
                            fields: [
                                {
                                    name: '⏰ Duration',
                                    value: `${server.boostDuration} hours`,
                                    inline: true
                                },
                                {
                                    name: '🕐 Started',
                                    value: `<t:${Math.floor(boostStartTime.getTime() / 1000)}:F>`,
                                    inline: true
                                },
                                {
                                    name: '🕐 Ends',
                                    value: `<t:${Math.floor(boostEndTime.getTime() / 1000)}:F>`,
                                    inline: true
                                }
                            ],
                            timestamp: new Date()
                        }]
                    });
                }
            }

            // Log to audit
            if (config.auditLogChannelId) {
                const auditChannel = await client.channels.fetch(config.auditLogChannelId).catch(() => null);
                if (auditChannel) {
                    await auditChannel.send({
                        embeds: [embedBuilder.successEmbed(
                            'Boost Activated',
                            `${interaction.user} activated boost for **Server ${serverId}**\n\n` +
                            `**Ends:** <t:${Math.floor(boostEndTime.getTime() / 1000)}:R>`
                        )]
                    });
                }
            }

            await interaction.editReply({
                embeds: [embedBuilder.successEmbed(
                    'Boost Activated',
                    `Server ${serverId} boost has been activated successfully!\n\n` +
                    `**Ends:** <t:${Math.floor(boostEndTime.getTime() / 1000)}:R>`
                )]
            });

            // Update all panels
            await panelManager.triggerUpdate(client);

        } catch (error) {
            console.error('Error activating boost:', error);
            await interaction.editReply({
                embeds: [embedBuilder.errorEmbed('Error', 'Failed to activate boost.')]
            });
        }
    }
};
