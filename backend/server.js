require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const roomRoutes = require('./routes/roomRoutes');
const SocketService = require('./services/socketService');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/rooms', roomRoutes);
app.get('/health', (req, res) => res.send('OK'));

// Socket.io
const socketService = new SocketService(server);
socketService.initialize();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});