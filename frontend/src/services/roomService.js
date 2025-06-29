// src/services/roomService.js
import { 
  doc, setDoc, collection, serverTimestamp,
  updateDoc, arrayUnion, writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

export async function createRoom(creatorId, roomName, description = '', members = []) {
  const roomRef = doc(collection(db, 'rooms'));
  
  await setDoc(roomRef, {
    id: roomRef.id,
    name: roomName,
    description,
    creator: creatorId,
    members: {
      [creatorId]: true,
      ...members.reduce((acc, memberId) => ({ ...acc, [memberId]: true }), {})
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return roomRef.id;
}

export async function addRoomMembers(roomId, members) {
  try {
    const updates = {};
    members.forEach(memberId => {
      updates[`members.${memberId}`] = true;
    });

    await updateDoc(doc(db, 'rooms', roomId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding room members:', error);
    throw error;
  }
}

export async function sendRoomMessage(roomId, senderId, text) {
  try {
    // 1. Add message to subcollection
    await addDoc(collection(db, 'rooms', roomId, 'messages'), {
      senderId,
      text,
      timestamp: serverTimestamp()
    });

    // 2. Update room's last activity
    await updateDoc(doc(db, 'rooms', roomId), {
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error sending room message:', error);
    throw error;
  }
}