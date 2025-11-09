const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'enterUsernames',

    async execute(interaction, client) {
        const parts = interaction.customId.split('_');
        const serverId = parseInt(parts[1]);
        const slotCount = parseInt(parts[2]);

        try {
            // Show modal to collect Roblox usernames
            const modal = new ModalBuilder()
                .setCustomId(`robloxNames_modal_${serverId}_${slotCount}`)
                .setTitle(`Enter ${slotCount} Roblox Username(s)`);

            const usernamesInput = new TextInputBuilder()
                .setCustomId('roblox_usernames')
                .setLabel(`Enter ${slotCount} username(s) (one per line)`)
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Example:\nUsername1\nUsername2\nUsername3')
                .setRequired(true)
                .setMinLength(3)
                .setMaxLength(1000);

            const row = new ActionRowBuilder().addComponents(usernamesInput);
            modal.addComponents(row);

            await interaction.showModal(modal);

        } catch (error) {
            console.error('Error showing usernames modal:', error);
            await interaction.reply({
                content: 'An error occurred. Please try again.',
                ephemeral: true
            }).catch(() => {});
        }
    }
};
