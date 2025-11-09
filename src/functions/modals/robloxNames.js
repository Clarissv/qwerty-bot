const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const database = require('../../database');
const embedBuilder = require('../../utilities/embedBuilder');

module.exports = {
    customId: 'robloxNames',

    async execute(interaction, client) {
        const parts = interaction.customId.split('_');
        const serverId = parseInt(parts[2]);
        const expectedSlotCount = parseInt(parts[3]);
        
        await interaction.deferReply({ ephemeral: true });

        try {
            const usernamesText = interaction.fields.getTextInputValue('roblox_usernames');
            const usernames = usernamesText
                .split('\n')
                .map(name => name.trim())
                .filter(name => name.length > 0);

            // Validate username count
            if (usernames.length !== expectedSlotCount) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed(
                        'Invalid Count',
                        `You need to provide exactly ${expectedSlotCount} username(s). You provided ${usernames.length}.`
                    )]
                });
            }

            // Validate usernames (basic check)
            const invalidUsernames = usernames.filter(name => name.length < 3 || name.length > 20);
            if (invalidUsernames.length > 0) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed(
                        'Invalid Usernames',
                        'All usernames must be between 3 and 20 characters.'
                    )]
                });
            }

            const server = await database.getServer(serverId);
            if (!server) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed('Error', 'Server not found.')]
                });
            }

            // Double check slots availability
            const currentSlots = await database.getServerSlotCount(serverId);
            const slotsAvailable = 20 - currentSlots;

            if (expectedSlotCount > slotsAvailable) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed(
                        'Slots Full',
                        `Sorry, this server now only has ${slotsAvailable} slot(s) available.`
                    )]
                });
            }

            // Show confirmation
            const confirmEmbed = embedBuilder.ticketConfirmEmbed(server, usernames);

            const confirmButton = new ButtonBuilder()
                .setCustomId(`confirmPurchase_${serverId}_${usernames.join('|')}`)
                .setLabel('Confirm Purchase')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅');

            const cancelButton = new ButtonBuilder()
                .setCustomId('cancelPurchase')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌');

            const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

            await interaction.editReply({
                embeds: [confirmEmbed],
                components: [row]
            });

        } catch (error) {
            console.error('Error in robloxNames modal:', error);
            await interaction.editReply({
                embeds: [embedBuilder.errorEmbed('Error', 'Failed to process your usernames.')]
            });
        }
    }
};
