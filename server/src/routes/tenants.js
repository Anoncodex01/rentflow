import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { handleSupabaseError, toCamelCase, toSnakeCase } from '../lib/supabase.js';

const router = Router();

router.use(authMiddleware);

// GET /api/tenants
router.get('/', async (req, res) => {
  try {
    const { data: tenants, error } = await req.supabase
      .from('tenants')
      .select(`
        *,
        rooms (*)
      `)
      .order('name', { ascending: true });

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    const formatted = tenants.map(tenant => {
      const t = toCamelCase(tenant);
      return {
        ...t,
        room: t.rooms || null,
        rooms: undefined
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// GET /api/tenants/:id
router.get('/:id', async (req, res) => {
  try {
    const { data: tenant, error } = await req.supabase
      .from('tenants')
      .select(`
        *,
        rooms (*),
        payments (*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const formatted = toCamelCase(tenant);
    res.json({
      ...formatted,
      room: formatted.rooms || null,
      rooms: undefined
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

// POST /api/tenants
router.post('/', async (req, res) => {
  try {
    const { name, phone, idNumber, roomId, moveInDate } = req.body;

    if (!name || !phone || !roomId || !moveInDate) {
      return res.status(400).json({ error: 'Name, phone, room, and move-in date are required' });
    }

    // Check if room exists and is vacant
    const { data: room, error: roomError } = await req.supabase
      .from('rooms')
      .select(`
        *,
        tenants (*)
      `)
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const formattedRoom = toCamelCase(room);
    if (formattedRoom.tenants && formattedRoom.tenants.length > 0) {
      return res.status(400).json({ error: 'Room is already occupied' });
    }

    // Create tenant
    const tenantData = toSnakeCase({
      name,
      phone,
      idNumber,
      roomId,
      moveInDate: new Date(moveInDate).toISOString()
    });

    const { data: tenant, error: tenantError } = await req.supabase
      .from('tenants')
      .insert(tenantData)
      .select(`
        *,
        rooms (*)
      `)
      .single();

    if (tenantError) {
      const errorMsg = handleSupabaseError(tenantError);
      return res.status(500).json(errorMsg);
    }

    // Update room status to occupied
    const { error: updateError } = await req.supabase
      .from('rooms')
      .update({ status: 'occupied' })
      .eq('id', roomId);

    if (updateError) {
      console.error('Error updating room status:', updateError);
      // Don't fail the request, but log the error
    }

    const formatted = toCamelCase(tenant);
    res.status(201).json({
      ...formatted,
      room: formatted.rooms || null,
      rooms: undefined
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// PUT /api/tenants/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, idNumber, moveOutDate } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (idNumber !== undefined) updateData.id_number = idNumber;
    if (moveOutDate !== undefined) {
      updateData.move_out_date = moveOutDate ? new Date(moveOutDate).toISOString() : null;
    }

    const { data: tenant, error } = await req.supabase
      .from('tenants')
      .update(updateData)
      .eq('id', req.params.id)
      .select(`
        *,
        rooms (*)
      `)
      .single();

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // If move out date is set, update room status
    if (moveOutDate) {
      const formatted = toCamelCase(tenant);
      const { error: updateError } = await req.supabase
        .from('rooms')
        .update({ status: 'vacant' })
        .eq('id', formatted.roomId);

      if (updateError) {
        console.error('Error updating room status:', updateError);
      }
    }

    const formatted = toCamelCase(tenant);
    res.json({
      ...formatted,
      room: formatted.rooms || null,
      rooms: undefined
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// DELETE /api/tenants/:id
router.delete('/:id', async (req, res) => {
  try {
    const { data: tenant, error: tenantError } = await req.supabase
      .from('tenants')
      .select(`
        *,
        payments (id)
      `)
      .eq('id', req.params.id)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const formatted = toCamelCase(tenant);

    // Delete all payments for this tenant
    const { error: paymentsError } = await req.supabase
      .from('payments')
      .delete()
      .eq('tenant_id', req.params.id);

    if (paymentsError) {
      console.error('Error deleting payments:', paymentsError);
    }

    // Delete all alerts for this tenant
    const { error: alertsError } = await req.supabase
      .from('alerts')
      .delete()
      .eq('tenant_id', req.params.id);

    if (alertsError) {
      console.error('Error deleting alerts:', alertsError);
    }

    // Delete the tenant
    const { error: deleteError } = await req.supabase
      .from('tenants')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      const errorMsg = handleSupabaseError(deleteError);
      return res.status(500).json(errorMsg);
    }

    // Update room status to vacant
    const { error: updateError } = await req.supabase
      .from('rooms')
      .update({ status: 'vacant' })
      .eq('id', formatted.roomId);

    if (updateError) {
      console.error('Error updating room status:', updateError);
    }

    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

export default router;
