const { Server } = require('socket.io');
const { db, fieldValue } = require('../config/firebase-admin');

class SocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });
    this.onlineUsers = {};
  }

  initialize() {
    this.io.on('connection', (socket) => {
      console.log('New connection:', socket.id);

      socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
      });

      socket.on('groupMessage', async ({ roomId, senderId, message }) => {
        try {
          const messageRef = await db.collection('rooms')
            .doc(roomId)
            .collection('messages')
            .add({
              senderId,
              content: message,
              timestamp: fieldValue.serverTimestamp()
            });

          this.io.to(roomId).emit('newGroupMessage', {
            id: messageRef.id,
            senderId,
            content: message,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Message send failed:', error);
        }
      });
    });
  }
}

module.exports = SocketService;