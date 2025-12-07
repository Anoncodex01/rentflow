import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/payments
router.get('/', async (req, res) => {
  try {
    const payments = await req.prisma.payment.findMany({
      include: {
        tenant: true,
        room: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /api/payments/:id
router.get('/:id', async (req, res) => {
  try {
    const payment = await req.prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        tenant: true,
        room: true
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
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

    const payment = await req.prisma.payment.create({
      data: {
        tenantId,
        roomId,
        amount: parseFloat(amount),
        datePaid: datePaid ? new Date(datePaid) : null,
        monthPaidFor,
        status,
        batchId
      },
      include: {
        tenant: true,
        room: true
      }
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// PUT /api/payments/:id
router.put('/:id', async (req, res) => {
  try {
    const { amount, datePaid, monthPaidFor, status } = req.body;

    const payment = await req.prisma.payment.update({
      where: { id: req.params.id },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        datePaid: datePaid ? new Date(datePaid) : undefined,
        monthPaidFor,
        status
      },
      include: {
        tenant: true,
        room: true
      }
    });

    res.json(payment);
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// PATCH /api/payments/:id/mark-paid
router.patch('/:id/mark-paid', async (req, res) => {
  try {
    const payment = await req.prisma.payment.update({
      where: { id: req.params.id },
      data: {
        status: 'paid',
        datePaid: new Date()
      },
      include: {
        tenant: true,
        room: true
      }
    });

    res.json(payment);
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ error: 'Failed to mark payment as paid' });
  }
});

// DELETE /api/payments/:id
router.delete('/:id', async (req, res) => {
  try {
    await req.prisma.payment.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

export default router;

