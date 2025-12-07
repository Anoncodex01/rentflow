import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import tenantRoutes from './routes/tenants.js';
import paymentRoutes from './routes/payments.js';
import dashboardRoutes from './routes/dashboard.js';
import alertRoutes from './routes/alerts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors({
  origin: isProduction 
    ? [process.env.FRONTEND_URL, 'https://*.railway.app', 'https://*.up.railway.app'].filter(Boolean)
    : ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased for image uploads

// Make prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RentFlow API is running', env: process.env.NODE_ENV });
});

// Serve static files from the dist folder (frontend)
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// Handle SPA routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 RentFlow running on port ${PORT}`);
  console.log(`📊 Health check: /api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});
