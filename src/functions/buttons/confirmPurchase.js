const { PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const database = require('../../database');
const embedBuilder = require('../../utilities/embedBuilder');

module.exports = {
    customId: 'confirmPurchase',

    async execute(interaction, client) {
        // Defer the reply immediately
        try {
            await interaction.deferReply({ ephemeral: true });
        } catch (error) {
            console.error('Error deferring reply:', error);
            return;
        }

        try {
            const parts = interaction.customId.split('_');
            const serverId = parseInt(parts[1]);
            const usernames = parts.slice(2).join('_').split('|');

            const server = await database.getServer(serverId);
            if (!server) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed('Error', 'Server not found.')]
                });
            }

            // Check slots availability one more time
            const currentSlots = await database.getServerSlotCount(serverId);
            const slotsAvailable = 20 - currentSlots;

            if (usernames.length > slotsAvailable) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed(
                        'Slots Full',
                        'Sorry, this server is now full. Please try another server.'
                    )]
                });
            }

            const config = await database.getConfig();

            if (!config.ticketCategoryId) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed(
                        'Configuration Error',
                        'Ticket category not configured. Please contact an administrator.'
                    )]
                });
            }

            if (!config.staffRoleId) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed(
                        'Configuration Error',
                        'Staff role not configured. Please contact an administrator.'
                    )]
                });
            }

            // Create ticket channel
            let ticketChannel;
            try {
                ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}-${Date.now().toString().slice(-4)}`,
                type: ChannelType.GuildText,
                parent: config.ticketCategoryId,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    },
                    {
                        id: config.staffRoleId,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageMessages
                        ]
                    }
                ],
                topic: `Ticket for ${interaction.user.tag} | Server ${serverId}`
            });
            } catch (channelError) {
                console.error('Error creating ticket channel:', channelError);
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed(
                        'Channel Creation Failed',
                        'Failed to create ticket channel. Please check bot permissions and try again.'
                    )]
                });
            }

            // Create ticket in database
            let ticket;
            try {
                ticket = await database.createTicket({
                    userId: interaction.user.id,
                    serverId: serverId,
                    slotCount: usernames.length,
                    robloxUsernames: usernames,
                    channelId: ticketChannel.id
                });
            } catch (dbError) {
                console.error('Error creating ticket in database:', dbError);
                // Try to delete the channel we created
                await ticketChannel.delete().catch(() => {});
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed(
                        'Database Error',
                        'Failed to save ticket to database. Please try again.'
                    )]
                });
            }

            // Send ticket info to ticket channel
            try {
                const ticketEmbed = {
                title: '🎫 Ticket Created',
                description: `Thank you for your purchase, ${interaction.user}!\n\nStaff will review your purchase shortly.`,
                color: 0x5865F2,
                fields: [
                    {
                        name: '🖥️ Server',
                        value: `Server ${serverId}`,
                        inline: true
                    },
                    {
                        name: '💰 Total Price',
                        value: `IDR ${server.price.toLocaleString()}`,
                        inline: true
                    },
                    {
                        name: '👥 Slots',
                        value: usernames.length.toString(),
                        inline: true
                    },
                    {
                        name: '📝 Roblox Usernames',
                        value: usernames.map((name, i) => `${i + 1}. ${name}`).join('\n'),
                        inline: false
                    }
                ],
                footer: {
                    text: `Ticket ID: ${ticket.ticketId}`
                },
                timestamp: new Date()
            };

            const closeButton = new ButtonBuilder()
                .setCustomId(`closeTicket_${ticket.ticketId}`)
                .setLabel('Close Ticket')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒');

            const row = new ActionRowBuilder().addComponents(closeButton);

            await ticketChannel.send({
                content: `<@&${config.staffRoleId}> ${interaction.user}`,
                embeds: [ticketEmbed],
                components: [row]
            });

            // Send payment info
            if (config.qrisUrl) {
                const paymentEmbed = embedBuilder.paymentEmbed(config.qrisUrl);
                await ticketChannel.send({ embeds: [paymentEmbed] });
            }
            } catch (sendError) {
                console.error('Error sending messages to ticket channel:', sendError);
                // Don't fail the whole process if messages fail to send
                // Ticket is already created, just log the error
            }

            // Send approval request to approval channel
            try {
            if (config.approvalChannelId) {
                const approvalChannel = await client.channels.fetch(config.approvalChannelId).catch(() => null);
                if (approvalChannel) {
                    const approvalEmbed = embedBuilder.approvalEmbed(interaction.user, server, ticket);

                    const approveButton = new ButtonBuilder()
                        .setCustomId(`approve_${ticket.ticketId}`)
                        .setLabel('Approve')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅');

                    const declineButton = new ButtonBuilder()
                        .setCustomId(`decline_${ticket.ticketId}`)
                        .setLabel('Decline')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('❌');

                    const approvalRow = new ActionRowBuilder().addComponents(approveButton, declineButton);

                    await approvalChannel.send({
                        embeds: [approvalEmbed],
                        components: [approvalRow]
                    });
                }
            }
            } catch (approvalError) {
                console.error('Error sending approval request:', approvalError);
                // Don't fail the whole process
            }

            // Update the confirmation message (remove buttons)
            try {
                await interaction.message.edit({
                    components: []
                }).catch(() => {
                    // Ignore error if message was already deleted or can't be edited
                    console.log('Could not edit confirmation message (already deleted or ephemeral)');
                });
            } catch (err) {
                // Silent fail - not critical
            }

            // Send success message
            await interaction.editReply({
                embeds: [embedBuilder.successEmbed(
                    'Ticket Created Successfully!',
                    `Your ticket has been created!\n\n` +
                    `📍 **Channel:** ${ticketChannel}\n\n` +
                    `**Next Steps:**\n` +
                    `1. Check the ticket channel for payment information\n` +
                    `2. Complete your payment\n` +
                    `3. Wait for staff verification\n` +
                    `4. Once approved, you'll get access to the server chatroom!\n\n` +
                    `Thank you for your purchase! 🎉`
                )]
            });

        } catch (error) {
            console.error('Error creating ticket:', error);
            
            // More specific error handling
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    embeds: [embedBuilder.errorEmbed(
                        'Error Creating Ticket',
                        'An error occurred while creating your ticket. Please try again or contact staff for assistance.\n\n' +
                        `Error: ${error.message}`
                    )]
                }).catch(console.error);
            } else {
                await interaction.reply({
                    embeds: [embedBuilder.errorEmbed(
                        'Error Creating Ticket',
                        'An error occurred while creating your ticket. Please try again or contact staff for assistance.'
                    )],
                    ephemeral: true
                }).catch(console.error);
            }
        }
    }
};
