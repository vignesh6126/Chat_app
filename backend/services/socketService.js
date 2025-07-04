const { Server } = require('socket.io');
const { db, fieldValue } = require('../config/firebase-admin');

class SocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: [
          'https://www.chats-app.me',
          'https://chats-app.me',
          process.env.CLIENT_URL || 'http://localhost:3000'
        ],
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });
    
    this.onlineUsers = {};
    this.initializeHeartbeat();
  }

  initialize() {
    this.io.on('connection', (socket) => {
      console.log('New connection:', socket.id);

      // User management
      socket.on('registerUser', (userId) => {
        if (!userId) return;
        this.onlineUsers[userId] = socket.id;
        console.log(`User ${userId} connected`);
      });

      // Room management
      socket.on('joinRoom', (roomId) => {
        if (!roomId) return;
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
      });

      // Message handling
      socket.on('groupMessage', this.handleGroupMessage.bind(this, socket));

      // Cleanup on disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  async handleGroupMessage(socket, { roomId, senderId, message }) {
    try {
      // Validate input
      if (!roomId || !senderId || !message) {
        return socket.emit('error', { message: 'Missing required fields' });
      }

      // Check room exists
      const roomRef = db.collection('rooms').doc(roomId);
      const roomDoc = await roomRef.get();
      
      if (!roomDoc.exists) {
        return socket.emit('error', { message: 'Room does not exist' });
      }

      // Add message to Firestore
      const messageRef = await roomRef.collection('messages').add({
        senderId,
        content: message,
        timestamp: fieldValue.serverTimestamp()
      });

      // Broadcast to room
      this.io.to(roomId).emit('newGroupMessage', {
        id: messageRef.id,
        senderId,
        content: message,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Message send failed:', error);
      socket.emit('error', { 
        message: 'Failed to send message',
        details: error.message 
      });
    }
  }

  handleDisconnect(socket) {
    const userId = Object.keys(this.onlineUsers).find(
      key => this.onlineUsers[key] === socket.id
    );
    if (userId) {
      delete this.onlineUsers[userId];
      console.log(`User ${userId} disconnected`);
    }
  }

  initializeHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.io.emit('ping', new Date().toISOString());
    }, 30000);
  }

  cleanup() {
    clearInterval(this.heartbeatInterval);
  }
}

module.exports = SocketService;