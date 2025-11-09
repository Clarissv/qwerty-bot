require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const database = require('./database');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// Collections for commands and interactions
client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Loaded command: ${command.data.name}`);
        } else {
            console.log(`⚠️  Command at ${filePath} is missing required properties`);
        }
    }
}

// Load button handlers
const buttonsPath = path.join(__dirname, 'functions', 'buttons');
if (fs.existsSync(buttonsPath)) {
    const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));
    
    for (const file of buttonFiles) {
        const filePath = path.join(buttonsPath, file);
        const button = require(filePath);
        
        if ('customId' in button && 'execute' in button) {
            client.buttons.set(button.customId, button);
            console.log(`✅ Loaded button: ${button.customId}`);
        }
    }
}

// Load select menu handlers
const selectMenusPath = path.join(__dirname, 'functions', 'selectMenus');
if (fs.existsSync(selectMenusPath)) {
    const selectMenuFiles = fs.readdirSync(selectMenusPath).filter(file => file.endsWith('.js'));
    
    for (const file of selectMenuFiles) {
        const filePath = path.join(selectMenusPath, file);
        const selectMenu = require(filePath);
        
        if ('customId' in selectMenu && 'execute' in selectMenu) {
            client.selectMenus.set(selectMenu.customId, selectMenu);
            console.log(`✅ Loaded select menu: ${selectMenu.customId}`);
        }
    }
}

// Load modal handlers
const modalsPath = path.join(__dirname, 'functions', 'modals');
if (fs.existsSync(modalsPath)) {
    const modalFiles = fs.readdirSync(modalsPath).filter(file => file.endsWith('.js'));
    
    for (const file of modalFiles) {
        const filePath = path.join(modalsPath, file);
        const modal = require(filePath);
        
        if ('customId' in modal && 'execute' in modal) {
            client.modals.set(modal.customId, modal);
            console.log(`✅ Loaded modal: ${modal.customId}`);
        }
    }
}

// Event: Bot ready
client.once('ready', async () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
    
    // Connect to database
    const dbConnected = await database.connect();
    
    if (!dbConnected) {
        console.error('❌ Failed to connect to database. Bot will not function properly!');
        console.error('⚠️ Please check your MONGO_DB connection string in .env file');
        console.error('⚠️ Make sure MongoDB Atlas network access is configured (allow 0.0.0.0/0)');
        return;
    }
    
    // Register slash commands
    await registerCommands();
    
    // Start boost checker
    require('./utilities/boostChecker')(client);
    
    console.log('✅ Bot is ready!');
});

// Event: Interaction create
client.on('interactionCreate', async interaction => {
    try {
        // Handle commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            
            await command.execute(interaction, client);
        }
        
        // Handle buttons
        if (interaction.isButton()) {
            const buttonId = interaction.customId.split('_')[0];
            const button = client.buttons.get(buttonId);
            if (!button) return;
            
            await button.execute(interaction, client);
        }
        
        // Handle select menus
        if (interaction.isStringSelectMenu()) {
            const selectMenuId = interaction.customId.split('_')[0];
            const selectMenu = client.selectMenus.get(selectMenuId);
            if (!selectMenu) return;
            
            await selectMenu.execute(interaction, client);
        }
        
        // Handle modals
        if (interaction.isModalSubmit()) {
            const modalId = interaction.customId.split('_')[0];
            const modal = client.modals.get(modalId);
            if (!modal) return;
            
            await modal.execute(interaction, client);
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        
        const errorMessage = { content: 'An error occurred while processing your request.', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

// Register slash commands
async function registerCommands() {
    try {
        const commands = [];
        
        for (const command of client.commands.values()) {
            commands.push(command.data.toJSON());
        }
        
        const rest = new REST({ version: '10' }).setToken(config.token);
        
        console.log('🔄 Refreshing application (/) commands...');
        
        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
        );
        
        console.log('✅ Successfully registered application commands');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

// Login
client.login(config.token);

// Handle errors
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});
