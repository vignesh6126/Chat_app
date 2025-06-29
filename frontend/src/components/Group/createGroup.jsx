import { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Chip, 
  Avatar, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Checkbox,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

function CreateGroup({ onGroupCreated, onClose }) {
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all users except current user
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '!=', auth.currentUser.uid));
        const snapshot = await getDocs(q);
        
        setAvailableUsers(snapshot.docs.map(doc => ({
          id: doc.id,
          uid: doc.data().uid, // Make sure to include uid
          displayName: doc.data().displayName,
          email: doc.data().email,
          photoURL: doc.data().photoURL
        })));
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async () => {
    if (!name || selectedUsers.length === 0) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/create-group', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
        },
        body: JSON.stringify({
          name,
          creatorId: auth.currentUser.uid,
          memberIds: [...selectedUsers.map(user => user.uid), auth.currentUser.uid], // Include current user
          photoURL: selectedUsers[0]?.photoURL || '' // Use first member's photo as default
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create group');
      }
      
      const { roomId } = await response.json();
      onGroupCreated(roomId);
      onClose();
    } catch (error) {
      console.error("Error creating group:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => 
      prev.some(u => u.id === user.id) 
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  };

  const filteredUsers = availableUsers.filter(user =>
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ p: 3, width: 400 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Create New Group
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <TextField
        fullWidth
        label="Group Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        sx={{ mb: 3 }}
      />
      
      <TextField
        fullWidth
        label="Add Members"
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon color="action" />
        }}
        sx={{ mb: 2 }}
      />
      
      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {selectedUsers.map(user => (
            <Chip
              key={user.id}
              label={user.displayName}
              onDelete={() => toggleUserSelection(user)}
              avatar={<Avatar src={user.photoURL} alt={user.displayName} />}
            />
          ))}
        </Box>
      )}
      
      {/* Available Users List */}
      <List sx={{ 
        maxHeight: 300, 
        overflow: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        mb: 3
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : filteredUsers.length === 0 ? (
          <Typography sx={{ p: 2, color: 'text.secondary' }}>
            {searchQuery ? 'No matching users found' : 'No users available'}
          </Typography>
        ) : (
          filteredUsers.map(user => (
            <ListItem 
              key={user.id}
              dense
              button
              onClick={() => toggleUserSelection(user)}
              sx={{
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Checkbox
                edge="start"
                checked={selectedUsers.some(u => u.id === user.id)}
                tabIndex={-1}
                disableRipple
              />
              <ListItemAvatar>
                <Avatar src={user.photoURL} alt={user.displayName} />
              </ListItemAvatar>
              <ListItemText 
                primary={user.displayName} 
                secondary={user.email} 
              />
            </ListItem>
          ))
        )}
      </List>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          onClick={onClose}
          sx={{ mr: 2 }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={!name || selectedUsers.length === 0 || loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Create Group
        </Button>
      </Box>
    </Box>
  );
}

export default CreateGroup;