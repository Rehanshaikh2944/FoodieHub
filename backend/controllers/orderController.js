import mongoose from "mongoose";
import Stripe from "stripe";
import Food from "../models/foodModel.js";
import Order from "../models/orderModel.js";
import validator from "validator";

const deliveryFee = 40;
const stripeClient = () =>
  process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

function validateCustomer(customer = {}) {
  if (!customer || typeof customer !== "object" || Array.isArray(customer))
    return false;
  const keys = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "street",
    "city",
    "state",
    "zipCode",
    "country",
  ];
  return (
    keys.every(
      (key) =>
        typeof customer[key] === "string" && customer[key].trim().length > 0,
    ) &&
    keys.every(
      (key) =>
        customer[key].trim().length <=
        (key === "street" ? 200 : key === "email" ? 254 : 100),
    ) &&
    validator.isEmail(customer.email.trim()) &&
    /^[+0-9() -]{7,20}$/.test(customer.phone.trim()) &&
    /^[0-9]{5,10}$/.test(customer.zipCode.trim())
  );
}

async function prepareOrderItems(items) {
  if (!Array.isArray(items) || !items.length || items.length > 100)
    throw new Error("Your cart is empty or invalid.");
  const quantities = new Map();
  for (const item of items) {
    if (!item || typeof item !== "object")
      throw new Error("One or more cart items are invalid.");
    const id = String(item.foodId || item._id || "");
    const quantity = Number(item.quantity);
    if (
      !mongoose.isValidObjectId(id) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    )
      throw new Error("One or more cart items are invalid.");
    const nextQuantity = (quantities.get(id) || 0) + quantity;
    if (nextQuantity > 99)
      throw new Error("A food item quantity cannot exceed 99.");
    quantities.set(id, nextQuantity);
  }
  const foods = await Food.find({
    _id: { $in: [...quantities.keys()] },
    available: true,
  }).lean();
  if (foods.length !== quantities.size)
    throw new Error(
      "Some items are no longer available. Please refresh your cart.",
    );
  const orderItems = foods.map((food) => ({
    foodId: food._id,
    name: food.name,
    price: food.price,
    image: food.image,
    quantity: quantities.get(String(food._id)),
  }));
  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  return {
    orderItems,
    subtotal,
    deliveryFee: subtotal > 0 ? deliveryFee : 0,
    total: subtotal + (subtotal > 0 ? deliveryFee : 0),
  };
}

export async function createOrder(req, res) {
  try {
    const { customer, items, paymentMethod = "COD" } = req.body || {};
    if (!validateCustomer(customer))
      return res
        .status(400)
        .json({ success: false, message: "Complete all delivery fields." });
    if (!["COD", "STRIPE"].includes(paymentMethod))
      return res
        .status(400)
        .json({ success: false, message: "Unsupported payment method." });
    if (
      paymentMethod === "STRIPE" &&
      (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET)
    )
      return res
        .status(503)
        .json({
          success: false,
          message:
            "Online payment is not fully configured. Choose cash on delivery or configure Stripe and its webhook.",
        });
    const pricing = await prepareOrderItems(items);
    const order = await Order.create({
      userId: req.auth.id,
      customer: Object.fromEntries(
        Object.entries(customer).map(([k, v]) => [k, String(v).trim()]),
      ),
      items: pricing.orderItems,
      ...pricing,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "pending" : "pending",
    });
    if (paymentMethod === "STRIPE") {
      const stripe = stripeClient();
      try {
        const origin =
          process.env.CLIENT_ORIGIN ||
          req.headers.origin ||
          "http://localhost:4174";
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: customer.email,
          line_items: [
            ...pricing.orderItems.map((item) => ({
              price_data: {
                currency: "inr",
                product_data: { name: item.name },
                unit_amount: Math.round(item.price * 100),
              },
              quantity: item.quantity,
            })),
            ...(pricing.deliveryFee > 0
              ? [
                  {
                    price_data: {
                      currency: "inr",
                      product_data: { name: "Delivery fee" },
                      unit_amount: Math.round(pricing.deliveryFee * 100),
                    },
                    quantity: 1,
                  },
                ]
              : []),
          ],
          metadata: { orderId: order._id.toString() },
          success_url: `${origin}/order-success?orderId=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/order?payment=cancelled`,
        });
        order.stripeSessionId = session.id;
        await order.save();
        return res
          .status(201)
          .json({
            success: true,
            checkoutUrl: session.url,
            orderId: order._id,
          });
      } catch (error) {
        await Order.findByIdAndDelete(order._id);
        throw error;
      }
    }
    return res
      .status(201)
      .json({
        success: true,
        message: "Order placed successfully.",
        orderId: order._id,
      });
  } catch (error) {
    console.error("createOrder:", error);
    const clientError =
      /cart is empty|cart items are invalid|no longer available|quantity cannot exceed/i.test(
        error.message,
      );
    return res
      .status(clientError ? 400 : 500)
      .json({
        success: false,
        message: error.message || "Could not place your order.",
      });
  }
}

