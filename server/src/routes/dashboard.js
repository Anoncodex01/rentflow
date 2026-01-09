import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { handleSupabaseError, toCamelCase } from '../lib/supabase.js';

const router = Router();

router.use(authMiddleware);

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    // Get room counts
    const { count: totalRooms } = await req.supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true });

    const { count: occupiedRooms } = await req.supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'occupied');

    const { count: vacantRooms } = await req.supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'vacant');

    // Get tenant count (active tenants - no move out date)
    const { count: totalTenants } = await req.supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .is('move_out_date', null);

    // Get paid payments aggregate
    const { data: paidPayments } = await req.supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid');

    const paidSum = paidPayments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
    const paidCount = paidPayments?.length || 0;

    // Get pending payments aggregate
    const { data: pendingPayments } = await req.supabase
      .from('payments')
      .select('amount')
      .eq('status', 'pending');

    const pendingSum = pendingPayments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
    const pendingCount = pendingPayments?.length || 0;

    // Get unread alerts count
    const { count: alerts } = await req.supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    res.json({
      rooms: {
        total: totalRooms || 0,
        occupied: occupiedRooms || 0,
        vacant: vacantRooms || 0
      },
      tenants: {
        active: totalTenants || 0
      },
      payments: {
        totalCollected: paidSum,
        paidCount: paidCount,
        pendingAmount: pendingSum,
        pendingCount: pendingCount
      },
      alerts: alerts || 0
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/dashboard/recent-payments
router.get('/recent-payments', async (req, res) => {
  try {
    const { data: payments, error } = await req.supabase
      .from('payments')
      .select(`
        *,
        tenants (*),
        rooms (*)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

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
    console.error('Recent payments error:', error);
    res.status(500).json({ error: 'Failed to fetch recent payments' });
  }
});

export default router;
