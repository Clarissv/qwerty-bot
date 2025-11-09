const database = require('../../database');
const embedBuilder = require('../../utilities/embedBuilder');

module.exports = {
    customId: 'closeTicket',

    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const config = await database.getConfig();
            
            // Check if user is staff or ticket owner
            const ticket = await database.getTicketByChannel(interaction.channel.id);
            const isStaff = interaction.member.roles.cache.has(config.staffRoleId) || interaction.member.permissions.has('Administrator');
            const isOwner = ticket && ticket.userId === interaction.user.id;

            if (!isStaff && !isOwner) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed('Permission Denied', 'You cannot close this ticket.')]
                });
            }

            if (ticket) {
                await database.updateTicket(ticket.ticketId, {
                    status: 'closed'
                });
            }

            await interaction.editReply({
                embeds: [embedBuilder.infoEmbed(
                    'Closing Ticket',
                    'This ticket will be deleted in 10 seconds...'
                )]
            });

            // Log to audit
            if (config.auditLogChannelId) {
                const auditChannel = await client.channels.fetch(config.auditLogChannelId).catch(() => null);
                if (auditChannel && ticket) {
                    await auditChannel.send({
                        embeds: [embedBuilder.infoEmbed(
                            'Ticket Closed',
                            `${interaction.user} closed ticket for <@${ticket.userId}>\n\n` +
                            `**Server:** ${ticket.serverId}\n` +
                            `**Status:** ${ticket.status}`
                        )]
                    });
                }
            }

            setTimeout(async () => {
                await interaction.channel.delete().catch(console.error);
            }, 10000);

        } catch (error) {
            console.error('Error closing ticket:', error);
            await interaction.editReply({
                embeds: [embedBuilder.errorEmbed('Error', 'Failed to close ticket.')]
            });
        }
    }
};
