// src/services/database.js
import { 
  collection, query, where, getDocs,
  orderBy, limit, doc
} from 'firebase/firestore';
import { db } from '../firebase';

export const searchUsers = async (searchTerm) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('displayName_lower', '>=', searchTerm.toLowerCase()),
      where('displayName_lower', '<=', searchTerm.toLowerCase() + '\uf8ff'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

export const getRecentChats = async (userId, limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'chats'),
      where(`users.${userId}`, '==', true),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      otherUserId: Object.keys(doc.data().users).find(id => id !== userId)
    }));
  } catch (error) {
    console.error('Error getting recent chats:', error);
    throw error;
  }
};