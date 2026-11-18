import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB } from '../config/db.js';
import Food from '../models/foodModel.js';
import seedFoods from './seed-foods.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');
const assetsRoot = path.resolve(backendRoot, '../frontend/src/assets');

try {
  await connectDB();
  let created = 0; let skipped = 0;
  for (const seed of seedFoods) {
    const existing = await Food.findOne({ name: seed.name });
    if (existing) { skipped += 1; continue; }
    const sourcePath = path.join(assetsRoot, seed.imageSource);
    const destinationName = `seed-${seed.imageSource}`;
    await fs.copyFile(sourcePath, path.join(backendRoot, 'uploads', destinationName));
    await Food.create({ name: seed.name, description: seed.description, price: seed.price, category: seed.category, image: destinationName });
    created += 1;
  }
  console.log(`Menu seed complete. Added ${created} items; skipped ${skipped} existing items.`);
  await (await import('mongoose')).default.disconnect();
} catch (error) {
  console.error('Menu seeding failed:', error.message);
  process.exitCode = 1;
  try { await (await import('mongoose')).default.disconnect(); } catch {}
}
