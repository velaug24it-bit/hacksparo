const mongoose = require('mongoose');

let isConnectedToMongo = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crisiscare_mesh';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick timeout to failover cleanly if mongo is offline
    });
    isConnectedToMongo = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    isConnectedToMongo = false;
    console.warn(`[Database] MongoDB connection failed (${error.message}).`);
    console.log(`[Database] Resilient In-Memory & File-backed Store activated for CrisisCare Mesh.`);
  }
};

const getDBStatus = () => ({
  connected: isConnectedToMongo,
  type: isConnectedToMongo ? 'MongoDB (Mongoose)' : 'Resilient In-Memory Store'
});

module.exports = {
  connectDB,
  getDBStatus,
  isConnected: () => isConnectedToMongo
};
