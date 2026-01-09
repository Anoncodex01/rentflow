import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { handleSupabaseError, toCamelCase, toSnakeCase } from '../lib/supabase.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/rooms
router.get('/', async (req, res) => {
  try {
    const { data: rooms, error } = await req.supabase
      .from('rooms')
      .select(`
        *,
        tenants (*)
      `)
      .order('room_number', { ascending: true });

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    // Format rooms: convert snake_case to camelCase and handle images
    const formattedRooms = rooms.map(room => {
      const formatted = toCamelCase(room);
      return {
        ...formatted,
        images: formatted.images || [],
        tenant: formatted.tenants?.[0] || null,
        tenants: undefined // Remove tenants array, keep only tenant
      };
    });

    res.json(formattedRooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// GET /api/rooms/:id
router.get('/:id', async (req, res) => {
  try {
    const { data: room, error } = await req.supabase
      .from('rooms')
      .select(`
        *,
        tenants (*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const formatted = toCamelCase(room);
    res.json({
      ...formatted,
      images: formatted.images || [],
      tenant: formatted.tenants?.[0] || null,
      tenants: undefined
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
    const { data: existingRoom } = await req.supabase
      .from('rooms')
      .select('id')
      .eq('room_number', roomNumber.toUpperCase())
      .single();

    if (existingRoom) {
      return res.status(400).json({ error: 'Room number already exists' });
    }

    const roomData = toSnakeCase({
      roomNumber: roomNumber.toUpperCase(),
      roomName,
      monthlyRent: parseFloat(monthlyRent),
      status: 'vacant',
      images: images || null,
      notes
    });

    const { data: room, error } = await req.supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    const formatted = toCamelCase(room);
    res.status(201).json({
      ...formatted,
      images: formatted.images || []
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

    const updateData = {};
    if (roomNumber) updateData.room_number = roomNumber.toUpperCase();
    if (roomName !== undefined) updateData.room_name = roomName;
    if (monthlyRent !== undefined) updateData.monthly_rent = parseFloat(monthlyRent);
    if (status !== undefined) updateData.status = status;
    if (images !== undefined) updateData.images = images;
    if (notes !== undefined) updateData.notes = notes;

    const { data: room, error } = await req.supabase
      .from('rooms')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const formatted = toCamelCase(room);
    res.json({
      ...formatted,
      images: formatted.images || []
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
    const { data: room, error: roomError } = await req.supabase
      .from('rooms')
      .select(`
        *,
        tenants (*),
        payments (id)
      `)
      .eq('id', req.params.id)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const formattedRoom = toCamelCase(room);
    if (formattedRoom.tenants && formattedRoom.tenants.length > 0) {
      return res.status(400).json({ error: 'Cannot delete room with active tenant' });
    }

    // Delete related payments
    const { error: paymentsError } = await req.supabase
      .from('payments')
      .delete()
      .eq('room_id', req.params.id);

    if (paymentsError) {
      console.error('Error deleting payments:', paymentsError);
    }

    // Delete related alerts
    const { error: alertsError } = await req.supabase
      .from('alerts')
      .delete()
      .eq('room_id', req.params.id);

    if (alertsError) {
      console.error('Error deleting alerts:', alertsError);
    }

    // Delete the room
    const { error: deleteError } = await req.supabase
      .from('rooms')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      const errorMsg = handleSupabaseError(deleteError);
      return res.status(500).json(errorMsg);
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;
