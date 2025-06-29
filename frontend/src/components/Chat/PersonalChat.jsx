import { useEffect, useState } from 'react';
import socket from '../../socket';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Stack,
  Badge,
  CircularProgress,
  Paper
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  setDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../firebase';

const PersonalChat = ({
  currentUser,
  otherUserId,
  otherUserName,
  otherUserPhoto
}) => {
  // State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatId, setChatId] = useState('');

  // Debug initial props
  useEffect(() => {
    console.log('[Mount] Component mounted with:', {
      currentUser: currentUser?.uid,
      otherUserId,
      chatId
    });
  }, []);

  // Main chat effect
  useEffect(() => {
    console.group('[Chat Init]');
    
    // Validate inputs
    if (!currentUser?.uid || !otherUserId) {
      const errorMsg = !currentUser?.uid 
        ? 'Current user not authenticated' 
        : 'Missing recipient user ID';
      console.error('Validation failed:', errorMsg);
      setError(errorMsg);
      setLoading(false);
      console.groupEnd();
      return;
    }

    // Generate chatId immediately
    const newChatId = [currentUser.uid, otherUserId].sort().join('_');
    console.log('Generated chatId:', newChatId);
    setChatId(newChatId);
    setLoading(true);

    let unsubscribe = null;

    const loadChat = async () => {
      try {
        console.log('Accessing Firestore for chat:', newChatId);
        const chatRef = doc(db, 'chats', newChatId);
        
        // Create chat if doesn't exist
        const chatSnap = await getDoc(chatRef);
        if (!chatSnap.exists()) {
          console.log('Creating new chat document');
          await setDoc(chatRef, {
            users: {
              [currentUser.uid]: true,
              [otherUserId]: true
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }

        // Set up messages listener
        const q = query(
          collection(db, 'chats', newChatId, 'messages'),
          orderBy('timestamp', 'asc')
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({
            id: doc.id,
            from: doc.data().senderId,
            message: doc.data().text,
            timestamp: doc.data().timestamp?.toDate()?.getTime() || Date.now()
          }));
          console.log('Received messages:', msgs.length);
          setMessages(msgs);
          setLoading(false);
        }, (err) => {
          console.error('Listener error:', err);
          setError('Realtime connection failed');
          setLoading(false);
        });

      } catch (err) {
        console.error('Firestore error:', {
          code: err.code,
          message: err.message
        });
        setError('Failed to load messages');
        setLoading(false);
      }
    };

    loadChat();

    return () => {
      console.log('Cleaning up listeners');
      unsubscribe?.();
      console.groupEnd();
    };
  }, [currentUser, otherUserId]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !chatId) {
      console.warn('Cannot send - empty message or missing chatId');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const msgData = {
      senderId: currentUser.uid,
      receiverId: otherUserId,
      text: trimmed,
      timestamp: serverTimestamp(),
    };

    // Optimistic update
    setMessages(prev => [...prev, {
      id: tempId,
      from: currentUser.uid,
      message: trimmed,
      timestamp: Date.now()
    }]);

    try {
      // Update chat metadata
      await setDoc(doc(db, 'chats', chatId), {
        lastMessage: {
          text: trimmed,
          senderId: currentUser.uid,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Add message
      const docRef = await addDoc(
        collection(db, 'chats', chatId, 'messages'), 
        msgData
      );
      console.log('Message saved with ID:', docRef.id);

      // Socket notification
      socket.emit('sendMessage', {
        ...msgData,
        id: docRef.id,
        chatId,
      });

      setInput('');
    } catch (err) {
      console.error('Send failed:', err);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setError('Failed to send message');
    }
  };

  // Render states
  if (error) {
    return (
      <Paper elevation={0} sx={{ 
        p: 3, 
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default'
      }}>
        <Typography color="error" variant="h6">
          {error} (Check console for details)
        </Typography>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper elevation={0} sx={{ 
        p: 3, 
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default'
      }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading conversation...
        </Typography>
      </Paper>
    );
  }

  // Main chat UI
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      bgcolor: 'background.default'
    }}>
      {/* Header */}
      <Box sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          color="success"
        >
          <Avatar 
            src={otherUserPhoto || `https://ui-avatars.com/api/?name=${otherUserName || 'User'}`} 
            sx={{ width: 48, height: 48 }}
          />
        </Badge>
        <Box sx={{ ml: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            {otherUserName || `User (${otherUserId})`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Online
          </Typography>
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{
        flexGrow: 1,
        p: 2,
        overflowY: 'auto',
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
      }}>
        <Stack spacing={1.5}>
          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: msg.from === currentUser.uid ? 'flex-end' : 'flex-start',
              }}
            >
              {msg.from !== currentUser.uid && (
                <Avatar 
                  src={otherUserPhoto}
                  sx={{ width: 32, height: 32, mr: 1, alignSelf: 'flex-end' }}
                />
              )}
              <Box
                sx={{
                  maxWidth: '75%',
                  p: 1.5,
                  borderRadius: 4,
                  bgcolor: msg.from === currentUser.uid ? 'primary.main' : 'background.paper',
                  color: msg.from === currentUser.uid ? 'primary.contrastText' : 'text.primary',
                  boxShadow: 1,
                }}
              >
                <Typography variant="body1">
                  {msg.message}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
              {msg.from === currentUser.uid && (
                <Avatar 
                  src={currentUser.photoURL}
                  sx={{ width: 32, height: 32, ml: 1, alignSelf: 'flex-end' }}
                />
              )}
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Input */}
      <Box sx={{ 
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            multiline
            maxRows={4}
          />
          <IconButton 
            color="primary" 
            onClick={handleSend} 
            disabled={!input.trim()}
            sx={{ ml: 1 }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default PersonalChat;