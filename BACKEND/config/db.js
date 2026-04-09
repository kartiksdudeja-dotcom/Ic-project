const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, 
      maxPoolSize: 10, // Maintain up to 10 socket connections
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log(`✅ MongoDB Connected to Atlas`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: Could not connect to Atlas.`);
    console.error(`CRITICAL: Your current IP Address is likely NOT whitelisted on MongoDB Atlas.`);
    console.error(`ACTION REQUIRED: Please go to MongoDB Atlas -> Network Access -> Add IP Address and add Your Current IP.`);
    console.log(`💡 Temporary Tip: You can select 'Allow Access from Anywhere' (0.0.0.0/0) in Atlas for testing.`);
    throw error;
  }
};

module.exports = connectDB;
