const { SlashCommandBuilder } = require('discord.js');
const database = require('../database');
const embedBuilder = require('../utilities/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('servers')
        .setDescription('View all active servers and their status'),

    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const servers = await database.getActiveServers();

            if (servers.length === 0) {
                return interaction.editReply({
                    embeds: [embedBuilder.infoEmbed('No Servers', 'There are currently no active servers.')]
                });
            }

            const fields = [];

            for (const server of servers) {
                const slotCount = await database.getServerSlotCount(server.serverId);
                const timeRemaining = server.boostActivated && server.boostEndTime
                    ? Math.floor((new Date(server.boostEndTime) - new Date()) / 1000 / 60 / 60)
                    : null;

                fields.push({
                    name: `🖥️ Server ${server.serverId}`,
                    value: 
                        `**Status:** ${server.isOpen ? '✅ Open' : '❌ Closed'}\n` +
                        `**Boost:** ${server.boostActivated ? '⚡ Active' : '⏳ Pending'}\n` +
                        `**Slots:** ${slotCount}/20\n` +
                        `**Price:** IDR ${server.price.toLocaleString()}\n` +
                        `**Duration:** ${server.boostDuration}h\n` +
                        (timeRemaining !== null && timeRemaining > 0 ? `**Time Left:** ${timeRemaining.toFixed(1)}h\n` : '') +
                        `**Channel:** <#${server.channelId}>`,
                    inline: true
                });
            }

            const embed = {
                title: '🖥️ Active Servers',
                description: `Total active servers: ${servers.length}`,
                color: 0x5865F2,
                fields,
                timestamp: new Date()
            };

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching servers:', error);
            await interaction.editReply({
                embeds: [embedBuilder.errorEmbed('Error', 'Failed to fetch server information.')]
            });
        }
    }
};
