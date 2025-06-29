// src/services/chatService.js
import { 
  doc, setDoc, collection, addDoc, 
  serverTimestamp, updateDoc, getDoc 
} from 'firebase/firestore';
import { db } from '../firebase';

export async function getOrCreateChat(currentUserId, otherUserId) {
  const chatId = [currentUserId, otherUserId].sort().join('_');
  
  try {
    // Check if chat already exists
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        users: {
          [currentUserId]: true,
          [otherUserId]: true
        },
        lastMessage: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return chatId;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
}

export async function sendMessage(chatId, senderId, receiverId, text) {
  try {
    // 1. Add message to subcollection
    const messageRef = await addDoc(
      collection(db, 'chats', chatId, 'messages'), 
      {
        senderId,
        receiverId,
        text,
        timestamp: serverTimestamp(),
        status: 'sent'
      }
    );

    // 2. Update chat's last message
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: {
        text,
        senderId,
        timestamp: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    return messageRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export async function markMessagesAsRead(chatId, userId) {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(
      messagesRef,
      where('receiverId', '==', userId),
      where('status', '==', 'sent')
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.forEach((doc) => {
      batch.update(doc.ref, { status: 'read' });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
}