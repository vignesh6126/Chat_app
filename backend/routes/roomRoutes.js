const express = require('express');
const roomController = require('../controllers/roomController');
const router = express.Router();

// POST /api/rooms/group
router.post('/group', roomController.createGroupRoom);

module.exports = router;