import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { handleSupabaseError, toCamelCase, toSnakeCase } from '../lib/supabase.js';

const router = Router();

router.use(authMiddleware);

// GET /api/alerts
router.get('/', async (req, res) => {
  try {
    const { data: alerts, error } = await req.supabase
      .from('alerts')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    const formatted = alerts.map(alert => toCamelCase(alert));
    res.json(formatted);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// POST /api/alerts
router.post('/', async (req, res) => {
  try {
    const { type, message, roomId, tenantId, date } = req.body;

    const alertData = toSnakeCase({
      type,
      message,
      roomId: roomId || null,
      tenantId: tenantId || null,
      date: date ? new Date(date).toISOString() : new Date().toISOString()
    });

    const { data: alert, error } = await req.supabase
      .from('alerts')
      .insert(alertData)
      .select()
      .single();

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    const formatted = toCamelCase(alert);
    res.status(201).json(formatted);
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// PATCH /api/alerts/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const { data: alert, error } = await req.supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const formatted = toCamelCase(alert);
    res.json(formatted);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('alerts')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      const errorMsg = handleSupabaseError(error);
      return res.status(500).json(errorMsg);
    }

    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

export default router;
