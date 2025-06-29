const RoomService = require('../services/roomService');

exports.createGroupRoom = async (req, res) => {
  try {
    const { name, creatorId, members } = req.body;
    const roomId = await RoomService.createGroupRoom(name, creatorId, members);
    res.status(201).json({ roomId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};