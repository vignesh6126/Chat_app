import { useState, useEffect, useRef } from 'react';
import { 
  doc, collection, onSnapshot, query, orderBy, serverTimestamp, setDoc 
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  Box, TextField, Avatar, List, ListItem, ListItemAvatar, ListItemText,
  Typography, Paper, Divider, IconButton, Badge, CircularProgress, Tooltip
} from '@mui/material';
import { Send, Info, People } from '@mui/icons-material';

const GroupChatRoom = ({ roomId, currentUser, roomName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Fetch messages and members
  useEffect(() => {
    if (!roomId) return;

    setLoading(true);

    // Messages listener
    const messagesUnsub = onSnapshot(
      query(
        collection(db, 'rooms', roomId, 'messages'),
        orderBy('timestamp', 'asc')
      ),
      (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        })));
        setLoading(false);
      }
    );

    // Room members listener
    const roomUnsub = onSnapshot(doc(db, 'rooms', roomId), async (doc) => {
      if (doc.exists()) {
        const memberIds = doc.data().members || [];
        const membersData = await Promise.all(
          memberIds.map(async userId => {
            const userDoc = await getDoc(doc(db, 'users', userId));
            return userDoc.exists() ? { uid: userId, ...userDoc.data() } : null;
          })
        );
        setMembers(membersData.filter(Boolean));
      }
    });

    return () => {
      messagesUnsub();
      roomUnsub();
    };
  }, [roomId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await setDoc(doc(collection(db, 'rooms', roomId, 'messages')), {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderPhotoURL: currentUser.photoURL,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (date) => date?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Room header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 2, 
        bgcolor: 'primary.main', 
        color: 'white'
      }}>
        <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
          <People />
        </Avatar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>{roomName}</Typography>
        <Tooltip title="Room info">
          <IconButton onClick={() => setShowInfo(!showInfo)} color="inherit">
            <Info />
          </IconButton>
        </Tooltip>
        <Badge 
          badgeContent={members.length} 
          color="secondary" 
          sx={{ mr: 1 }}
        >
          <People />
        </Badge>
      </Box>

      {/* Room info panel */}
      {showInfo && (
        <Paper sx={{ m: 2, p: 2 }}>
          <Typography variant="subtitle1">Members</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {members.map(member => (
              <Chip
                key={member.uid}
                avatar={<Avatar src={member.photoURL} />}
                label={member.displayName}
                variant="outlined"
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Messages area */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {messages.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
            No messages yet. Say hello!
          </Typography>
        ) : (
          <List>
            {messages.map(msg => (
              <ListItem key={msg.id} sx={{ 
                justifyContent: msg.senderId === currentUser.uid ? 'flex-end' : 'flex-start',
                px: 1,
                py: 0.5
              }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: msg.senderId === currentUser.uid ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 1,
                  maxWidth: '75%'
                }}>
                  {msg.senderId !== currentUser.uid && (
                    <Tooltip title={msg.senderName}>
                      <Avatar src={msg.senderPhotoURL} sx={{ width: 32, height: 32 }} />
                    </Tooltip>
                  )}
                  <Paper sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: msg.senderId === currentUser.uid ? 'primary.main' : 'background.paper',
                    color: msg.senderId === currentUser.uid ? 'primary.contrastText' : 'text.primary'
                  }}>
                    {msg.senderId !== currentUser.uid && (
                      <Typography variant="caption" fontWeight="bold">
                        {msg.senderName}
                      </Typography>
                    )}
                    <Typography>{msg.text}</Typography>
                    <Typography variant="caption" display="block" textAlign="right">
                      {formatTime(msg.timestamp)}
                    </Typography>
                  </Paper>
                </Box>
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      {/* Message input */}
      <Box component="form" onSubmit={sendMessage} sx={{ p: 2, borderTop: '1px solid #ddd' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <IconButton 
            type="submit" 
            color="primary" 
            disabled={!newMessage.trim()}
            sx={{ bgcolor: 'primary.main', color: 'white' }}
          >
            <Send />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default GroupChatRoom;