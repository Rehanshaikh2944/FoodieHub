import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  customer: {
    firstName: { type: String, required: true }, lastName: { type: String, required: true },
    email: { type: String, required: true }, phone: { type: String, required: true },
    street: { type: String, required: true }, city: { type: String, required: true },
    state: { type: String, required: true }, zipCode: { type: String, required: true }, country: { type: String, required: true },
  },
  items: [{ foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true }, name: String, price: Number, image: String, quantity: { type: Number, min: 1, required: true } }],
  subtotal: { type: Number, required: true, min: 0 }, deliveryFee: { type: Number, required: true, min: 0 }, total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['COD', 'STRIPE'], default: 'COD' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  stripeSessionId: { type: String, default: null },
  status: { type: String, enum: ['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'], default: 'Order Placed' },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', orderSchema);
