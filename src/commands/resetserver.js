const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const database = require('../database');
const embedBuilder = require('../utilities/embedBuilder');
const panelManager = require('../utilities/panelManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetserver')
        .setDescription('Reset a specific server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addIntegerOption(option =>
            option
                .setName('server')
                .setDescription('Server ID to reset')
                .setRequired(true)
                .setMinValue(1)
        )
        .addBooleanOption(option =>
            option
                .setName('delete-channel')
                .setDescription('Also delete the server channel and role (default: true)')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('clear-data')
                .setDescription('Also clear all tickets and purchases for this server (default: true)')
                .setRequired(false)
        ),

    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const serverId = interaction.options.getInteger('server');
            const deleteChannel = interaction.options.getBoolean('delete-channel') ?? true;
            const clearData = interaction.options.getBoolean('clear-data') ?? true;

            // Get server
            const server = await database.getServer(serverId);
            if (!server) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed('Error', `Server ${serverId} not found.`)]
                });
            }

            let channelDeleted = false;
            let roleDeleted = false;
            let ticketsCleared = 0;
            let purchasesCleared = 0;

            // Delete channel and role if requested
            if (deleteChannel) {
                // Delete channel
                if (server.channelId) {
                    const channel = await interaction.guild.channels.fetch(server.channelId).catch(() => null);
                    if (channel) {
                        await channel.delete().catch(err => {
                            console.error(`Failed to delete channel ${server.channelId}:`, err);
                        });
                        channelDeleted = true;
                    }
                }

                // Delete role
                if (server.roleId) {
                    const role = await interaction.guild.roles.fetch(server.roleId).catch(() => null);
                    if (role) {
                        await role.delete().catch(err => {
                            console.error(`Failed to delete role ${server.roleId}:`, err);
                        });
                        roleDeleted = true;
                    }
                }
            }

            // Clear tickets and purchases if requested
            if (clearData) {
                // Get ticket channels before clearing
                const tickets = await database.db.collection('tickets').find({ serverId: serverId }).toArray();
                
                // Delete ticket channels
                for (const ticket of tickets) {
                    if (ticket.channelId) {
                        const ticketChannel = await interaction.guild.channels.fetch(ticket.channelId).catch(() => null);
                        if (ticketChannel) {
                            await ticketChannel.delete().catch(err => {
                                console.error(`Failed to delete ticket channel ${ticket.channelId}:`, err);
                            });
                        }
                    }
                }

                const ticketsResult = await database.db.collection('tickets').deleteMany({ serverId: serverId });
                ticketsCleared = ticketsResult.deletedCount;

                const purchasesResult = await database.db.collection('purchases').deleteMany({ serverId: serverId });
                purchasesCleared = purchasesResult.deletedCount;
            }

            // Delete server from database
            await database.db.collection('servers').deleteOne({ serverId: serverId });

            // Get config for audit log
            const config = await database.getConfig();

            // Log to audit channel
            if (config.auditLogChannelId) {
                const auditChannel = await client.channels.fetch(config.auditLogChannelId).catch(() => null);
                if (auditChannel) {
                    await auditChannel.send({
                        embeds: [{
                            title: '🔄 Server Reset',
                            description: `${interaction.user} reset Server ${serverId}`,
                            color: 0xED4245,
                            fields: [
                                {
                                    name: '🗑️ Channel Deleted',
                                    value: channelDeleted ? 'Yes' : 'No',
                                    inline: true
                                },
                                {
                                    name: '🎭 Role Deleted',
                                    value: roleDeleted ? 'Yes' : 'No',
                                    inline: true
                                },
                                {
                                    name: '📋 Tickets Cleared',
                                    value: ticketsCleared.toString(),
                                    inline: true
                                },
                                {
                                    name: '💰 Purchases Cleared',
                                    value: purchasesCleared.toString(),
                                    inline: true
                                }
                            ],
                            timestamp: new Date()
                        }]
                    });
                }
            }

            // Update all panels
            await panelManager.triggerUpdate(client);

            await interaction.editReply({
                embeds: [embedBuilder.successEmbed(
                    'Server Reset Successfully',
                    `**Server ${serverId}** has been reset.\n\n` +
                    `**Channel Deleted:** ${channelDeleted ? 'Yes' : 'No'}\n` +
                    `**Role Deleted:** ${roleDeleted ? 'Yes' : 'No'}\n` +
                    `**Tickets Cleared:** ${ticketsCleared}\n` +
                    `**Purchases Cleared:** ${purchasesCleared}\n\n` +
                    `All panels have been updated.`
                )]
            });

        } catch (error) {
            console.error('Error resetting server:', error);
            await interaction.editReply({
                embeds: [embedBuilder.errorEmbed(
                    'Error',
                    'Failed to reset server. Check console for details.'
                )]
            });
        }
    }
};
