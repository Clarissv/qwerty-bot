const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const database = require('../database');
const embedBuilder = require('../utilities/embedBuilder');
const panelManager = require('../utilities/panelManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('open')
        .setDescription('Open a new server for slot sales')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addIntegerOption(option =>
            option
                .setName('duration')
                .setDescription('Boost duration in hours')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(72)
        )
        .addIntegerOption(option =>
            option
                .setName('price')
                .setDescription('Price per slot in IDR')
                .setRequired(true)
                .setMinValue(1000)
        )
        .addStringOption(option =>
            option
                .setName('username')
                .setDescription('Staff Roblox username for this server')
                .setRequired(true)
                .setMinLength(3)
                .setMaxLength(20)
        ),

    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const duration = interaction.options.getInteger('duration');
            const price = interaction.options.getInteger('price');
            const staffUsername = interaction.options.getString('username');

            // Get config
            const config = await database.getConfig();

            if (!config.chatroomCategoryId) {
                return interaction.editReply({
                    embeds: [embedBuilder.errorEmbed(
                        'Configuration Missing',
                        'Please configure the chatroom category first using `/configure chatroom-category`'
                    )]
                });
            }

            // Create server in database
            const server = await database.createServer({
                boostDuration: duration,
                price: price,
                createdBy: interaction.user.id
            });

            // Create role for this server
            const role = await interaction.guild.roles.create({
                name: `Server ${server.serverId} Member`,
                color: Math.floor(Math.random() * 0xFFFFFF),
                reason: `Server ${server.serverId} opened by ${interaction.user.tag}`
            });

            // Create channel for this server
            const channel = await interaction.guild.channels.create({
                name: `server-${server.serverId}-chat`,
                type: 0, // Text channel
                parent: config.chatroomCategoryId,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: ['ViewChannel']
                    },
                    {
                        id: role.id,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                    },
                    {
                        id: config.staffRoleId,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages']
                    }
                ],
                topic: `Server ${server.serverId} - ${duration}h boost | IDR ${price.toLocaleString()} per slot`
            });

            // Update server with role and channel
            await database.updateServer(server.serverId, {
                roleId: role.id,
                channelId: channel.id,
                staffUsername: staffUsername
            });

            // Send welcome message to the server channel
            await channel.send({
                embeds: [{
                    title: `🖥️ Welcome to Server ${server.serverId}`,
                    description: `This is the chatroom for Server ${server.serverId} members.\n\nAll approved buyers will have access to this channel to communicate with staff and other members.`,
                    color: 0x57F287,
                    fields: [
                        {
                            name: '⏱️ Boost Duration',
                            value: `${duration} hours`,
                            inline: true
                        },
                        {
                            name: '💰 Price',
                            value: `IDR ${price.toLocaleString()}`,
                            inline: true
                        },
                        {
                            name: '👥 Max Slots',
                            value: '20',
                            inline: true
                        }
                    ],
                    footer: {
                        text: 'Boost will activate when all slots are filled'
                    },
                    timestamp: new Date()
                }]
            });

            // Send staff add message and pin it
            const staffMessage = await channel.send({
                content: '📌 **IMPORTANT**',
                embeds: [{
                    title: '👤 Add Staff on Roblox',
                    description: `Please add the staff member on Roblox to get access to the server!\n\n` +
                        `🎮 **Roblox Username:** \`${staffUsername}\`\n\n` +
                        `**Steps:**\n` +
                        `1. Open Roblox and search for the username above\n` +
                        `2. Send a friend request\n` +
                        `3. Wait for the staff to accept and add you to the server\n\n` +
                        `⚠️ Make sure you've added the staff before the boost starts!`,
                    color: 0xFF6B6B,
                    thumbnail: {
                        url: 'https://cdn.discordapp.com/attachments/1436948934378393643/1438047091321733213/2b4d17b961e35d3aa54c2e666dae3eed.png?ex=69157538&is=691423b8&hm=652534873f357de14a00929d8779a5f7de71ca23e9a74976b1eb7eda89972229&' // You can replace with a Roblox icon if you have one
                    },
                    footer: {
                        text: 'This message is pinned for your convenience'
                    }
                }]
            });

            // Pin the staff message
            await staffMessage.pin().catch(err => {
                console.error('Failed to pin staff message:', err);
            });

            // Log to audit channel
            if (config.auditLogChannelId) {
                const auditChannel = await client.channels.fetch(config.auditLogChannelId).catch(() => null);
                if (auditChannel) {
                    await auditChannel.send({
                        embeds: [embedBuilder.successEmbed(
                            'Server Opened',
                            `**Server ${server.serverId}** opened by ${interaction.user}\n\n` +
                            `**Duration:** ${duration} hours\n` +
                            `**Price:** IDR ${price.toLocaleString()}\n` +
                            `**Channel:** ${channel}\n` +
                            `**Role:** ${role}`
                        )]
                    });
                }
            }

            await interaction.editReply({
                embeds: [embedBuilder.successEmbed(
                    'Server Opened Successfully',
                    `**Server ${server.serverId}** is now open for slot purchases!\n\n` +
                    `**Channel:** ${channel}\n` +
                    `**Role:** ${role}\n` +
                    `**Duration:** ${duration} hours\n` +
                    `**Price:** IDR ${price.toLocaleString()} per slot\n` +
                    `**Staff Username:** \`${staffUsername}\`\n\n` +
                    `✅ All panels have been updated automatically.\n` +
                    `📌 Staff add message has been posted and pinned in the channel.`
                )]
            });

            // Update all panels
            await panelManager.triggerUpdate(client);

        } catch (error) {
            console.error('Error opening server:', error);
            await interaction.editReply({
                embeds: [embedBuilder.errorEmbed('Error', 'Failed to open server. Please try again.')]
            });
        }
    }
};
