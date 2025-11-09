const embedBuilder = require('../../utilities/embedBuilder');

module.exports = {
    customId: 'cancelPurchase',

    async execute(interaction, client) {
        try {
            await interaction.message.delete().catch(() => null);
            
            await interaction.reply({
                embeds: [embedBuilder.infoEmbed('Purchase Cancelled', 'Your purchase has been cancelled.')],
                ephemeral: true
            });
        } catch (error) {
            console.error('Error cancelling purchase:', error);
        }
    }
};
