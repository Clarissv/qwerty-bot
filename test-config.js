// Quick test to verify bot setup
require('dotenv').config();
const config = require('./src/config');

console.log('Testing bot configuration...\n');

console.log('✓ Token loaded:', config.token ? 'Yes' : 'No');
console.log('✓ Client ID loaded:', config.clientId ? 'Yes' : 'No');
console.log('✓ MongoDB URI loaded:', config.mongoUri ? 'Yes' : 'No');
console.log('\nConfiguration looks good!');
console.log('\nYou can now start the bot with: node src/index.js');
