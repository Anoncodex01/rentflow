import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalRooms,
      occupiedRooms,
      vacantRooms,
      totalTenants,
      paidPayments,
      pendingPayments,
      alerts
    ] = await Promise.all([
      req.prisma.room.count(),
      req.prisma.room.count({ where: { status: 'occupied' } }),
      req.prisma.room.count({ where: { status: 'vacant' } }),
      req.prisma.tenant.count({ where: { moveOutDate: null } }),
      req.prisma.payment.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
        _count: true
      }),
      req.prisma.payment.aggregate({
        where: { status: 'pending' },
        _sum: { amount: true },
        _count: true
      }),
      req.prisma.alert.count({ where: { isRead: false } })
    ]);

    res.json({
      rooms: {
        total: totalRooms,
        occupied: occupiedRooms,
        vacant: vacantRooms
      },
      tenants: {
        active: totalTenants
      },
      payments: {
        totalCollected: paidPayments._sum.amount || 0,
        paidCount: paidPayments._count,
        pendingAmount: pendingPayments._sum.amount || 0,
        pendingCount: pendingPayments._count
      },
      alerts: alerts
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/dashboard/recent-payments
router.get('/recent-payments', async (req, res) => {
  try {
    const payments = await req.prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: true,
        room: true
      }
    });

    res.json(payments);
  } catch (error) {
    console.error('Recent payments error:', error);
    res.status(500).json({ error: 'Failed to fetch recent payments' });
  }
});

export default router;

