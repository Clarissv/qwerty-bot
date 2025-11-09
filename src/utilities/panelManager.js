const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const database = require('../database');

class PanelManager {
    constructor() {
        this.panels = new Map(); // Store panel message IDs
    }

    // Register a panel for auto-updates
    registerPanel(messageId, channelId, type) {
        this.panels.set(messageId, { channelId, type, lastUpdate: Date.now() });
    }

    // Update all registered panels
    async updateAllPanels(client) {
        for (const [messageId, panelInfo] of this.panels.entries()) {
            try {
                const channel = await client.channels.fetch(panelInfo.channelId).catch(() => null);
                if (!channel) {
                    this.panels.delete(messageId);
                    continue;
                }

                const message = await channel.messages.fetch(messageId).catch(() => null);
                if (!message) {
                    this.panels.delete(messageId);
                    continue;
                }

                // Update the panel based on type
                if (panelInfo.type === 'server-panel') {
                    await this.updateServerPanel(message);
                } else if (panelInfo.type === 'admin-panel') {
                    await this.updateAdminPanel(message);
                } else if (panelInfo.type === 'purchase-panel') {
                    await this.updatePurchasePanel(message);
                } else if (panelInfo.type === 'username-panel') {
                    await this.updateUsernamePanel(message);
                }

                panelInfo.lastUpdate = Date.now();
            } catch (error) {
                console.error(`Error updating panel ${messageId}:`, error);
            }
        }
    }

    // Generate server panel dropdown
    async getServerPanelComponents() {
        const servers = await database.getActiveServers();
        
        const options = [];
        for (const server of servers) {
            const slotCount = await database.getServerSlotCount(server.serverId);
            options.push({
                label: `Server ${server.serverId}`,
                description: `${slotCount}/20 slots | IDR ${server.price.toLocaleString()} | ${server.boostActivated ? 'Active' : 'Pending'}`,
                value: `server_${server.serverId}`,
                emoji: '🖥️'
            });
        }

        if (options.length === 0) {
            options.push({
                label: 'No servers available',
                description: 'Please wait for staff to open servers',
                value: 'none',
                emoji: '❌'
            });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('serverInfo_select')
            .setPlaceholder('Select a server to view details')
            .addOptions(options);

        return new ActionRowBuilder().addComponents(selectMenu);
    }

    // Generate admin panel dropdown
    async getAdminPanelComponents() {
        const servers = await database.getActiveServers();
        
        const options = [];
        for (const server of servers) {
            const slotCount = await database.getServerSlotCount(server.serverId);
            const canActivate = !server.boostActivated && slotCount >= 20;
            
            options.push({
                label: `Server ${server.serverId}`,
                description: canActivate ? 'Ready to activate!' : server.boostActivated ? 'Already active' : `${slotCount}/20 slots filled`,
                value: `activate_${server.serverId}`,
                emoji: canActivate ? '⚡' : server.boostActivated ? '✅' : '⏳'
            });
        }

        if (options.length === 0) {
            options.push({
                label: 'No servers available',
                description: 'Use /open command to create servers',
                value: 'none',
                emoji: '❌'
            });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('activateBoost_select')
            .setPlaceholder('Select a server to activate boost')
            .addOptions(options);

        return new ActionRowBuilder().addComponents(selectMenu);
    }

    // Generate purchase panel dropdown
    async getPurchasePanelComponents() {
        const servers = await database.getActiveServers();
        
        const options = [];
        for (const server of servers) {
            if (server.isOpen) {
                const slotCount = await database.getServerSlotCount(server.serverId);
                const slotsAvailable = 20 - slotCount;
                
                if (slotsAvailable > 0) {
                    options.push({
                        label: `Server ${server.serverId}`,
                        description: `${slotsAvailable} slots available | IDR ${server.price.toLocaleString()}`,
                        value: `purchase_${server.serverId}`,
                        emoji: '🎫'
                    });
                }
            }
        }

        if (options.length === 0) {
            options.push({
                label: 'No servers available',
                description: 'All servers are full or closed',
                value: 'none',
                emoji: '❌'
            });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('purchase_select')
            .setPlaceholder('Select a server to purchase slots')
            .addOptions(options);

        return new ActionRowBuilder().addComponents(selectMenu);
    }

    // Generate username panel dropdown
    async getUsernamePanelComponents() {
        const servers = await database.getActiveServers();
        
        const options = [];
        for (const server of servers) {
            const slotCount = await database.getServerSlotCount(server.serverId);
            options.push({
                label: `Server ${server.serverId}`,
                description: `${slotCount}/20 slots | View all usernames`,
                value: `usernames_${server.serverId}`,
                emoji: '📝'
            });
        }

        if (options.length === 0) {
            options.push({
                label: 'No servers available',
                description: 'Use /open command to create servers',
                value: 'none',
                emoji: '❌'
            });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('viewUsernames_select')
            .setPlaceholder('Select a server to view usernames')
            .addOptions(options);

        return new ActionRowBuilder().addComponents(selectMenu);
    }

    // Update specific panel types
    async updateServerPanel(message) {
        const row = await this.getServerPanelComponents();
        await message.edit({ components: [row] }).catch(console.error);
    }

    async updateAdminPanel(message) {
        const row = await this.getAdminPanelComponents();
        await message.edit({ components: [row] }).catch(console.error);
    }

    async updatePurchasePanel(message) {
        const row = await this.getPurchasePanelComponents();
        await message.edit({ components: [row] }).catch(console.error);
    }

    async updateUsernamePanel(message) {
        const row = await this.getUsernamePanelComponents();
        await message.edit({ components: [row] }).catch(console.error);
    }

    // Trigger update (call this when servers change)
    async triggerUpdate(client) {
        await this.updateAllPanels(client);
    }
}

module.exports = new PanelManager();
