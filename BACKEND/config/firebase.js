const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
let bucket = null;

try {
  const serviceAccount = require(serviceAccountPath);
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'society-management-ddabb.firebasestorage.app'
    });
    console.log('✅ Firebase Admin Initialized with Service Account');
  }
  bucket = admin.storage().bucket();
} catch (error) {
  console.warn('⚠️ Firebase initialization skipped: serviceAccountKey.json not found or invalid.');
  // Fallback to env vars if file is missing (optional, but keep it robust)
  const envConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  if (envConfig.projectId && envConfig.clientEmail && envConfig.privateKey) {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(envConfig),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'society-management-ddabb.firebasestorage.app'
        });
        console.log('✅ Firebase Admin Initialized with Env Variables');
      }
      bucket = admin.storage().bucket();
    } catch (envError) {
      console.error('❌ Firebase Env Initialization Error:', envError.message);
    }
  }
}

module.exports = { admin, bucket };
