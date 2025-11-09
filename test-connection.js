require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGO_DB;

console.log('Testing MongoDB connection...');
console.log('Connection string:', uri ? uri.substring(0, 30) + '...' : 'NOT FOUND');

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    serverSelectionTimeoutMS: 5000, // 5 second timeout
    connectTimeoutMS: 10000
});

async function testConnection() {
    try {
        console.log('Attempting to connect...');
        await client.connect();
        console.log('✅ Connected!');
        
        await client.db('admin').command({ ping: 1 });
        console.log('✅ Ping successful!');
        
        const db = client.db('qwerty_bot');
        const collections = await db.listCollections().toArray();
        console.log('✅ Collections:', collections.map(c => c.name));
        
    } catch (error) {
        console.error('❌ Connection failed!');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
    } finally {
        await client.close();
    }
}

testConnection();
