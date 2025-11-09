const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const database = require('../../database');
const embedBuilder = require('../../utilities/embedBuilder');

module.exports = {
    customId: 'slotCount',

    async execute(interaction, client) {
        const serverId = parseInt(interaction.customId.split('_')[2]);
        
        try {
            const slotCountStr = interaction.fields.getTextInputValue('slot_count');
            const slotCount = parseInt(slotCountStr);

            // Validate slot count
            if (isNaN(slotCount) || slotCount < 1 || slotCount > 20) {
                return interaction.reply({
                    embeds: [embedBuilder.errorEmbed('Invalid Input', 'Please enter a valid number between 1 and 20.')],
                    ephemeral: true
                });
            }

            const server = await database.getServer(serverId);
            if (!server) {
                return interaction.reply({
                    embeds: [embedBuilder.errorEmbed('Error', 'Server not found.')],
                    ephemeral: true
                });
            }

            const currentSlots = await database.getServerSlotCount(serverId);
            const slotsAvailable = 20 - currentSlots;

            if (slotCount > slotsAvailable) {
                return interaction.reply({
                    embeds: [embedBuilder.errorEmbed(
                        'Not Enough Slots',
                        `Only ${slotsAvailable} slot(s) available in this server.`
                    )],
                    ephemeral: true
                });
            }

            // Send message with button to enter usernames
            const embed = {
                title: '📝 Enter Roblox Usernames',
                description: `You've selected **${slotCount} slot(s)** for **Server ${serverId}**.\n\n` +
                    `**Next Step:** Click the button below to enter your Roblox username(s).\n\n` +
                    `**Price:** IDR ${server.price.toLocaleString()} per slot\n` +
                    `**Total:** IDR ${(server.price * slotCount).toLocaleString()}`,
                color: 0x5865F2,
                footer: {
                    text: `You'll need to provide ${slotCount} Roblox username(s)`
                }
            };

            const button = new ButtonBuilder()
                .setCustomId(`enterUsernames_${serverId}_${slotCount}`)
                .setLabel(`Enter ${slotCount} Username${slotCount > 1 ? 's' : ''}`)
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📝');

            const row = new ActionRowBuilder().addComponents(button);

            await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in slotCount modal:', error);
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    embeds: [embedBuilder.errorEmbed('Error', 'Failed to process your request.')],
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    embeds: [embedBuilder.errorEmbed('Error', 'Failed to process your request.')],
                    ephemeral: true
                });
            }
        }
    }
};
