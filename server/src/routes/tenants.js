import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/tenants
router.get('/', async (req, res) => {
  try {
    const tenants = await req.prisma.tenant.findMany({
      include: {
        room: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(tenants);
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// GET /api/tenants/:id
router.get('/:id', async (req, res) => {
  try {
    const tenant = await req.prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        room: true,
        payments: true
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenant);
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
    const room = await req.prisma.room.findUnique({
      where: { id: roomId },
      include: { tenant: true }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.tenant) {
      return res.status(400).json({ error: 'Room is already occupied' });
    }

    // Create tenant and update room status in a transaction
    const [tenant] = await req.prisma.$transaction([
      req.prisma.tenant.create({
        data: {
          name,
          phone,
          idNumber,
          roomId,
          moveInDate: new Date(moveInDate)
        },
        include: { room: true }
      }),
      req.prisma.room.update({
        where: { id: roomId },
        data: { status: 'occupied' }
      })
    ]);

    res.status(201).json(tenant);
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// PUT /api/tenants/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, idNumber, moveOutDate } = req.body;

    const tenant = await req.prisma.tenant.update({
      where: { id: req.params.id },
      data: {
        name,
        phone,
        idNumber,
        moveOutDate: moveOutDate ? new Date(moveOutDate) : undefined
      },
      include: { room: true }
    });

    // If move out date is set, update room status
    if (moveOutDate) {
      await req.prisma.room.update({
        where: { id: tenant.roomId },
        data: { status: 'vacant' }
      });
    }

    res.json(tenant);
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// DELETE /api/tenants/:id
router.delete('/:id', async (req, res) => {
  try {
    const tenant = await req.prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        payments: true
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Delete tenant, related payments, alerts, and update room status in a transaction
    await req.prisma.$transaction(async (tx) => {
      // Delete all payments for this tenant
      if (tenant.payments.length > 0) {
        await tx.payment.deleteMany({
          where: { tenantId: req.params.id }
        });
      }

      // Delete all alerts for this tenant
      await tx.alert.deleteMany({
        where: { tenantId: req.params.id }
      });

      // Delete the tenant
      await tx.tenant.delete({
        where: { id: req.params.id }
      });

      // Update room status to vacant
      await tx.room.update({
        where: { id: tenant.roomId },
        data: { status: 'vacant' }
      });
    });

    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

export default router;

