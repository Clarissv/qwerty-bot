const database = require('../../database');
const embedBuilder = require('../../utilities/embedBuilder');

module.exports = {
    customId: 'decline',

    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const ticketId = interaction.customId.split('_')[1];
            const ticket = await database.getTicket(ticketId);

            if (!ticket) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed('Error', 'Ticket not found.')]
                });
            }

            if (ticket.status !== 'pending') {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed('Error', 'This ticket has already been processed.')]
                });
            }

            const config = await database.getConfig();

            // Update ticket status
            await database.updateTicket(ticketId, {
                status: 'declined',
                approvedBy: interaction.user.id,
                approvedAt: new Date()
            });

            // Update ticket channel
            const ticketChannel = await client.channels.fetch(ticket.channelId).catch(() => null);
            if (ticketChannel) {
                await ticketChannel.send({
                    content: `<@${ticket.userId}>`,
                    embeds: [embedBuilder.errorEmbed(
                        'Purchase Declined',
                        `Your purchase has been declined by ${interaction.user}.\n\n` +
                        `Please contact staff if you believe this is an error or if you need assistance.`
                    )]
                });

                // Delete ticket channel after 5 minutes
                setTimeout(async () => {
                    await ticketChannel.delete().catch(console.error);
                }, 5 * 60 * 1000);
            }

            // Update approval message
            await interaction.message.edit({
                embeds: [{
                    ...interaction.message.embeds[0].data,
                    color: 0xED4245,
                    footer: {
                        text: `Declined by ${interaction.user.tag}`
                    }
                }],
                components: []
            });

            // Log to audit
            if (config.auditLogChannelId) {
                const auditChannel = await client.channels.fetch(config.auditLogChannelId).catch(() => null);
                if (auditChannel) {
                    await auditChannel.send({
                        embeds: [embedBuilder.errorEmbed(
                            'Ticket Declined',
                            `${interaction.user} declined ticket for <@${ticket.userId}>\n\n` +
                            `**Server:** ${ticket.serverId}\n` +
                            `**Slots:** ${ticket.slotCount}`
                        )]
                    });
                }
            }

            await interaction.editReply({
                embeds: [embedBuilder.successEmbed('Declined', 'Ticket has been declined.')]
            });

        } catch (error) {
            console.error('Error declining ticket:', error);
            await interaction.editReply({
                embeds: [embedBuilder.errorEmbed('Error', 'Failed to decline ticket.')]
            });
        }
    }
};
