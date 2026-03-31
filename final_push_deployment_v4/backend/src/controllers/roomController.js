const Room = require('../models/Room');

// GET rooms (filter by floor, wing)
exports.getRooms = async (req, res) => {
    try {
        const filter = {};
        if (req.query.floor) filter.floor = req.query.floor;
        if (req.query.wing) filter.wing = req.query.wing;
        if (req.query.activeOnly === 'true') filter.isactive = true;
        const rooms = await Room.find(filter).populate('beds.student', 'studentName degree year').sort({ roomnumber: 1 }).lean();

        const mappedRooms = rooms.map(room => ({
            ...room,
            beds: room.beds.map(bed => ({
                ...bed,
                student: bed.student ? {
                    _id: bed.student._id,
                    name: bed.student.studentName,
                    degree: bed.student.degree,
                    year: bed.student.year
                } : null
            }))
        }));

        res.json(mappedRooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST create a room
exports.createRoom = async (req, res) => {
    try {
        const { floor, wing, roomnumber, type } = req.body;

        // Get floor info for IDs and number
        const FloorModel = require('../models/Floor');
        const floorObj = await FloorModel.findById(floor);
        if (!floorObj) return res.status(404).json({ error: 'Floor not found' });

        // Generate Roomid
        const lastRoom = await Room.findOne().sort({ Roomid: -1 });
        let nextNum = 1;
        if (lastRoom && lastRoom.Roomid) {
            const matches = lastRoom.Roomid.match(/\d+/);
            if (matches) nextNum = parseInt(matches[0]) + 1;
        }
        const Roomid = `RM${String(nextNum).padStart(3, '0')}`;

        const room = await Room.create({
            Roomid,
            floorid: floorObj.floorID,
            floor: floorObj._id,
            floorNumber: floorObj.floorNumber,
            wing,
            roomnumber,
            type
        });
        res.status(201).json(room);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT update room (number, type)
exports.updateRoom = async (req, res) => {
    try {
        const { roomnumber, type } = req.body;
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ error: 'Room not found' });

        if (roomnumber !== undefined) room.roomnumber = roomnumber;
        if (type && type !== room.type) {
            // Changing room type - adjust beds
            const hasOccupied = room.beds.some(b => b.isOccupied);
            if (hasOccupied) {
                return res.status(400).json({ error: 'Cannot change type of room with occupied beds' });
            }
            room.type = type;
            if (type === 'single') {
                room.beds = [{ bedId: 'A', isOccupied: false }];
            } else {
                room.beds = [
                    { bedId: 'A', isOccupied: false },
                    { bedId: 'B', isOccupied: false }
                ];
            }
        }

        // Handle manual bed status updates
        if (req.body.beds) {
            req.body.beds.forEach(updatedBed => {
                const bed = room.beds.find(b => b.bedId === updatedBed.bedId);
                if (bed) {
                    if (updatedBed.isOccupied !== undefined) bed.isOccupied = updatedBed.isOccupied;
                    if (updatedBed.isOccupied === false) {
                        bed.student = null; // Clear student if making available
                    }
                }
            });
        }
        await room.save();
        res.json(room);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PATCH toggle room active status
exports.toggleRoomStatus = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ error: 'Room not found' });
        room.isactive = !room.isactive;
        await room.save();
        res.json(room);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PATCH bulk toggle
exports.bulkToggleRooms = async (req, res) => {
    try {
        const { roomIds, isactive } = req.body;
        await Room.updateMany({ _id: { $in: roomIds } }, { isactive });
        res.json({ message: `${roomIds.length} rooms updated` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE room
exports.deleteRoom = async (req, res) => {
    try {
        await Room.findByIdAndDelete(req.params.id);
        res.json({ message: 'Room deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
