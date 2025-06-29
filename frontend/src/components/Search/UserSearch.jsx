import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  Typography,
  Paper,
  Button,
} from '@mui/material';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

const UserSearch = ({ currentUser, onSelectUser, buttonText = "Message" }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchUsers = async (term) => {
    if (!term || !currentUser?.uid) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const trimmed = term.trim().toLowerCase();
      const usersRef = collection(db, 'users');

      const q = query(
        usersRef,
        where('displayName_lower', '>=', trimmed),
        where('displayName_lower', '<=', trimmed + '\uf8ff')
      );

      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map(doc => ({
          id: doc.id,
          uid: doc.data().uid,
          displayName: doc.data().displayName,
          email: doc.data().email,
          photoURL: doc.data().photoURL
        }))
        .filter(user => user.uid !== currentUser.uid);

      setResults(users);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search users');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  return (
    <Paper elevation={0} sx={{ 
      p: 2, 
      borderRadius: 3, 
      mb: 3,
      border: '1px solid rgba(0, 0, 0, 0.08)',
      backgroundColor: 'background.paper'
    }}>
      <TextField
        fullWidth
        size="small"
        label="Search users..."
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        autoComplete="off"
        sx={{
          mb: 2,
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
          },
        }}
      />

      {loading && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {error && (
        <Typography color="error" align="center" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {!loading && !error && searchTerm && results.length === 0 && (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          No users found
        </Typography>
      )}

      <List>
        {results.map((user) => (
          <ListItem
            key={user.uid}
            sx={{
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: 2,
              mb: 1,
              px: 2,
              py: 1.5,
              backgroundColor: 'background.paper',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
            secondaryAction={
              <Button
                variant="contained"
                size="small"
                sx={{
                  borderRadius: 20,
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  px: 2,
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    boxShadow: 'none'
                  }
                }}
                onClick={() => {
                  if (!currentUser?.uid || !user.uid) {
                    console.error('Missing user IDs');
                    return;
                  }
                  onSelectUser({
                    uid: user.uid,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                  });
                }}
              >
                {buttonText}
              </Button>
            }
          >
            <ListItemAvatar>
              <Avatar
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}`}
                alt={user.displayName}
                sx={{ width: 44, height: 44 }}
              />
            </ListItemAvatar>
            <ListItemText
              primary={<Typography fontWeight={600}>{user.displayName || 'Unknown User'}</Typography>}
              secondary={<Typography variant="body2" color="text.secondary">{user.email}</Typography>}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default UserSearch;