export async function listMyOrders(req, res) {
  try {
    const orders = await Order.find({ userId: req.auth.id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: orders });
  } catch (error) {
    console.error("listMyOrders:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not load order history." });
  }
}

export async function getOrderStatus(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID." });
    const filter = { _id: req.params.id };
    if (req.auth?.role === "user") filter.userId = req.auth.id;
    const order = await Order.findOne(filter).select(
      "status paymentStatus paymentMethod createdAt total",
    );
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    return res.json({ success: true, data: order });
  } catch (error) {
    console.error("getOrderStatus:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not load order status." });
  }
}

export async function listAllOrders(req, res) {
  try {
    return res.json({
      success: true,
      data: await Order.find({}).sort({ createdAt: -1 }).lean(),
    });
  } catch (error) {
    console.error("listAllOrders:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not load orders." });
  }
}

export async function updateOrderStatus(req, res) {
  const allowed = [
    "Order Placed",
    "Confirmed",
    "Preparing",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
  ];
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID." });
    if (!allowed.includes(req.body?.status))
      return res
        .status(400)
        .json({ success: false, message: "Invalid order status." });
    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    if (
      order.paymentMethod === "STRIPE" &&
      order.paymentStatus !== "paid" &&
      req.body.status !== "Cancelled"
    )
      return res
        .status(409)
        .json({
          success: false,
          message: "Cannot process an unpaid online order.",
        });
    order.status = req.body.status;
    // For cash-on-delivery orders, delivery completion means the driver collected payment.
    if (order.paymentMethod === "COD" && req.body.status === "Delivered")
      order.paymentStatus = "paid";
    await order.save();
    return res.json({
      success: true,
      message: "Order status updated.",
      data: order,
    });
  } catch (error) {
    console.error("updateOrderStatus:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not update order status." });
  }
}

export async function stripeWebhook(req, res) {
  const stripe = stripeClient();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET)
    return res.status(503).send("Stripe webhook is not configured");
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;
      if (session.metadata?.orderId && session.payment_status === "paid") {
        await Order.findOneAndUpdate(
          {
            _id: session.metadata.orderId,
            stripeSessionId: session.id,
            paymentMethod: "STRIPE",
          },
          { paymentStatus: "paid" },
        );
      }
    } else if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      const session = event.data.object;
      if (session.metadata?.orderId) {
        await Order.findOneAndUpdate(
          {
            _id: session.metadata.orderId,
            stripeSessionId: session.id,
            paymentMethod: "STRIPE",
            paymentStatus: { $ne: "paid" },
          },
          { paymentStatus: "failed" },
        );
      }
    }
    return res.json({ received: true });
  } catch (error) {
    console.error("stripeWebhook:", error);
    return res.status(500).send("Webhook handling failed");
  }
}
