const database = require('../../database');
const embedBuilder = require('../../utilities/embedBuilder');

module.exports = {
    customId: 'serverInfo',

    async execute(interaction, client) {
        const serverId = parseInt(interaction.values[0].split('_')[1]);
        
        if (interaction.values[0] === 'none') {
            return interaction.reply({
                embeds: [embedBuilder.infoEmbed('No Servers', 'There are currently no servers available.')],
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

            const slotCount = await database.getServerSlotCount(serverId);
            const embed = embedBuilder.serverInfoEmbed(server, slotCount);

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error fetching server info:', error);
            await interaction.reply({
                embeds: [embedBuilder.errorEmbed('Error', 'Failed to fetch server information.')],
                ephemeral: true
            });
        }
    }
};
