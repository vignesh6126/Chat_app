// src/services/dataService.js
import { 
  collection, query, where, getDocs,
  orderBy, limit, onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';

export async function getUserChats(userId) {
  const q = query(
    collection(db, 'chats'),
    where(`users.${userId}`, '==', true),
    orderBy('updatedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    otherUserId: Object.keys(doc.data().users).find(id => id !== userId)
  }));
}

export function listenForUserChats(userId, callback) {
  const q = query(
    collection(db, 'chats'),
    where(`users.${userId}`, '==', true),
    orderBy('updatedAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      otherUserId: Object.keys(doc.data().users).find(id => id !== userId)
    }));
    callback(chats);
  });
}

export function listenForMessages(chatId, callback) {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
    callback(messages);
  });
}

export function listenForRoomMessages(roomId, callback) {
  const q = query(
    collection(db, 'rooms', roomId, 'messages'),
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
    callback(messages);
  });
}