const { serverTimestamp } = require('firebase-admin/firestore');
const db = require('./firebase');

async function setupFirestore() {
  try {
    // Create a room
    await db.collection('rooms').doc('room1').set({
      name: "General Chat",
      createdAt: serverTimestamp(),
      createdBy: "admin",
      members: ["user1", "user2"],
      isPrivate: false
    });
    console.log("Firestore setup complete!");
  } catch (e) {
    console.error("Error:", e);
  }
}

setupFirestore();