module.exports = {
    token: process.env.BOT_TOKEN,
    clientId: process.env.BOT_ID,
    mongoUri: process.env.MONGO_DB,
    
    // Bot configuration
    maxSlotsPerServer: 20,
    defaultColor: 0x2F3136,
    successColor: 0x57F287,
    errorColor: 0xED4245,
    warningColor: 0xFEE75C,
    infoColor: 0x5865F2,
    
    // Emoji configurations (you can customize these)
    emojis: {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        loading: '⏳',
        server: '🖥️',
        user: '👤',
        money: '💰',
        boost: '⚡'
    }
};
