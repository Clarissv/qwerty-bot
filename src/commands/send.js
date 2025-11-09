const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const database = require('../database');
const embedBuilder = require('../utilities/embedBuilder');
const panelManager = require('../utilities/panelManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('send')
        .setDescription('Send a panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('server-panel')
                .setDescription('Send the server information panel for members')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to send the panel to')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('admin-panel')
                .setDescription('Send the admin panel for staff')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to send the panel to')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('purchase-panel')
                .setDescription('Send the purchase panel for members')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to send the panel to')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('username-panel')
                .setDescription('Send the username panel for staff (view all usernames)')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to send the panel to')
                        .setRequired(false)
                )
        ),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        try {
            if (subcommand === 'server-panel') {
                const message = await this.sendServerPanel(channel);
                panelManager.registerPanel(message.id, channel.id, 'server-panel');
                await interaction.reply({
                    embeds: [embedBuilder.successEmbed('Panel Sent', `Server panel sent to ${channel}\n\n✅ Panel will auto-update when servers change.`)],
                    ephemeral: true
                });
            } else if (subcommand === 'admin-panel') {
                const message = await this.sendAdminPanel(channel);
                panelManager.registerPanel(message.id, channel.id, 'admin-panel');
                await interaction.reply({
                    embeds: [embedBuilder.successEmbed('Panel Sent', `Admin panel sent to ${channel}\n\n✅ Panel will auto-update when servers change.`)],
                    ephemeral: true
                });
            } else if (subcommand === 'purchase-panel') {
                const message = await this.sendPurchasePanel(channel);
                panelManager.registerPanel(message.id, channel.id, 'purchase-panel');
                await interaction.reply({
                    embeds: [embedBuilder.successEmbed('Panel Sent', `Purchase panel sent to ${channel}\n\n✅ Panel will auto-update when servers change.`)],
                    ephemeral: true
                });
            } else if (subcommand === 'username-panel') {
                const message = await this.sendUsernamePanel(channel);
                panelManager.registerPanel(message.id, channel.id, 'username-panel');
                await interaction.reply({
                    embeds: [embedBuilder.successEmbed('Panel Sent', `Username panel sent to ${channel}\n\n✅ Panel will auto-update when servers change.`)],
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error sending panel:', error);
            await interaction.reply({
                embeds: [embedBuilder.errorEmbed('Error', 'Failed to send panel.')],
                ephemeral: true
            });
        }
    },

    async sendServerPanel(channel) {
        const row = await panelManager.getServerPanelComponents();

        const embed = {
            title: '🖥️ Server Information Panel',
            description: 'Select a server from the dropdown below to view its details and member list.',
            color: 0x5865F2,
            footer: {
                text: 'Panel updates automatically when servers change'
            },
            timestamp: new Date()
        };

        return await channel.send({
            embeds: [embed],
            components: [row]
        });
    },

    async sendAdminPanel(channel) {
        const row = await panelManager.getAdminPanelComponents();

        const embed = {
            title: '⚡ Admin Panel - Boost Activation',
            description: 'Select a server to activate its boost. Servers must have 20/20 slots filled before activation.',
            color: 0xFEE75C,
            footer: {
                text: 'Staff only panel | Updates automatically'
            },
            timestamp: new Date()
        };

        return await channel.send({
            embeds: [embed],
            components: [row]
        });
    },

    async sendPurchasePanel(channel) {
        const row = await panelManager.getPurchasePanelComponents();

        const embed = {
            title: '🎫 Purchase Slots',
            description: 'Select a server to purchase slots for the x8 boost experience!\n\n**How it works:**\n1. Select a server\n2. Enter number of slots needed\n3. Provide your Roblox username(s)\n4. Complete payment\n5. Wait for staff approval\n6. Enjoy x8 boost!',
            color: 0x57F287,
            footer: {
                text: '1 slot = 1 Roblox account | Updates automatically'
            },
            timestamp: new Date()
        };

        return await channel.send({
            embeds: [embed],
            components: [row]
        });
    },

    async sendUsernamePanel(channel) {
        const row = await panelManager.getUsernamePanelComponents();

        const embed = {
            title: '📝 Username Panel - Staff Only',
            description: 'Select a server to view all Roblox usernames for that server.\n\nThis panel helps staff manage and track all member usernames.',
            color: 0x9B59B6,
            footer: {
                text: 'Staff only panel | Updates automatically'
            },
            timestamp: new Date()
        };

        return await channel.send({
            embeds: [embed],
            components: [row]
        });
    }
};
