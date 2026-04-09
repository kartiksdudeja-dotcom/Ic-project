require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const seedUsers = async () => {
  try {
    await connectDB();

    // Clear existing users to avoid duplicates in this seed
    await User.deleteMany({});

    const users = [
      {
        username: 'kartik',
        password: 'password123',
        name: 'Kartik',
        role: 'Manager'
      },
      {
        username: 'ravindra',
        password: 'password123',
        name: 'Ravindra Bhadur',
        role: 'Caretaker'
      },
      {
        username: 'secretary',
        password: 'password123',
        name: 'Secretary User',
        role: 'Secretary'
      },
      {
        username: 'chairman',
        password: 'password123',
        name: 'Chairman User',
        role: 'Chairman'
      },
      {
        username: 'treasurer',
        password: 'password123',
        name: 'Treasurer User',
        role: 'Treasurer'
      }
    ];

    await User.insertMany(users);
    console.log('✅ Users Seeded Successfully');
    process.exit();
  } catch (err) {
    console.error('❌ Error seeding users:', err.message);
    process.exit(1);
  }
};

seedUsers();
