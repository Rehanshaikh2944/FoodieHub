import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { addFood, listFood, removeFood } from '../controllers/foodController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const uploadDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({ destination: uploadDir, filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${path.extname(file.originalname).toLowerCase()}`) });
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) });
router.get('/list', listFood);
router.post('/add', requireAdmin, upload.single('image'), addFood);
router.post('/remove', requireAdmin, removeFood);
export default router;
