const database = require('../../database');
const embedBuilder = require('../../utilities/embedBuilder');
const panelManager = require('../../utilities/panelManager');

module.exports = {
    customId: 'approve',

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
            const server = await database.getServer(ticket.serverId);

            if (!server) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed('Error', 'Server not found.')]
                });
            }

            // Update ticket status
            await database.updateTicket(ticketId, {
                status: 'approved',
                approvedBy: interaction.user.id,
                approvedAt: new Date()
            });

            // Add slots to server (each username is 1 slot)
            await database.addSlotToServer(ticket.serverId, ticket.userId, ticket.robloxUsernames);

            // Create purchase record
            await database.createPurchase({
                userId: ticket.userId,
                serverId: ticket.serverId,
                ticketId: ticketId,
                slotCount: ticket.slotCount,
                price: server.price,
                robloxUsernames: ticket.robloxUsernames
            });

            // Give user the server role
            if (server.roleId) {
                const guild = interaction.guild;
                const member = await guild.members.fetch(ticket.userId).catch(() => null);
                if (member) {
                    await member.roles.add(server.roleId).catch(console.error);
                }
            }

            // Update ticket channel
            const ticketChannel = await client.channels.fetch(ticket.channelId).catch(() => null);
            if (ticketChannel) {
                await ticketChannel.send({
                    content: `<@${ticket.userId}>`,
                    embeds: [embedBuilder.successEmbed(
                        'Purchase Approved',
                        `Your purchase has been approved by ${interaction.user}!\n\n` +
                        `You now have access to <#${server.channelId}> where you can chat with staff and other members.\n\n` +
                        `**Next Steps:**\n` +
                        `1. Wait for all slots to be filled (current: ${await database.getServerSlotCount(ticket.serverId)}/20)\n` +
                        `2. Staff will activate the boost\n` +
                        `3. Add the staff in-game to join the boosted server\n\n` +
                        `Thank you for your purchase!`
                    )]
                });
            }

            // Update approval message
            await interaction.message.edit({
                embeds: [{
                    ...interaction.message.embeds[0].data,
                    color: 0x57F287,
                    footer: {
                        text: `Approved by ${interaction.user.tag}`
                    }
                }],
                components: []
            });

            // Log to audit
            if (config.auditLogChannelId) {
                const auditChannel = await client.channels.fetch(config.auditLogChannelId).catch(() => null);
                if (auditChannel) {
                    await auditChannel.send({
                        embeds: [embedBuilder.successEmbed(
                            'Ticket Approved',
                            `${interaction.user} approved ticket for <@${ticket.userId}>\n\n` +
                            `**Server:** ${ticket.serverId}\n` +
                            `**Slots:** ${ticket.slotCount}\n` +
                            `**Price:** IDR ${server.price.toLocaleString()}\n` +
                            `**Current Slots:** ${await database.getServerSlotCount(ticket.serverId)}/20`
                        )]
                    });
                }
            }

            await interaction.editReply({
                embeds: [embedBuilder.successEmbed('Approved', 'Ticket has been approved successfully!')]
            });

            // Update all panels
            await panelManager.triggerUpdate(client);

        } catch (error) {
            console.error('Error approving ticket:', error);
            await interaction.editReply({
                embeds: [embedBuilder.errorEmbed('Error', 'Failed to approve ticket.')]
            });
        }
    }
};
