const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const database = require('../database');
const embedBuilder = require('../utilities/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configure')
        .setDescription('Configure bot settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('chatroom-category')
                .setDescription('Set the category for server chatrooms')
                .addChannelOption(option =>
                    option
                        .setName('category')
                        .setDescription('The category channel')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('staff-role')
                .setDescription('Set the staff role')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The staff role')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('approval-channel')
                .setDescription('Set the approval channel')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The approval channel')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('audit-channel')
                .setDescription('Set the audit log channel')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The audit log channel')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('qris-url')
                .setDescription('Set the QRIS payment image URL')
                .addStringOption(option =>
                    option
                        .setName('url')
                        .setDescription('The image URL')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ticket-category')
                .setDescription('Set the category for ticket channels')
                .addChannelOption(option =>
                    option
                        .setName('category')
                        .setDescription('The category channel')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current bot configuration')
        ),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'view') {
                const config = await database.getConfig();
                
                const embed = {
                    title: '⚙️ Bot Configuration',
                    color: 0x5865F2,
                    fields: [
                        {
                            name: '📁 Chatroom Category',
                            value: config.chatroomCategoryId ? `<#${config.chatroomCategoryId}>` : 'Not set',
                            inline: true
                        },
                        {
                            name: '📁 Ticket Category',
                            value: config.ticketCategoryId ? `<#${config.ticketCategoryId}>` : 'Not set',
                            inline: true
                        },
                        {
                            name: '👮 Staff Role',
                            value: config.staffRoleId ? `<@&${config.staffRoleId}>` : 'Not set',
                            inline: true
                        },
                        {
                            name: '✅ Approval Channel',
                            value: config.approvalChannelId ? `<#${config.approvalChannelId}>` : 'Not set',
                            inline: true
                        },
                        {
                            name: '📋 Audit Channel',
                            value: config.auditLogChannelId ? `<#${config.auditLogChannelId}>` : 'Not set',
                            inline: true
                        },
                        {
                            name: '💳 QRIS URL',
                            value: config.qrisUrl ? '✅ Set' : 'Not set',
                            inline: true
                        }
                    ],
                    timestamp: new Date()
                };

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            let updates = {};
            let successMessage = '';

            switch (subcommand) {
                case 'chatroom-category':
                    const chatroomCategory = interaction.options.getChannel('category');
                    updates.chatroomCategoryId = chatroomCategory.id;
                    successMessage = `Chatroom category set to ${chatroomCategory.name}`;
                    break;

                case 'ticket-category':
                    const ticketCategory = interaction.options.getChannel('category');
                    updates.ticketCategoryId = ticketCategory.id;
                    successMessage = `Ticket category set to ${ticketCategory.name}`;
                    break;

                case 'staff-role':
                    const staffRole = interaction.options.getRole('role');
                    updates.staffRoleId = staffRole.id;
                    successMessage = `Staff role set to ${staffRole.name}`;
                    break;

                case 'approval-channel':
                    const approvalChannel = interaction.options.getChannel('channel');
                    updates.approvalChannelId = approvalChannel.id;
                    successMessage = `Approval channel set to ${approvalChannel.name}`;
                    break;

                case 'audit-channel':
                    const auditChannel = interaction.options.getChannel('channel');
                    updates.auditLogChannelId = auditChannel.id;
                    successMessage = `Audit log channel set to ${auditChannel.name}`;
                    break;

                case 'qris-url':
                    const qrisUrl = interaction.options.getString('url');
                    updates.qrisUrl = qrisUrl;
                    successMessage = 'QRIS payment URL updated successfully';
                    break;
            }

            await database.updateConfig(updates);

            // Log to audit channel
            const config = await database.getConfig();
            if (config.auditLogChannelId) {
                const auditChannel = await client.channels.fetch(config.auditLogChannelId).catch(() => null);
                if (auditChannel) {
                    await auditChannel.send({
                        embeds: [embedBuilder.infoEmbed(
                            'Configuration Updated',
                            `${interaction.user.tag} updated: ${successMessage}`
                        )]
                    });
                }
            }

            await interaction.reply({
                embeds: [embedBuilder.successEmbed('Configuration Updated', successMessage)],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in configure command:', error);
            await interaction.reply({
                embeds: [embedBuilder.errorEmbed('Error', 'Failed to update configuration.')],
                ephemeral: true
            });
        }
    }
};
