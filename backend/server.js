require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const roomRoutes = require('./routes/roomRoutes');
const SocketService = require('./services/socketService');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: ['https://www.chats-app.me', 'https://chats-app.me'],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/rooms', roomRoutes);
app.get('/health', (req, res) => res.send('OK'));

// Socket.io
const socketService = new SocketService(server);
socketService.initialize();

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});