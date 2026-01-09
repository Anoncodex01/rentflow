import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { handleSupabaseError, toCamelCase, toSnakeCase } from '../lib/supabase.js';

const router = Router();

router.use(authMiddleware);

// GET /api/payments
router.get('/', async (req, res) => {
  try {
    const { data: payments, error } = await req.supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    // Fetch related tenants and rooms
    const tenantIds = [...new Set(payments.map(p => p.tenant_id).filter(Boolean))];
    const roomIds = [...new Set(payments.map(p => p.room_id).filter(Boolean))];

    // Fetch tenants and rooms in parallel
    const [tenantsResult, roomsResult] = await Promise.all([
      tenantIds.length > 0 
        ? req.supabase.from('tenants').select('*').in('id', tenantIds)
        : { data: [], error: null },
      roomIds.length > 0
        ? req.supabase.from('rooms').select('*').in('id', roomIds)
        : { data: [], error: null }
    ]);

    // Create lookup maps (using original snake_case IDs)
    const tenantsMap = new Map((tenantsResult.data || []).map(t => [t.id, toCamelCase(t)]));
    const roomsMap = new Map((roomsResult.data || []).map(r => [r.id, toCamelCase(r)]));

    // Combine data
    const formatted = payments.map(payment => {
      const p = toCamelCase(payment);
      // Use original snake_case payment object to get IDs
      return {
        ...p,
        tenant: payment.tenant_id ? (tenantsMap.get(payment.tenant_id) || null) : null,
        room: payment.room_id ? (roomsMap.get(payment.room_id) || null) : null
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /api/payments/:id
router.get('/:id', async (req, res) => {
  try {
    const { data: payment, error } = await req.supabase
      .from('payments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Fetch related tenant and room
    const [tenantResult, roomResult] = await Promise.all([
      req.supabase.from('tenants').select('*').eq('id', payment.tenant_id).single(),
      req.supabase.from('rooms').select('*').eq('id', payment.room_id).single()
    ]);

    const formatted = toCamelCase(payment);
    res.json({
      ...formatted,
      tenant: tenantResult.data ? toCamelCase(tenantResult.data) : null,
      room: roomResult.data ? toCamelCase(roomResult.data) : null
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// POST /api/payments
router.post('/', async (req, res) => {
  try {
    const { tenantId, roomId, amount, datePaid, monthPaidFor, status = 'pending', batchId } = req.body;

    if (!tenantId || !roomId || !amount || !monthPaidFor) {
      return res.status(400).json({ error: 'Tenant, room, amount, and month are required' });
    }

    const paymentData = toSnakeCase({
      tenantId,
      roomId,
      amount: parseFloat(amount),
      datePaid: datePaid ? new Date(datePaid).toISOString() : null,
      monthPaidFor,
      status,
      batchId
    });

    const { data: payment, error } = await req.supabase
      .from('payments')
      .insert(paymentData)
      .select('*')
      .single();

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    // Fetch related tenant and room
    const [tenantResult, roomResult] = await Promise.all([
      req.supabase.from('tenants').select('*').eq('id', payment.tenant_id).single(),
      req.supabase.from('rooms').select('*').eq('id', payment.room_id).single()
    ]);

    const formatted = toCamelCase(payment);
    res.status(201).json({
      ...formatted,
      tenant: tenantResult.data ? toCamelCase(tenantResult.data) : null,
      room: roomResult.data ? toCamelCase(roomResult.data) : null
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// PUT /api/payments/:id
router.put('/:id', async (req, res) => {
  try {
    const { amount, datePaid, monthPaidFor, status } = req.body;

    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (datePaid !== undefined) {
      updateData.date_paid = datePaid ? new Date(datePaid).toISOString() : null;
    }
    if (monthPaidFor !== undefined) updateData.month_paid_for = monthPaidFor;
    if (status !== undefined) updateData.status = status;

    const { data: payment, error } = await req.supabase
      .from('payments')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Fetch related tenant and room
    const [tenantResult, roomResult] = await Promise.all([
      req.supabase.from('tenants').select('*').eq('id', payment.tenant_id).single(),
      req.supabase.from('rooms').select('*').eq('id', payment.room_id).single()
    ]);

    const formatted = toCamelCase(payment);
    res.json({
      ...formatted,
      tenant: tenantResult.data ? toCamelCase(tenantResult.data) : null,
      room: roomResult.data ? toCamelCase(roomResult.data) : null
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// PATCH /api/payments/:id/mark-paid
router.patch('/:id/mark-paid', async (req, res) => {
  try {
    const { data: payment, error } = await req.supabase
      .from('payments')
      .update({
        status: 'paid',
        date_paid: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Fetch related tenant and room
    const [tenantResult, roomResult] = await Promise.all([
      req.supabase.from('tenants').select('*').eq('id', payment.tenant_id).single(),
      req.supabase.from('rooms').select('*').eq('id', payment.room_id).single()
    ]);

    const formatted = toCamelCase(payment);
    res.json({
      ...formatted,
      tenant: tenantResult.data ? toCamelCase(tenantResult.data) : null,
      room: roomResult.data ? toCamelCase(roomResult.data) : null
    });
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ error: 'Failed to mark payment as paid' });
  }
});

// DELETE /api/payments/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('payments')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

export default router;
