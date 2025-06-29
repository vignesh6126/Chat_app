// src/services/userService.js
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function createUserProfile(user) {
  try {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName: user.displayName || `User${Math.random().toString(36).substring(7)}`,
      displayName_lower: (user.displayName || '').toLowerCase(),
      email: user.email,
      photoURL: user.photoURL || '',
      status: 'online',
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function updateUserStatus(userId, status) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status,
      lastSeen: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
}