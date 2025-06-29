import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  serverTimestamp,
  setDoc,
  getDoc,
  orderBy,
  updateDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import {
  Slide,
  AppBar,
  Toolbar,
  Avatar,
  Typography,
  Button,
  Box,
  Divider,
  CssBaseline,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  GlobalStyles
} from '@mui/material';
import {
  Group as GroupIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar/Sidebar';
import PersonalChat from '../components/Chat/PersonalChat';
import ChatRoom from '../components/Chat/ChatRoom';
import ProfileEditor from '../components/Profile/ProfileEditor';
import GroupChatDialog from '../components/Group/GroupChatDialog';

const scrollbarStyles = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#888 transparent',
  '&::-webkit-scrollbar': {
    width: '4px !important',
    height: '4px !important',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent !important',
    borderRadius: '2px !important',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#888 !important',
    borderRadius: '2px !important',
    '&:hover': {
      backgroundColor: '#666 !important',
    },
  },
};

const GlobalScrollbarStyles = () => (
  <GlobalStyles styles={{
    '*::-webkit-scrollbar': {
      width: '4px !important',
      height: '4px !important',
    },
    '*::-webkit-scrollbar-thumb': {
      backgroundColor: '#888 !important',
      borderRadius: '2px !important',
    },
    '*::-webkit-scrollbar-track': {
      background: 'transparent !important',
    },
    '*': {
      scrollbarWidth: 'thin !important',
      scrollbarColor: '#888 transparent !important',
    }
  }} />
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeView, setActiveView] = useState('chat');
  const [activeChat, setActiveChat] = useState({
    type: null,
    id: null,
    otherUserId: null,
    otherUserName: null,
    otherUserPhoto: null,
    name: null
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [userRooms, setUserRooms] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const handleCreateRoom = async (roomData) => {
    try {
      setGroupDialogOpen(false);
      const roomRef = await addDoc(collection(db, 'rooms'), {
        name: roomData.name,
        members: [...roomData.members, user.uid],
        createdBy: user.uid,
        isGroup: true,
        createdAt: serverTimestamp()
      });

      await Promise.all(
        [...roomData.members, user.uid].map(async (memberId) => {
          await setDoc(doc(db, 'user_rooms', `${memberId}_${roomRef.id}`), {
            userId: memberId,
            roomId: roomRef.id,
            roomName: roomData.name,
            isGroup: true,
            joinedAt: serverTimestamp()
          });
        })
      );

      setActiveChat({
        type: 'room',
        id: roomRef.id,
        name: roomData.name,
        otherUserId: null,
        otherUserName: null,
        otherUserPhoto: null
      });

      showSnackbar('Group created successfully!', 'success');
    } catch (error) {
      console.error("Room creation error:", error);
      showSnackbar('Failed to create group: ' + error.message, 'error');
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) throw new Error('Room not found');

      const roomData = roomSnap.data();
      if (!roomData.members.includes(user.uid)) {
        await updateDoc(roomRef, {
          members: [...roomData.members, user.uid]
        });
      }

      await setDoc(doc(db, 'user_rooms', `${user.uid}_${roomId}`), {
        userId: user.uid,
        roomId,
        roomName: roomData.name,
        isGroup: true,
        joinedAt: serverTimestamp()
      });

      setActiveChat({
        type: 'room',
        id: roomId,
        name: roomData.name,
        otherUserId: null,
        otherUserName: null,
        otherUserPhoto: null
      });

      showSnackbar(`Joined ${roomData.name} successfully!`, 'success');
    } catch (error) {
      console.error("Join room error:", error);
      showSnackbar(error.message || 'Failed to join room', 'error');
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setLoading(true);
      if (!currentUser) {
        navigate('/login');
      } else {
        setUser(currentUser);
        setupUserRoomsListener(currentUser.uid);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [navigate]);

  const setupUserRoomsListener = (userId) => {
    const q = query(
      collection(db, 'user_rooms'),
      where('userId', '==', userId)
    );
    return onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id.split('_')[1],
        ...doc.data()
      }));
      setUserRooms(rooms);
    });
  };

  const searchUsers = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const term = searchTerm.toLowerCase();
      const usersRef = collection(db, 'users');
      const nameQuery = query(
        usersRef,
        where('displayName_lower', '>=', term),
        where('displayName_lower', '<=', term + '\uf8ff')
      );
      const emailQuery = query(
        usersRef,
        where('email', '==', term)
      );
      const [nameSnapshot, emailSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(emailQuery)
      ]);
      const results = [
        ...nameSnapshot.docs.map(doc => ({
          id: doc.id,
          uid: doc.data().uid,
          displayName: doc.data().displayName,
          email: doc.data().email,
          photoURL: doc.data().photoURL
        })),
        ...emailSnapshot.docs.map(doc => ({
          id: doc.id,
          uid: doc.data().uid,
          displayName: doc.data().displayName,
          email: doc.data().email,
          photoURL: doc.data().photoURL
        }))
      ].filter((user, index, self) =>
        index === self.findIndex(u => u.uid === user.uid) &&
        user.uid !== auth.currentUser?.uid
      );
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
      setError('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChat = async (selectedUser) => {
    setStartingChat(true);
    try {
      const chatId = [user.uid, selectedUser.uid].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          users: {
            [user.uid]: true,
            [selectedUser.uid]: true
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          userNames: {
            [user.uid]: user.displayName,
            [selectedUser.uid]: selectedUser.displayName
          },
          userPhotos: {
            [user.uid]: user.photoURL,
            [selectedUser.uid]: selectedUser.photoURL
          },
          lastMessage: null,
          lastMessageAt: null
        });

        const batch = writeBatch(db);
        [user.uid, selectedUser.uid].forEach(uid => {
          const userChatRef = doc(db, 'user_chats', `${uid}_${chatId}`);
          batch.set(userChatRef, {
            userId: uid,
            chatId,
            partnerId: uid === user.uid ? selectedUser.uid : user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        });
        await batch.commit();
      }

      setActiveChat({
        type: 'personal',
        id: chatId,
        otherUserId: selectedUser.uid,
        otherUserName: selectedUser.displayName,
        otherUserPhoto: selectedUser.photoURL
      });
      setSearchQuery('');
      setSearchResults([]);
      showSnackbar(`Chat started with ${selectedUser.displayName}`, 'success');
    } catch (error) {
      console.error("Chat creation error:", error);
      showSnackbar('Failed to start chat: ' + error.message, 'error');
    } finally {
      setStartingChat(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) searchUsers(searchQuery);
      else setSearchResults([]);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
      showSnackbar('Logged out successfully', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showSnackbar('Logout failed. Please try again.', 'error');
    }
  };

  if (loading || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <GlobalScrollbarStyles />

      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={user.photoURL} alt={user.displayName} sx={{ width: 36, height: 36 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{user.displayName}</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="text" 
              color="inherit" 
              onClick={() => setActiveView('profile')}
              sx={{ textTransform: 'none', px: 2 }}
            >
              Profile
            </Button>
            <Button
              variant="text"
              color="inherit"
              onClick={() => setGroupDialogOpen(true)}
              startIcon={<GroupIcon fontSize="small" />}
              sx={{ textTransform: 'none', px: 2 }}
            >
              New Group
            </Button>
            <Button 
              variant="text" 
              color="inherit" 
              onClick={() => setShowSidebar(prev => !prev)}
              sx={{ textTransform: 'none', px: 2 }}
            >
              {showSidebar ? 'Hide Chat' : 'Show Chat'}
            </Button>
            <Button 
              variant="text" 
              color="inherit" 
              onClick={handleLogout}
              sx={{ textTransform: 'none', px: 2 }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ 
        p: 1.5,
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            maxWidth: 600,
            '& .MuiOutlinedInput-root': {
              borderRadius: 20,
              backgroundColor: 'action.hover',
              '& fieldset': {
                border: 'none',
              },
              '&:hover': {
                backgroundColor: 'action.selected',
              },
              '&.Mui-focused': {
                backgroundColor: 'background.paper',
                boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}`,
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <IconButton 
                size="small" 
                onClick={() => setSearchQuery('')}
                sx={{ mr: -1 }}
              >
                <CloseIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </IconButton>
            ),
          }}
        />
      </Box>

      {searchQuery && (
        <Paper sx={{
          position: 'absolute',
          top: 112,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: 600,
          maxHeight: '60vh',
          overflow: 'auto',
          zIndex: 1200,
          boxShadow: 3,
          borderRadius: 2,
          ...scrollbarStyles
        }}>
          {isSearching ? (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : searchResults.length > 0 ? (
            <List sx={scrollbarStyles}>
              {searchResults.map((user) => (
                <ListItem
                  key={user.uid}
                  sx={{
                    py: 1.5,
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                  secondaryAction={
                    <Button
                      variant="contained"
                      size="small"
                      disabled={startingChat}
                      sx={{
                        borderRadius: 20,
                        textTransform: 'none',
                        fontSize: '0.8rem',
                        px: 2,
                        boxShadow: 'none',
                        '&:hover': {
                          backgroundColor: 'primary.dark'
                        }
                      }}
                      onClick={() => handleStartChat(user)}
                    >
                      {startingChat ? <CircularProgress size={20} /> : 'Message'}
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={user.photoURL} alt={user.displayName} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography fontWeight={600}>
                        {user.displayName}
                      </Typography>
                    }
                    secondary={user.email}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No users found matching "{searchQuery}"
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      <GroupChatDialog
        open={groupDialogOpen}
        onClose={() => setGroupDialogOpen(false)}
        onCreate={handleCreateRoom}
        onJoin={handleJoinRoom}
      />

      <Box sx={{ 
        display: 'flex', 
        flexGrow: 1, 
        height: 'calc(100vh - 64px)',
        overflow: 'hidden'
      }}>
        <Slide direction="right" in={activeView === 'chat' && showSidebar} mountOnEnter unmountOnExit>
          <Box sx={{ 
            width: { xs: '100%', md: 300 }, 
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            flexShrink: 0,
            height: '100%',
            display: 'flex',
            margin:0,
            flexDirection: 'column'
          }}>
            <Sidebar
              user={user}
              setActiveChat={setActiveChat}
              isVisible={showSidebar}
              userRooms={userRooms}
            />
          </Box>
        </Slide>

        <Box sx={{ 
          flexGrow: 1, 
          p: 2, 
          bgcolor: '#f5f7fa', 
          height: '100%',
          overflowY: 'auto',
          ...scrollbarStyles
        }}>
          {activeView === 'profile' ? (
            <ProfileEditor user={user} />
          ) : activeChat.type === 'room' ? (
            <ChatRoom
              roomId={activeChat.id}
              currentUser={user}
              roomName={activeChat.name}
            />
          ) : activeChat.otherUserId ? (
            <PersonalChat
              currentUser={user}
              otherUserId={activeChat.otherUserId}
              otherUserName={activeChat.otherUserName}
              otherUserPhoto={activeChat.otherUserPhoto}
            />
          ) : (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              textAlign: 'center'
            }}>
              <Typography variant="h6" color="text.secondary">
                {userRooms.length === 0 ? 'Create or join a group to start chatting!' : 'Select a chat to begin'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;