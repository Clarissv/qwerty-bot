const { SlashCommandBuilder } = require('discord.js');
const database = require('../database');
const embedBuilder = require('../utilities/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mypurchases')
        .setDescription('View your purchase history'),

    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const purchases = await database.getUserPurchases(interaction.user.id);

            if (purchases.length === 0) {
                return interaction.editReply({
                    embeds: [embedBuilder.infoEmbed('No Purchases', 'You have not made any purchases yet.')]
                });
            }

            const fields = purchases.slice(0, 10).map((purchase, index) => {
                return {
                    name: `Purchase #${index + 1} - Server ${purchase.serverId}`,
                    value: 
                        `**Slots:** ${purchase.slotCount}\n` +
                        `**Price:** IDR ${purchase.price.toLocaleString()}\n` +
                        `**Date:** <t:${Math.floor(purchase.createdAt.getTime() / 1000)}:F>\n` +
                        `**Usernames:** ${purchase.robloxUsernames.join(', ')}`,
                    inline: false
                };
            });

            const embed = {
                title: '📜 Your Purchase History',
                description: `Total purchases: ${purchases.length}${purchases.length > 10 ? ' (showing latest 10)' : ''}`,
                color: 0x5865F2,
                fields,
                timestamp: new Date()
            };

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching purchases:', error);
            await interaction.editReply({
                embeds: [embedBuilder.errorEmbed('Error', 'Failed to fetch purchase history.')]
            });
        }
    }
};
