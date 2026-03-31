const express = require('express');
const router = express.Router();
const floorController = require('../controllers/floorController');

// GET all floors (filter by wing)
router.get('/', floorController.getFloors);

// POST create a new floor with default rooms
router.post('/', floorController.createFloor);

// POST create multiple floors
router.post('/bulk', floorController.createFloorsBulk);

// PATCH toggle floor active status
router.patch('/:id/toggle', floorController.toggleFloorStatus);

// DELETE floor and its rooms
router.delete('/:id', floorController.deleteFloor);

module.exports = router;
