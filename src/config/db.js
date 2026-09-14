const dns = require('node:dns');
// Fix Windows c-ares DNS resolver for MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore if already set
}

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI ;
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    if (error.message.includes('authentication failed')) {
      console.log('👉 MongoDB Atlas Authentication Failed! Please check your MongoDB Atlas Database Username and Password in Database Access.');
    } else {
      console.log('👉 Make sure MongoDB service is running or paste your MongoDB Atlas URI in E:\\emran vai\\server\\.env');
    }
  }
};

const checkDb = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: 'MongoDB is not connected! Please verify your MongoDB Atlas credentials or connection string in .env',
    });
    return false;
  }
  return true;
};

module.exports = { connectDB, checkDb };
