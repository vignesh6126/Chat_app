import { Button, Stack, Typography, Box } from '@mui/material';

const ChatTypeSelector = ({ onSelectPersonal, onSelectRoom }) => {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 500,
        mx: 'auto',
        p: 3,
        textAlign: 'center',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Choose Chat Type
      </Typography>

      <Stack spacing={2}>
        <Button variant="contained" fullWidth onClick={onSelectPersonal}>
          Personal Chat
        </Button>
        <Button variant="contained" fullWidth onClick={onSelectRoom}>
          Room Chat
        </Button>
      </Stack>
    </Box>
  );
};

export default ChatTypeSelector;
