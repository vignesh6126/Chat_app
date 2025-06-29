const admin = require('firebase-admin');
const serviceAccount = require('../config/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  ignoreUndefinedProperties: true // This will handle any undefined fields
});

const db = admin.firestore();

async function initializeSampleData() {
  try {
    // Get existing users
    const usersSnapshot = await db.collection('users').get();
    const existingUsers = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      displayName: doc.data().displayName || 'User',
      photoURL: doc.data().photoURL || 'https://ui-avatars.com/api/?name=U'
    })).filter(user => user.uid); // Filter out any invalid entries

    if (existingUsers.length === 0) {
      console.log("No existing users found");
      return;
    }

    console.log("Found users:", existingUsers.map(u => u.displayName));

    // Create a sample room
    const roomRef = await db.collection('rooms').add({
      name: "General Chat",
      description: "Main group chat",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: existingUsers[0].uid,
      members: existingUsers.map(u => u.uid),
      isGroup: true,
      photoURL: "https://example.com/group-avatar.jpg"
    });

    console.log(`Created room: ${roomRef.id}`);

    // Add sample messages
    const messages = [
      {
        senderId: existingUsers[0].uid,
        text: "Hello everyone!",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        senderName: existingUsers[0].displayName,
        senderPhotoURL: existingUsers[0].photoURL
      },
      {
        senderId: existingUsers[1]?.uid,
        text: "Hi there!",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        senderName: existingUsers[1]?.displayName || "User",
        senderPhotoURL: existingUsers[1]?.photoURL || 'https://ui-avatars.com/api/?name=U'
      }
    ].filter(m => m.senderId); // Only keep messages with valid senders

    // Batch write messages
    const batch = db.batch();
    const messagesRef = roomRef.collection('messages');
    messages.forEach(message => {
      const docRef = messagesRef.doc();
      batch.set(docRef, message);
    });
    await batch.commit();

    console.log(`Added ${messages.length} messages`);

    // Create user_room entries
    const userRoomsBatch = db.batch();
    const userRoomsRef = db.collection('user_rooms');
    existingUsers.forEach(user => {
      const docRef = userRoomsRef.doc();
      userRoomsBatch.set(docRef, {
        userId: user.uid,
        roomId: roomRef.id,
        lastRead: user.uid === existingUsers[0].uid ? admin.firestore.FieldValue.serverTimestamp() : null
      });
    });
    await userRoomsBatch.commit();

    console.log(`Created ${existingUsers.length} user_room entries`);
    console.log("Initialization completed successfully!");

  } catch (error) {
    console.error("Initialization failed:", error);
  }
}

initializeSampleData();