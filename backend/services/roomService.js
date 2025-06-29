const { db, fieldValue } = require('../config/firebase-admin');

class RoomService {
  static async createGroupRoom(name, creatorId, members = []) {
    const roomRef = await db.collection('rooms').add({
      name,
      type: 'group',
      createdAt: fieldValue.serverTimestamp(),
      createdBy: creatorId,
      members: [...members, creatorId],
      lastUpdated: fieldValue.serverTimestamp()
    });

    // Add all members to user_rooms
    const batch = db.batch();
    [...members, creatorId].forEach(userId => {
      const userRoomRef = db.collection('user_rooms').doc(`${userId}_${roomRef.id}`);
      batch.set(userRoomRef, {
        userId,
        roomId: roomRef.id,
        joinedAt: fieldValue.serverTimestamp()
      });
    });
    await batch.commit();

    return roomRef.id;
  }
}

module.exports = RoomService;