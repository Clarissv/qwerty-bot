const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const database = require('../../database');
const embedBuilder = require('../../utilities/embedBuilder');

module.exports = {
    customId: 'purchase',

    async execute(interaction, client) {
        const serverId = parseInt(interaction.values[0].split('_')[1]);
        
        if (interaction.values[0] === 'none') {
            return interaction.reply({
                embeds: [embedBuilder.infoEmbed('No Servers', 'There are currently no servers available for purchase.')],
                ephemeral: true
            });
        }

        try {
            const server = await database.getServer(serverId);
            
            if (!server) {
                return interaction.reply({
                    embeds: [embedBuilder.errorEmbed('Error', 'Server not found.')],
                    ephemeral: true
                });
            }

            if (!server.isOpen) {
                return interaction.reply({
                    embeds: [embedBuilder.errorEmbed('Server Closed', 'This server is currently closed for purchases.')],
                    ephemeral: true
                });
            }

            const slotCount = await database.getServerSlotCount(serverId);
            const slotsAvailable = 20 - slotCount;

            if (slotsAvailable <= 0) {
                return interaction.reply({
                    embeds: [embedBuilder.errorEmbed('Server Full', 'This server is currently full. Please choose another server.')],
                    ephemeral: true
                });
            }

            // Show modal to collect slot count
            const modal = new ModalBuilder()
                .setCustomId(`slotCount_modal_${serverId}`)
                .setTitle(`Purchase Slots - Server ${serverId}`);

            const slotInput = new TextInputBuilder()
                .setCustomId('slot_count')
                .setLabel('How many slots do you need?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Enter a number (1-20)')
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(2);

            const row = new ActionRowBuilder().addComponents(slotInput);
            modal.addComponents(row);

            await interaction.showModal(modal);

        } catch (error) {
            console.error('Error in purchase select:', error);
            await interaction.reply({
                embeds: [embedBuilder.errorEmbed('Error', 'Failed to process purchase request.')],
                ephemeral: true
            });
        }
    }
};
