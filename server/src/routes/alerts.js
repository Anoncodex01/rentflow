import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/alerts
router.get('/', async (req, res) => {
  try {
    const alerts = await req.prisma.alert.findMany({
      orderBy: { date: 'desc' }
    });

    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// POST /api/alerts
router.post('/', async (req, res) => {
  try {
    const { type, message, roomId, tenantId, date } = req.body;

    const alert = await req.prisma.alert.create({
      data: {
        type,
        message,
        roomId,
        tenantId,
        date: date ? new Date(date) : new Date()
      }
    });

    res.status(201).json(alert);
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// PATCH /api/alerts/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const alert = await req.prisma.alert.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });

    res.json(alert);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', async (req, res) => {
  try {
    await req.prisma.alert.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

export default router;

