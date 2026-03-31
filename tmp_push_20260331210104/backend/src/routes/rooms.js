const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// GET rooms (filter by floor, wing)
router.get('/', roomController.getRooms);

// PUT update room (number, type)
router.put('/:id', roomController.updateRoom);

// PATCH toggle room active status
router.patch('/:id/toggle', roomController.toggleRoomStatus);

// PATCH bulk toggle
router.patch('/bulk-toggle', roomController.bulkToggleRooms);

// DELETE room
router.delete('/:id', roomController.deleteRoom);

module.exports = router;
