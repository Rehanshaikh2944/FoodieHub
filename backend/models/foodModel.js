import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, required: true },
  category: { type: String, required: true, trim: true },
  available: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Food || mongoose.model('Food', foodSchema);
