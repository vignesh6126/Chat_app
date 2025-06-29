import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Button,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';

const ProfileEditor = ({ user }) => {
  const [username, setUsername] = useState(user.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePic, setProfilePic] = useState(user.photoURL || '');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfilePic(imageUrl);
    }
  };

  const handleSave = () => {
    console.log('Saving:', { username, phoneNumber });
    // Update Firebase logic here
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        mt: 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 600,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: '#ffffff',
        }}
      >
        <Avatar
          src={profilePic}
          sx={{ width: 80, height: 80, mb: 2 }}
        />

        <Button
          variant="outlined"
          component="label"
          startIcon={<PhotoCamera />}
          sx={{ mb: 2 }}
        >
          Upload Profile Picture
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleFileChange}
          />
        </Button>

        <TextField
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Button
          fullWidth
          variant="contained"
          onClick={handleSave}
        >
          Save Profile
        </Button>
      </Paper>
    </Box>
  );
};

export default ProfileEditor;
