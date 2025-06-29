import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Tabs,
  Tab,
  IconButton,
  Typography,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  Avatar,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Group as GroupIcon,
  Lock as LockIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useState } from 'react';
import UserSearch from '../Search/UserSearch';
import { auth } from '../../firebase';

const GroupChatDialog = ({ open, onClose, onCreate, onJoin }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [creatingRoom, setCreatingRoom] = useState(false);

  const handleUserSelect = (user) => {
    setSelectedUsers(prev => {
      const exists = prev.some(u => u.uid === user.uid);
      return exists ? prev : [...prev, user];
    });
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(prev => prev.filter(user => user.uid !== userId));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!roomName) return;

    setCreatingRoom(true);
    try {
      const memberIds = selectedUsers.map(user => user.uid);
      memberIds.push(auth.currentUser.uid);

      const roomData = {
        name: roomName,
        members: memberIds,
        isGroup: true,
        createdBy: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      };

      if (roomId) {
        roomData.customId = roomId;
      }

      await onCreate(roomData);
      
      setRoomName('');
      setRoomId('');
      setSelectedUsers([]);
      onClose();
    } catch (error) {
      console.error("Error creating room:", error);
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!roomId) return;
    onJoin(roomId);
    setRoomId('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          background: 'linear-gradient(to bottom, #ffffff, #f9f9f9)'
        }
      }}
    >
      {/* Header with close button */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        background: 'linear-gradient(to right, #4a6cf7, #6a5acd)',
        color: 'white'
      }}>
        <DialogTitle sx={{ 
          p: 0, 
          fontSize: '1.5rem', 
          fontWeight: 600,
          color: 'white'
        }}>
          <GroupIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Group Chats
        </DialogTitle>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Tabs for Create/Join */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        sx={{
          '& .MuiTabs-indicator': {
            height: 3,
            background: 'linear-gradient(to right, #4a6cf7, #6a5acd)'
          }
        }}
      >
        <Tab label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon fontSize="small" /> Create Room
          </Box>
        } sx={{ fontWeight: 600, textTransform: 'none' }} />
        <Tab label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckIcon fontSize="small" /> Join Room
          </Box>
        } sx={{ fontWeight: 600, textTransform: 'none' }} />
      </Tabs>

      <DialogContent sx={{ p: 3 }}>
        {activeTab === 0 ? (
          <Box component="form" onSubmit={handleCreateSubmit}>
            {/* Room Creation Form */}
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
              New Group Chat
            </Typography>
            
            <TextField
              fullWidth
              label="Room Name *"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              margin="normal"
              variant="outlined"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <GroupIcon color="action" />
                  </InputAdornment>
                )
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': {
                    borderColor: '#e0e0e0'
                  },
                  '&:hover fieldset': {
                    borderColor: '#4a6cf7'
                  }
                }
              }}
            />
            
            <TextField
              fullWidth
              label="Custom Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              margin="normal"
              variant="outlined"
              helperText="Optional - leave blank for auto-generated ID"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                )
              }}
              sx={{ mb: 3 }}
            />
            
            {/* Participant Selection */}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Add Participants
            </Typography>
            
            {/* Selected Users Chips */}
            {selectedUsers.length > 0 && (
              <Paper elevation={0} sx={{ 
                p: 2, 
                mb: 2,
                borderRadius: '8px', 
                border: '1px solid #e0e0e0',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1
              }}>
                {selectedUsers.map(user => (
                  <Chip
                    key={user.uid}
                    avatar={<Avatar src={user.photoURL} alt={user.displayName} />}
                    label={user.displayName}
                    onDelete={() => handleRemoveUser(user.uid)}
                    sx={{
                      borderRadius: '6px',
                      background: '#f0f4ff',
                      '& .MuiChip-deleteIcon': {
                        color: '#4a6cf7'
                      }
                    }}
                  />
                ))}
              </Paper>
            )}
            
            {/* User Search Section */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <SearchIcon fontSize="small" sx={{ mr: 1 }} />
                Search and select users to add to the group
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <UserSearch 
                currentUser={auth.currentUser} 
                onSelectUser={handleUserSelect}
                buttonText="Add to Group"
              />
            </Box>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleJoinSubmit}>
            {/* Join Room Form */}
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
              Join Existing Group
            </Typography>
            
            <TextField
              fullWidth
              label="Room ID *"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              margin="normal"
              variant="outlined"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                )
              }}
              sx={{ mb: 3 }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button
          onClick={onClose}
          sx={{
            textTransform: 'none',
            px: 3,
            borderRadius: '8px',
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          onClick={activeTab === 0 ? handleCreateSubmit : handleJoinSubmit}
          disabled={activeTab === 0 ? !roomName || creatingRoom : !roomId}
          sx={{
            textTransform: 'none',
            px: 3,
            borderRadius: '8px',
            background: 'linear-gradient(to right, #4a6cf7, #6a5acd)',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 10px rgba(74, 108, 247, 0.5)'
            },
            '&:disabled': {
              background: '#e0e0e0'
            }
          }}
          disableElevation
        >
          {creatingRoom ? (
            <>
              <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
              Creating...
            </>
          ) : activeTab === 0 ? (
            'Create Room'
          ) : (
            'Join Room'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupChatDialog;