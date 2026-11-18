import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Food from '../models/foodModel.js';

export async function addFood(req, res) {
  let uploadedPath;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please select a food image.' });
    uploadedPath = req.file.path;
    const name = String(req.body.name || '').trim();
    const description = String(req.body.description || '').trim();
    const category = String(req.body.category || '').trim();
    const price = Number(req.body.price);
    if (!name || !description || !category || !Number.isFinite(price) || price < 0) {
      await fs.unlink(uploadedPath).catch(() => {});
      return res.status(400).json({ success: false, message: 'Enter a valid name, description, category and non-negative price.' });
    }
    const food = await Food.create({ name, description, category, price, image: req.file.filename });
    return res.status(201).json({ success: true, message: 'Food added successfully.', data: food });
  } catch (error) {
    if (uploadedPath) await fs.unlink(uploadedPath).catch(() => {});
    console.error('addFood:', error);
    return res.status(500).json({ success: false, message: 'Could not add food item.' });
  }
}

export async function listFood(req, res) {
  try {
    const food = await Food.find({ available: true }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: food });
  } catch (error) {
    console.error('listFood:', error);
    return res.status(500).json({ success: false, message: 'Could not load food items.' });
  }
}

export async function removeFood(req, res) {
  try {
    const { id } = req.body;
    if (!id || !/^[a-f\d]{24}$/i.test(id)) return res.status(400).json({ success: false, message: 'A valid food ID is required.' });
    const food = await Food.findByIdAndDelete(id);
    if (!food) return res.status(404).json({ success: false, message: 'Food item not found.' });
    if (food.image) {
      const uploadsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads');
      await fs.unlink(path.join(uploadsDir, path.basename(food.image))).catch(() => {});
    }
    return res.json({ success: true, message: 'Food removed successfully.' });
  } catch (error) {
    console.error('removeFood:', error);
    return res.status(500).json({ success: false, message: 'Could not remove food item.' });
  }
}
