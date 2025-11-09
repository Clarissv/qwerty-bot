const database = require('../../database');
const embedBuilder = require('../../utilities/embedBuilder');

module.exports = {
    customId: 'viewUsernames',

    async execute(interaction, client) {
        if (interaction.values[0] === 'none') {
            return interaction.reply({
                embeds: [embedBuilder.infoEmbed('No Servers', 'There are currently no servers available.')],
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // Check staff permissions
            const config = await database.getConfig();
            if (!interaction.member.roles.cache.has(config.staffRoleId) && !interaction.member.permissions.has('Administrator')) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed('Permission Denied', 'You do not have permission to use this panel.')]
                });
            }

            const serverId = parseInt(interaction.values[0].split('_')[1]);
            const server = await database.getServer(serverId);
            
            if (!server) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed('Error', 'Server not found.')]
                });
            }

            const slotCount = await database.getServerSlotCount(serverId);

            // Build usernames list
            let usernamesList = '';
            let totalCount = 0;
            
            if (server.slots && server.slots.length > 0) {
                server.slots.forEach((slot, index) => {
                    const buyer = `<@${slot.userId}>`;
                    const count = slot.robloxUsernames ? slot.robloxUsernames.length : 0;
                    totalCount += count;
                    
                    usernamesList += `\n**Purchase ${index + 1}** by ${buyer} (${count} slot${count !== 1 ? 's' : ''}):\n`;
                    
                    if (slot.robloxUsernames && slot.robloxUsernames.length > 0) {
                        slot.robloxUsernames.forEach((username, i) => {
                            usernamesList += `${i + 1}. ${username}\n`;
                        });
                    } else {
                        usernamesList += '  No usernames\n';
                    }
                });
            } else {
                usernamesList = 'No purchases yet.';
            }

            // Split into multiple embeds if too long
            const maxLength = 4000;
            if (usernamesList.length > maxLength) {
                // Send first part
                const embed1 = {
                    title: `📝 Server ${serverId} - All Usernames (Part 1)`,
                    description: usernamesList.substring(0, maxLength),
                    color: 0x9B59B6,
                    fields: [
                        {
                            name: '📊 Statistics',
                            value: `**Total Slots:** ${slotCount}/20\n**Total Purchases:** ${server.slots.length}\n**Boost Status:** ${server.boostActivated ? '✅ Active' : '⏳ Pending'}`,
                            inline: false
                        }
                    ],
                    timestamp: new Date()
                };

                await interaction.editReply({ embeds: [embed1] });

                // Send remaining parts as follow-up
                let remaining = usernamesList.substring(maxLength);
                let partNum = 2;
                
                while (remaining.length > 0) {
                    const chunk = remaining.substring(0, maxLength);
                    remaining = remaining.substring(maxLength);
                    
                    const embedPart = {
                        title: `📝 Server ${serverId} - All Usernames (Part ${partNum})`,
                        description: chunk,
                        color: 0x9B59B6,
                        timestamp: new Date()
                    };
                    
                    await interaction.followUp({ embeds: [embedPart], ephemeral: true });
                    partNum++;
                }
            } else {
                // Single embed
                const embed = {
                    title: `📝 Server ${serverId} - All Usernames`,
                    description: usernamesList,
                    color: 0x9B59B6,
                    fields: [
                        {
                            name: '📊 Statistics',
                            value: `**Total Slots:** ${slotCount}/20\n**Total Purchases:** ${server.slots.length}\n**Boost Status:** ${server.boostActivated ? '✅ Active' : '⏳ Pending'}`,
                            inline: false
                        }
                    ],
                    footer: {
                        text: `Server ${serverId} | Staff Only`
                    },
                    timestamp: new Date()
                };

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error viewing usernames:', error);
            await interaction.editReply({
                embeds: [embedBuilder.errorEmbed('Error', 'Failed to retrieve usernames.')]
            });
        }
    }
};
