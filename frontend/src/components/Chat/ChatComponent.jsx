import { useEffect, useState } from 'react';
import { listenForUserChats, listenForMessages } from '../../services/dataService';
import { sendMessage } from '../../services/chatService';

// Add these Material-UI components for better UI
import {
  Box,
  List,
  ListItem,
  ListItemText,
  TextField,
  IconButton,
  Avatar,
  Typography
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const ChatComponent = ({ userId, chatId, otherUserId }) => { // Added otherUserId prop
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const unsubscribeChats = listenForUserChats(userId, (chats) => {
      setChats(chats);
    });
    
    return () => unsubscribeChats();
  }, [userId]);

  useEffect(() => {
    if (!chatId) return;
    
    const unsubscribeMessages = listenForMessages(chatId, (messages) => {
      setMessages(messages);
    });
    
    return () => unsubscribeMessages();
  }, [chatId]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    try {
      await sendMessage(chatId, userId, otherUserId, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #ddd' }}>
        <Typography variant="h6">Chat</Typography>
      </Box>

      {/* Messages List */}
      <List sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {messages.map((message) => (
          <ListItem 
            key={message.id}
            sx={{
              justifyContent: message.senderId === userId ? 'flex-end' : 'flex-start',
              alignItems: 'flex-start'
            }}
          >
            {message.senderId !== userId && (
              <Avatar sx={{ mr: 1 }} />
            )}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: message.senderId === userId ? 'primary.main' : 'grey.100',
                color: message.senderId === userId ? 'white' : 'text.primary',
                maxWidth: '70%'
              }}
            >
              <ListItemText primary={message.text} />
              <Typography variant="caption" sx={{ 
                display: 'block',
                textAlign: 'right',
                color: message.senderId === userId ? 'primary.light' : 'text.secondary'
              }}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
          </ListItem>
        ))}
      </List>

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: '1px solid #ddd' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <IconButton 
            color="primary" 
            onClick={handleSend}
            disabled={!newMessage.trim()}
            sx={{ ml: 1 }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatComponent;