import { useState, useEffect } from 'react';
import { 
  Box, Typography, List, ListItemButton, ListItemText, 
  Collapse, Divider, Avatar, ListItemAvatar, 
  CircularProgress, Badge, Chip, IconButton, Tooltip, 
  TextField, InputAdornment, Button
} from '@mui/material';
import { 
  ExpandLess, ExpandMore, Person, Group, 
  Add, Search, Refresh 
} from '@mui/icons-material';
import { 
  doc, getDoc, collection, query, 
  where, onSnapshot, orderBy, limit, getDocs
} from 'firebase/firestore';
import { db } from '../../firebase';

const scrollbarStyles = {
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#c1c1c1',
    borderRadius: '3px',
    '&:hover': {
      backgroundColor: '#a8a8a8',
    },
  },
  scrollbarWidth: 'thin',
  scrollbarColor: '#c1c1c1 transparent',
};

const Sidebar = ({ user, setActiveChat, isVisible, userRooms }) => {
  const [openPersonal, setOpenPersonal] = useState(true);
  const [openGroup, setOpenGroup] = useState(true);
  const [chatPartners, setChatPartners] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState({
    personal: true,
    groups: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  // Fetch personal chats
  useEffect(() => {
    if (!user?.uid || !isVisible) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'chats'),
        where(`users.${user.uid}`, '==', true),
        orderBy('updatedAt', 'desc')
      ),
      async (snapshot) => {
        try {
          const partnersPromises = snapshot.docs.map(async (chatDoc) => {
            const chatData = chatDoc.data();
            const partnerId = Object.keys(chatData.users).find(id => id !== user.uid);
            
            if (!partnerId) return null;

            const userDoc = await getDoc(doc(db, 'users', partnerId));
            if (!userDoc.exists()) return null;

            // Get last message
            let lastMessage = null;
            try {
              const messagesQuery = query(
                collection(db, 'messages'),
                where('chatId', '==', chatDoc.id),
                orderBy('createdAt', 'desc'),
                limit(1)
              );
              const messageSnapshot = await getDocs(messagesQuery);
              lastMessage = messageSnapshot.empty ? null : messageSnapshot.docs[0].data();
            } catch (err) {
              console.error("Error loading messages:", err);
            }

            return {
              id: partnerId,
              chatId: chatDoc.id,
              ...userDoc.data(),
              lastMessage: lastMessage?.text || null,
              lastMessageAt: lastMessage?.createdAt || chatData.updatedAt
            };
          });

          const partners = (await Promise.all(partnersPromises)).filter(Boolean);
          setChatPartners(partners);
          setLoading(prev => ({ ...prev, personal: false }));
          setError(null);
        } catch (err) {
          console.error("Error processing chats:", err);
          setError("Failed to load chats");
          setLoading(prev => ({ ...prev, personal: false }));
        }
      },
      (err) => {
        console.error("Listener error:", err);
        setError("Connection error");
        setLoading(prev => ({ ...prev, personal: false }));
      }
    );

    return () => unsubscribe();
  }, [user?.uid, isVisible]);

  // Fetch group rooms
  useEffect(() => {
    if (!userRooms?.length || !isVisible) {
      setLoading(prev => ({ ...prev, groups: false }));
      return;
    }

    const roomIds = userRooms.map(ur => ur.roomId);
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'rooms'),
        where('__name__', 'in', roomIds)
      ),
      (snapshot) => {
        try {
          setRooms(snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            memberCount: doc.data().members?.length || 0
          })));
          setLoading(prev => ({ ...prev, groups: false }));
          setError(null);
        } catch (err) {
          console.error("Error processing rooms:", err);
          setError("Failed to load groups");
          setLoading(prev => ({ ...prev, groups: false }));
        }
      },
      (err) => {
        console.error("Listener error:", err);
        setError("Connection error");
        setLoading(prev => ({ ...prev, groups: false }));
      }
    );

    return () => unsubscribe();
  }, [userRooms, isVisible]);

  const handleRefresh = async () => {
    setLoading({ personal: true, groups: true });
    setChatPartners([]);
    setRooms([]);
  };

  // Filter chats based on search query
  const filteredPartners = chatPartners.filter(partner => 
    partner.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isVisible) return null;

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      margin:0,
      padding: 0,
      borderRight: '1px solid rgba(0, 0, 0, 0.08)'
    }}>
      {/* Header Section */}
      <Box sx={{ 
        p: 2,
        flexShrink: 0,
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          gap: 1
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
            Chats
          </Typography>
          <Tooltip title="Refresh chats">
            <IconButton size="small" onClick={handleRefresh} sx={{ color: 'text.secondary' }}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            sx: { 
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
        />

        {/* Error Display */}
        {error && (
          <Box sx={{ 
            backgroundColor: 'error.light', 
            color: 'error.contrastText',
            p: 1,
            mt: 2,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="body2">{error}</Typography>
            <Button 
              size="small" 
              color="inherit"
              onClick={handleRefresh}
            >
              Retry
            </Button>
          </Box>
        )}
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ 
        flexGrow: 1,
        overflowY: 'auto',
        p: 2,
        ...scrollbarStyles
      }}>
        {/* Personal Chats Section */}
        <List disablePadding>
          <ListItemButton 
            onClick={() => setOpenPersonal(!openPersonal)}
            sx={{ 
              borderRadius: 1,
              px: 1,
              '&:hover': { 
                backgroundColor: 'action.hover',
                '& .MuiListItemText-primary': {
                  color: 'primary.main'
                }
              }
            }}
          >
            <Person sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
            <ListItemText 
              primary="Direct Messages" 
              primaryTypographyProps={{ 
                fontWeight: 600,
                color: 'text.primary'
              }}
            />
            <Chip 
              label={filteredPartners.length} 
              size="small" 
              color="primary"
              variant="outlined"
              sx={{ borderRadius: 1 }}
            />
            {openPersonal ? <ExpandLess color="primary" /> : <ExpandMore color="primary" />}
          </ListItemButton>
          
          <Collapse in={openPersonal} timeout="auto" unmountOnExit>
            {loading.personal ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : filteredPartners.length === 0 ? (
              <Typography variant="body2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
                {searchQuery ? 'No matching contacts' : 'No direct messages'}
              </Typography>
            ) : (
              <List disablePadding sx={{ pl: 1 }}>
                {filteredPartners.map(partner => (
                  <ListItemButton 
                    key={partner.id}
                    onClick={() => setActiveChat({
                      type: 'personal',
                      id: partner.chatId,
                      otherUserId: partner.id,
                      otherUserName: partner.displayName,
                      otherUserPhoto: partner.photoURL
                    })}
                    sx={{ 
                      borderRadius: 1, 
                      my: 0.5,
                      px: 1,
                      '&:hover': { 
                        backgroundColor: 'action.hover',
                        '& .MuiListItemText-primary': {
                          color: 'primary.main'
                        }
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color={partner.isOnline ? 'success' : 'default'}
                      >
                        <Avatar 
                          src={partner.photoURL} 
                          alt={partner.displayName}
                          sx={{ width: 36, height: 36 }}
                        />
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={
                        <Typography noWrap fontWeight={500}>
                          {partner.displayName}
                        </Typography>
                      } 
                      secondary={
                        <Typography noWrap variant="body2" color="text.secondary">
                          {partner.lastMessage || partner.email}
                        </Typography>
                      } 
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Collapse>
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Group Chats Section */}
        <List disablePadding>
          <ListItemButton 
            onClick={() => setOpenGroup(!openGroup)}
            sx={{ 
              borderRadius: 1,
              px: 1,
              '&:hover': { 
                backgroundColor: 'action.hover',
                '& .MuiListItemText-primary': {
                  color: 'secondary.main'
                }
              }
            }}
          >
            <Group sx={{ mr: 1, fontSize: 20, color: 'secondary.main' }} />
            <ListItemText 
              primary="Group Chats" 
              primaryTypographyProps={{ 
                fontWeight: 600,
                color: 'text.primary'
              }}
            />
            <Chip 
              label={filteredRooms.length} 
              size="small" 
              color="secondary"
              variant="outlined"
              sx={{ borderRadius: 1 }}
            />
            {openGroup ? <ExpandLess color="secondary" /> : <ExpandMore color="secondary" />}
          </ListItemButton>
          
          <Collapse in={openGroup} timeout="auto" unmountOnExit>
            {loading.groups ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : filteredRooms.length === 0 ? (
              <Typography variant="body2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
                {searchQuery ? 'No matching groups' : 'No group chats'}
              </Typography>
            ) : (
              <List disablePadding sx={{ pl: 1 }}>
                {filteredRooms.map(room => (
                  <ListItemButton 
                    key={room.id}
                    
                    onClick={() => setActiveChat({
                      type: 'room',
                      id: room.id,
                      name: room.name
                    })}
                    sx={{ 
                      borderRadius: 1, 
                      my: 0.5,
                      px: 1,
                      '&:hover': { 
                        backgroundColor: 'action.hover',
                        '& .MuiListItemText-primary': {
                          color: 'secondary.main'
                        }
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: 'secondary.light', 
                          width: 36, 
                          height: 36,
                          color: 'secondary.contrastText'
                        }}
                      >
                        <Group fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={
                        <Typography noWrap fontWeight={500}>
                          {room.name}
                        </Typography>
                      } 
                      secondary={
                        <Typography noWrap variant="body2" color="text.secondary">
                          {room.memberCount} members • {room.createdBy === user.uid ? 'Owner' : 'Member'}
                        </Typography>
                      } 
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Collapse>
        </List>
      </Box>
    </Box>
  );
};

export default Sidebar;