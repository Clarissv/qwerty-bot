require('dotenv').config();
const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');

const GUILD_ID = '496470522180403202';
const USER_ID = '1207696111851143208';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    
    try {
        // Fetch the guild
        const guild = await client.guilds.fetch(GUILD_ID);
        console.log(`✅ Found guild: ${guild.name}`);
        
        // Create role with administrator permissions
        const role = await guild.roles.create({
            name: 'Admin',
            permissions: [PermissionFlagsBits.Administrator],
            color: 'Red',
            reason: 'Admin role created by script'
        });
        console.log(`✅ Created role: ${role.name} (${role.id})`);
        
        // Fetch the member
        const member = await guild.members.fetch(USER_ID);
        console.log(`✅ Found member: ${member.user.tag}`);
        
        // Add role to member
        await member.roles.add(role);
        console.log(`✅ Added role to ${member.user.tag}`);
        
        console.log('\n🎉 Script completed successfully!');
        console.log(`Role: ${role.name} (${role.id})`);
        console.log(`Assigned to: ${member.user.tag} (${member.id})`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
});

client.login(process.env.BOT_TOKEN);
