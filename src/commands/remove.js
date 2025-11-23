const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const database = require('../database');
const embedBuilder = require('../utilities/embedBuilder');
const panelManager = require('../utilities/panelManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a person from a server slot')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addIntegerOption(option =>
            option
                .setName('server')
                .setDescription('Server ID to remove the person from')
                .setRequired(true)
                .setMinValue(1)
        )
        .addStringOption(option =>
            option
                .setName('username')
                .setDescription('Roblox username to remove')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const serverId = interaction.options.getInteger('server');
            const username = interaction.options.getString('username');

            // Get server
            const server = await database.getServer(serverId);
            if (!server) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed('Error', 'Server not found.')]
                });
            }

            // Find purchase with this username in this server (case-insensitive)
            const purchase = await database.db.collection('purchases').findOne({
                serverId: serverId,
                robloxUsernames: { 
                    $elemMatch: { 
                        $regex: new RegExp(`^${username}$`, 'i') 
                    } 
                }
            });

            if (!purchase) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed(
                        'Not Found',
                        `Could not find an active purchase with username \`${username}\` in Server ${serverId}.`
                    )]
                });
            }

            // Get the user ID from purchase
            const userId = purchase.userId;

            // Find the exact username match (case-insensitive)
            const exactUsername = purchase.robloxUsernames.find(
                name => name.toLowerCase() === username.toLowerCase()
            );

            // Remove the username from the purchase
            const updatedUsernames = purchase.robloxUsernames.filter(
                name => name.toLowerCase() !== username.toLowerCase()
            );

            if (updatedUsernames.length === 0) {
                // If this was the only username, delete the entire purchase
                await database.db.collection('purchases').deleteOne({ _id: purchase._id });

                // Remove role from user if they have it
                const guild = interaction.guild;
                const member = await guild.members.fetch(userId).catch(() => null);
                if (member && server.roleId) {
                    await member.roles.remove(server.roleId).catch(err => {
                        console.error('Failed to remove role:', err);
                    });
                }

                // Log to audit channel
                const config = await database.getConfig();
                if (config.auditLogChannelId) {
                    const auditChannel = await client.channels.fetch(config.auditLogChannelId).catch(() => null);
                    if (auditChannel) {
                        await auditChannel.send({
                            embeds: [embedBuilder.infoEmbed(
                                'Purchase Removed',
                                `${interaction.user} removed <@${userId}>'s entire purchase from Server ${serverId}\n\n` +
                                `**Removed Username:** \`${exactUsername}\`\n` +
                                `**Reason:** All slots removed (was only purchase)`
                            )]
                        });
                    }
                }

                await interaction.editReply({
                    embeds: [embedBuilder.successEmbed(
                        'Purchase Removed',
                        `Successfully removed \`${exactUsername}\` from Server ${serverId}.\n\n` +
                        `This was <@${userId}>'s only slot, so the entire purchase was removed.\n` +
                        `The role has been removed from the user.`
                    )]
                });
            } else {
                // Update the purchase with remaining usernames
                await database.db.collection('purchases').updateOne(
                    { _id: purchase._id },
                    { $set: { robloxUsernames: updatedUsernames } }
                );

                // Log to audit channel
                const config = await database.getConfig();
                if (config.auditLogChannelId) {
                    const auditChannel = await client.channels.fetch(config.auditLogChannelId).catch(() => null);
                    if (auditChannel) {
                        await auditChannel.send({
                            embeds: [embedBuilder.infoEmbed(
                                'Slot Removed',
                                `${interaction.user} removed a slot from Server ${serverId}\n\n` +
                                `**User:** <@${userId}>\n` +
                                `**Removed Username:** \`${exactUsername}\`\n` +
                                `**Remaining Slots:** ${updatedUsernames.length}\n` +
                                `**Remaining Usernames:** ${updatedUsernames.map(u => `\`${u}\``).join(', ')}`
                            )]
                        });
                    }
                }

                await interaction.editReply({
                    embeds: [embedBuilder.successEmbed(
                        'Slot Removed',
                        `Successfully removed \`${exactUsername}\` from Server ${serverId}.\n\n` +
                        `<@${userId}> still has ${updatedUsernames.length} slot(s) remaining:\n` +
                        updatedUsernames.map(u => `• \`${u}\``).join('\n')
                    )]
                });
            }

            // Update all panels
            await panelManager.triggerUpdate(client);

        } catch (error) {
            console.error('Error removing person from server:', error);
            await interaction.editReply({
                embeds: [embedBuilder.errorEmbed('Error', 'Failed to remove person from server. Please try again.')]
            });
        }
    }
};
