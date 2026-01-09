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
      .select(`
        *,
        tenants (*),
        rooms (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    const formatted = payments.map(payment => {
      const p = toCamelCase(payment);
      return {
        ...p,
        tenant: p.tenants || null,
        room: p.rooms || null,
        tenants: undefined,
        rooms: undefined
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
      .select(`
        *,
        tenants (*),
        rooms (*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const formatted = toCamelCase(payment);
    res.json({
      ...formatted,
      tenant: formatted.tenants || null,
      room: formatted.rooms || null,
      tenants: undefined,
      rooms: undefined
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
      .select(`
        *,
        tenants (*),
        rooms (*)
      `)
      .single();

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    const formatted = toCamelCase(payment);
    res.status(201).json({
      ...formatted,
      tenant: formatted.tenants || null,
      room: formatted.rooms || null,
      tenants: undefined,
      rooms: undefined
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
      .select(`
        *,
        tenants (*),
        rooms (*)
      `)
      .single();

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const formatted = toCamelCase(payment);
    res.json({
      ...formatted,
      tenant: formatted.tenants || null,
      room: formatted.rooms || null,
      tenants: undefined,
      rooms: undefined
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
      .select(`
        *,
        tenants (*),
        rooms (*)
      `)
      .single();

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const formatted = toCamelCase(payment);
    res.json({
      ...formatted,
      tenant: formatted.tenants || null,
      room: formatted.rooms || null,
      tenants: undefined,
      rooms: undefined
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
