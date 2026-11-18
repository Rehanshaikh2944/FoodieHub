import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB } from './config/db.js';
import foodRouter from './routes/foodRoute.js';
import userRouter from './routes/userRoute.js';
import orderRouter from './routes/orderRoute.js';
import { stripeWebhook } from './controllers/orderController.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawAllowedOrigins = process.env.CLIENT_ORIGINS || 'http://localhost:4173,http://localhost:5173';
const allowedOrigins = Array.from(new Set(rawAllowedOrigins.split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean)));
const corsOptions = {
  origin(origin, callback) {
    const normalizedOrigin = origin ? origin.replace(/\/$/, '') : origin;
    if (!origin || allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options(/^(.*)$/, cors(corsOptions));
app.post('/api/order/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
app.use(express.json({ limit: '1mb' }));
app.use('/images', express.static(path.join(__dirname, 'uploads')));
app.get('/', (_req, res) => res.json({ success: true, message: 'FoodieHub API is running.' }));
app.use('/api/food', foodRouter);
app.use('/api/user', userRouter);
app.use('/api/order', orderRouter);
app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.use((error, _req, res, _next) => {
  console.error('API error:', error);
  if (error instanceof multer.MulterError) return res.status(400).json({ success: false, message: error.message });
  return res.status(500).json({ success: false, message: 'Unexpected server error.' });
});

connectDB().then(() => app.listen(port, () => console.log(`FoodieHub API running at http://localhost:${port}`))).catch((error) => {
  console.error('Database connection failed:', error.message);
  process.exit(1);
});
