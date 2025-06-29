// components/Chat/ChatRoom.jsx
import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  List,
  ListItem,
  Paper,
  CircularProgress
} from '@mui/material';
import { Send, ArrowBack } from '@mui/icons-material';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  serverTimestamp,
  orderBy,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../firebase';

const ChatRoom = ({ roomId, currentUser, roomName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    console.log('Room Messages Path:', `rooms/${roomId}/messages`);
    console.log('Current Messages:', messages);
    if (!roomId) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'rooms', roomId, 'messages'),
        orderBy('createdAt', 'asc')
      ),
      (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(msgs);
        setLoading(false);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      // Add message to subcollection
      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        createdAt: serverTimestamp()
      });

      // Update room's last message
      await updateDoc(doc(db, 'rooms', roomId), {
        lastMessage: newMessage,
        lastMessageAt: serverTimestamp()
      });

      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
        <Typography variant="h6">{roomName}</Typography>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <List>
          {messages.map((msg) => (
            <ListItem key={msg.id} sx={{
              justifyContent: msg.senderId === currentUser.uid ? 'flex-end' : 'flex-start',
              px: 1,
              py: 0.5
            }}>
              <Paper sx={{
                p: 1.5,
                bgcolor: msg.senderId === currentUser.uid ? 'primary.light' : 'background.paper',
                borderRadius: 2,
                maxWidth: '70%'
              }}>
                <Typography>{msg.text}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {msg.senderId === currentUser.uid ? 'You' : msg.senderName}
                </Typography>
              </Paper>
            </ListItem>
          ))}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: '1px solid #ddd' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Send />
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatRoom;