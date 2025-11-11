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

        await interaction.deferReply({ ephemeral: true });

        try {
            const server = await database.getServer(serverId);
            
            if (!server) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed('Error', 'Server not found.')]
                });
            }

            const slotCount = await database.getServerSlotCount(serverId);
            
            // Build base embed fields
            const config = require('../../config');
            const fields = [
                {
                    name: '🖥️ Server Status',
                    value: server.isOpen ? '✅ Open' : '❌ Closed',
                    inline: true
                },
                {
                    name: '💰 Price',
                    value: `IDR ${server.price.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '⚡ Boost Status',
                    value: server.boostActivated ? '✅ Active' : '⏳ Pending',
                    inline: true
                },
                {
                    name: '👥 Slots',
                    value: `${slotCount}/${config.maxSlotsPerServer}`,
                    inline: true
                },
                {
                    name: '⏱️ Duration',
                    value: `${server.boostDuration} hours`,
                    inline: true
                }
            ];

            if (server.boostActivated && server.boostEndTime) {
                const endTime = new Date(server.boostEndTime);
                const now = new Date();
                const timeRemaining = Math.floor((endTime - now) / 1000 / 60 / 60);
                
                if (timeRemaining > 0) {
                    fields.push({
                        name: '⏰ Time Remaining',
                        value: `${timeRemaining.toFixed(1)} hours`,
                        inline: true
                    });
                }
                
                fields.push({
                    name: timeRemaining > 0 ? '🕐 Ends At' : '⏰ Ended At',
                    value: `<t:${Math.floor(endTime.getTime() / 1000)}:F>`,
                    inline: true
                });
            }

            // Build member list
            let membersList = '';
            let usernameCount = 0;
            
            if (server.slots && server.slots.length > 0) {
                server.slots.forEach((slot) => {
                    const count = slot.robloxUsernames ? slot.robloxUsernames.length : 0;
                    membersList += `<@${slot.userId}> (${count} slot${count !== 1 ? 's' : ''})\n`;
                    usernameCount += count;
                });
            }

            // Check if pagination is needed (field limit is 1024 chars)
            const memberFieldName = `👤 Members (${usernameCount} total slots)`;
            
            if (membersList.length > 1000) {
                // Split into multiple embeds
                const baseEmbed = {
                    title: `🖥️ Server ${server.serverId}`,
                    color: server.boostActivated ? config.successColor : config.warningColor,
                    fields: fields,
                    footer: {
                        text: 'Page 1 - Server Info'
                    },
                    timestamp: new Date()
                };

                await interaction.editReply({ embeds: [baseEmbed] });

                // Send member list in separate embeds
                const memberChunks = [];
                const lines = membersList.split('\n').filter(line => line.length > 0);
                let currentChunk = '';
                
                for (const line of lines) {
                    if ((currentChunk + line + '\n').length > 1000) {
                        memberChunks.push(currentChunk);
                        currentChunk = line + '\n';
                    } else {
                        currentChunk += line + '\n';
                    }
                }
                if (currentChunk.length > 0) {
                    memberChunks.push(currentChunk);
                }

                // Send member list pages
                for (let i = 0; i < memberChunks.length; i++) {
                    const memberEmbed = {
                        title: `🖥️ Server ${server.serverId} - Members`,
                        description: memberChunks[i],
                        color: server.boostActivated ? config.successColor : config.warningColor,
                        footer: {
                            text: `Page ${i + 2} - Members (${i + 1}/${memberChunks.length})`
                        },
                        timestamp: new Date()
                    };
                    
                    await interaction.followUp({ embeds: [memberEmbed], ephemeral: true });
                }
            } else {
                // Single embed with everything
                if (membersList.length > 0) {
                    fields.push({
                        name: memberFieldName,
                        value: membersList || 'No members yet',
                        inline: false
                    });
                }

                const embed = {
                    title: `🖥️ Server ${server.serverId}`,
                    color: server.boostActivated ? config.successColor : config.warningColor,
                    fields,
                    timestamp: new Date()
                };

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error fetching server info:', error);
            await interaction.editReply({
                embeds: [embedBuilder.errorEmbed('Error', 'Failed to fetch server information.')]
            });
        }
    }
};
