import { useContext, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./PlaceOrder.css";
import { API_URL, StoreContext } from "../../context/StoreContext";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  country: "India",
  phone: "",
};

const PlaceOrder = () => {
  const { cartItems, food_list, clearCart, token } = useContext(StoreContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(emptyForm);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    searchParams.get("payment") === "cancelled"
      ? "Payment was cancelled. You can try again or choose cash on delivery."
      : "",
  );
  const items = useMemo(
    () =>
      food_list
        .filter((food) => Number(cartItems[food._id]) > 0)
        .map((food) => ({
          foodId: food._id,
          quantity: Number(cartItems[food._id]),
        })),
    [food_list, cartItems],
  );
  const subtotal = food_list.reduce(
    (sum, item) =>
      sum + Number(item.price) * (Number(cartItems[item._id]) || 0),
    0,
  );
  const deliveryFee = subtotal > 0 ? 40 : 0;
  const total = subtotal + deliveryFee;
  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submitOrder = async (e) => {
  e.preventDefault();
  setError("");

  if (!token) {
    setError("Please log in to place your order.");
    return;
  }

  if (!items.length) {
    setError("Your cart is empty. Add some food before checking out.");
    return;
  }
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/api/order/place`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ customer: form, items, paymentMethod }),
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "Could not place your order.");
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      clearCart();
      navigate(`/order-success?orderId=${encodeURIComponent(result.orderId)}`);
    } catch (err) {
      setError(err.message || "Unable to place your order. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="place-order" onSubmit={submitOrder}>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-field">
          <input
            name="firstName"
            value={form.firstName}
            onChange={onChange}
            placeholder="First name"
            autoComplete="given-name"
            required
          />
          <input
            name="lastName"
            value={form.lastName}
            onChange={onChange}
            placeholder="Last name"
            autoComplete="family-name"
            required
          />
        </div>
        <input
          name="email"
          value={form.email}
          onChange={onChange}
          type="email"
          placeholder="Email address"
          autoComplete="email"
          required
        />
        <input
          name="street"
          value={form.street}
          onChange={onChange}
          placeholder="Street and house number"
          autoComplete="street-address"
          required
        />
        <div className="multi-field">
          <input
            name="city"
            value={form.city}
            onChange={onChange}
            placeholder="City"
            required
          />
          <input
            name="state"
            value={form.state}
            onChange={onChange}
            placeholder="State"
            required
          />
        </div>
        <div className="multi-field">
          <input
            name="zipCode"
            value={form.zipCode}
            onChange={onChange}
            placeholder="PIN code"
            inputMode="numeric"
            pattern="[0-9]{5,10}"
            required
          />
          <input
            name="country"
            value={form.country}
            onChange={onChange}
            placeholder="Country"
            required
          />
        </div>
        <input
          name="phone"
          value={form.phone}
          onChange={onChange}
          type="tel"
          placeholder="Phone number"
          autoComplete="tel"
          pattern="[+0-9() -]{7,20}"
          required
        />
      </div>
      <div className="place-order-right">
        <div className="cart-summary">
          <h2>Your Order</h2>
          {food_list
            .filter((item) => Number(cartItems[item._id]) > 0)
            .map((item) => (
              <div className="order-item" key={item._id}>
                <p>
                  {item.name} × {cartItems[item._id]}
                </p>
                <p>₹{item.price * cartItems[item._id]}</p>
              </div>
            ))}
          <hr />
          <div className="summary-row">
            <p>Subtotal</p>
            <p>₹{subtotal}</p>
          </div>
          <div className="summary-row">
            <p>Delivery</p>
            <p>₹{deliveryFee}</p>
          </div>
          <hr />
          <div className="summary-total">
            <p>Total</p>
            <p>₹{total}</p>
          </div>
          <label className="payment-label" htmlFor="payment-method">
            Payment method
          </label>
          <select
            id="payment-method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="COD">Cash on delivery</option>
            <option value="STRIPE">
              Pay online (Stripe test/live key required)
            </option>
          </select>
          {error && (
            <p className="order-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="checkout-button"
            type="submit"
            disabled={busy || !items.length}
          >
            {busy
              ? "Processing…"
              : paymentMethod === "STRIPE"
                ? "Continue to payment"
                : "Place order"}
          </button>
          {!items.length && <p>Add items to your cart before checking out.</p>}
        </div>
      </div>
    </form>
  );
};
export default PlaceOrder;
