require('dotenv').config();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

// Load service account key path from .env
const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH || './config/serviceAccountKey.json';

// Parse JSON key securely
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const adminDb = getFirestore();
module.exports = adminDb;
