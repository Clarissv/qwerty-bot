const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const database = require('../database');
const embedBuilder = require('../utilities/embedBuilder');
const panelManager = require('../utilities/panelManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Reset all servers (removes all active servers)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addBooleanOption(option =>
            option
                .setName('confirm')
                .setDescription('Confirm that you want to delete all servers')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option
                .setName('delete-channels')
                .setDescription('Also delete all server channels and roles')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('clear-tickets')
                .setDescription('Also clear all tickets and purchases')
                .setRequired(false)
        ),

    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const confirm = interaction.options.getBoolean('confirm');
            const deleteChannels = interaction.options.getBoolean('delete-channels') || false;
            const clearTickets = interaction.options.getBoolean('clear-tickets') || false;

            if (!confirm) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed(
                        'Confirmation Required',
                        'You must set `confirm` to `True` to reset servers.'
                    )]
                });
            }

            // Get all servers before deleting
            const servers = await database.getActiveServers();
            const serverCount = servers.length;

            if (serverCount === 0) {
                return interaction.editReply({
                    embeds: [embedBuilder.infoEmbed(
                        'No Servers',
                        'There are no active servers to reset.'
                    )]
                });
            }

            // Delete channels and roles if requested
            if (deleteChannels) {
                for (const server of servers) {
                    // Delete channel
                    if (server.channelId) {
                        const channel = await interaction.guild.channels.fetch(server.channelId).catch(() => null);
                        if (channel) {
                            await channel.delete().catch(err => 
                                console.error(`Failed to delete channel ${server.channelId}:`, err)
                            );
                        }
                    }

                    // Delete role
                    if (server.roleId) {
                        const role = await interaction.guild.roles.fetch(server.roleId).catch(() => null);
                        if (role) {
                            await role.delete().catch(err => 
                                console.error(`Failed to delete role ${server.roleId}:`, err)
                            );
                        }
                    }
                }
            }

            // Delete all servers from database
            await database.db.collection('servers').deleteMany({});

            // Clear tickets and purchases if requested
            if (clearTickets) {
                await database.db.collection('tickets').deleteMany({});
                await database.db.collection('purchases').deleteMany({});
            }

            // Get config for audit log
            const config = await database.getConfig();

            // Log to audit channel
            if (config.auditLogChannelId) {
                const auditChannel = await client.channels.fetch(config.auditLogChannelId).catch(() => null);
                if (auditChannel) {
                    await auditChannel.send({
                        embeds: [{
                            title: '🔄 Server Reset',
                            description: `${interaction.user} reset all servers`,
                            color: 0xED4245,
                            fields: [
                                {
                                    name: '📊 Servers Removed',
                                    value: serverCount.toString(),
                                    inline: true
                                },
                                {
                                    name: '🗑️ Channels Deleted',
                                    value: deleteChannels ? 'Yes' : 'No',
                                    inline: true
                                },
                                {
                                    name: '📋 Tickets Cleared',
                                    value: clearTickets ? 'Yes' : 'No',
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
                    'Servers Reset Successfully',
                    `**${serverCount} server(s)** have been removed from the database.\n\n` +
                    `**Channels Deleted:** ${deleteChannels ? 'Yes' : 'No'}\n` +
                    `**Tickets Cleared:** ${clearTickets ? 'Yes' : 'No'}\n\n` +
                    `All panels have been updated.`
                )]
            });

        } catch (error) {
            console.error('Error resetting servers:', error);
            await interaction.editReply({
                embeds: [embedBuilder.errorEmbed(
                    'Error',
                    'Failed to reset servers. Check console for details.'
                )]
            });
        }
    }
};
