import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await req.prisma.room.findMany({
      include: {
        tenant: true
      },
      orderBy: { roomNumber: 'asc' }
    });

    // Parse images JSON string back to array
    const formattedRooms = rooms.map(room => ({
      ...room,
      images: room.images ? JSON.parse(room.images) : []
    }));

    res.json(formattedRooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// GET /api/rooms/:id
router.get('/:id', async (req, res) => {
  try {
    const room = await req.prisma.room.findUnique({
      where: { id: req.params.id },
      include: { tenant: true }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
      ...room,
      images: room.images ? JSON.parse(room.images) : []
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// POST /api/rooms
router.post('/', async (req, res) => {
  try {
    const { roomNumber, roomName, monthlyRent, images, notes } = req.body;

    if (!roomNumber || !monthlyRent) {
      return res.status(400).json({ error: 'Room number and monthly rent are required' });
    }

    // Check if room number already exists
    const existingRoom = await req.prisma.room.findUnique({
      where: { roomNumber: roomNumber.toUpperCase() }
    });

    if (existingRoom) {
      return res.status(400).json({ error: 'Room number already exists' });
    }

    const room = await req.prisma.room.create({
      data: {
        roomNumber: roomNumber.toUpperCase(),
        roomName,
        monthlyRent: parseFloat(monthlyRent),
        status: 'vacant',
        images: images ? JSON.stringify(images) : null,
        notes
      }
    });

    res.status(201).json({
      ...room,
      images: room.images ? JSON.parse(room.images) : []
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// PUT /api/rooms/:id
router.put('/:id', async (req, res) => {
  try {
    const { roomNumber, roomName, monthlyRent, status, images, notes } = req.body;

    const room = await req.prisma.room.update({
      where: { id: req.params.id },
      data: {
        roomNumber: roomNumber?.toUpperCase(),
        roomName,
        monthlyRent: monthlyRent ? parseFloat(monthlyRent) : undefined,
        status,
        images: images ? JSON.stringify(images) : undefined,
        notes
      }
    });

    res.json({
      ...room,
      images: room.images ? JSON.parse(room.images) : []
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// DELETE /api/rooms/:id
router.delete('/:id', async (req, res) => {
  try {
    // Check if room has a tenant
    const room = await req.prisma.room.findUnique({
      where: { id: req.params.id },
      include: { 
        tenant: true,
        payments: true
      }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.tenant) {
      return res.status(400).json({ error: 'Cannot delete room with active tenant' });
    }

    // Delete room, related payments, and alerts in a transaction
    await req.prisma.$transaction(async (tx) => {
      // Delete all payments for this room (if any exist)
      if (room.payments && room.payments.length > 0) {
        await tx.payment.deleteMany({
          where: { roomId: req.params.id }
        });
      }

      // Delete all alerts for this room
      await tx.alert.deleteMany({
        where: { roomId: req.params.id }
      });

      // Delete the room
      await tx.room.delete({
        where: { id: req.params.id }
      });
    });

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;

