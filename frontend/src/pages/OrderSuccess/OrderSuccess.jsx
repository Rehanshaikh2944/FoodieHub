import { useContext, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_URL, StoreContext } from "../../context/StoreContext";
import "./OrderSuccess.css";
export default function OrderSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("Checking order status…");
  const { clearCart } = useContext(StoreContext);
  useEffect(() => {
    let cancelled = false;
    if (!orderId) {
      setStatus("No order ID was provided.");
      return;
    }
    const check = async () => {
      try {
        let result;
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const response = await fetch(
            `${API_URL}/api/order/${encodeURIComponent(orderId)}/status`,
            {
              headers: (() => {
                const token = localStorage.getItem("foodiehub-token");
                return token ? { Authorization: `Bearer ${token}` } : {};
              })(),
            },
          );
          result = await response.json();
          if (!response.ok || !result.success)
            throw new Error(result.message || "Could not find the order.");
          if (
            result.data.paymentStatus === "paid" ||
            result.data.paymentMethod === "COD" ||
            !sessionId
          )
            break;
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
        if (cancelled) return;
        setStatus(
          `Order status: ${result.data.status}. Payment: ${result.data.paymentStatus}.`,
        );
        if (
          result.data.paymentStatus === "paid" ||
          result.data.paymentMethod === "COD"
        )
          clearCart();
      } catch (error) {
        if (!cancelled) setStatus(error.message);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [orderId, sessionId, clearCart]);
  return (
    <main className="order-success">
      <div className="order-success-card">
        <div className="success-mark">✓</div>
        <h1>Thank you!</h1>
        <p>Your FoodieHub order has been received.</p>
        <p className="order-status">{status}</p>
        {orderId && (
          <p className="order-id">
            Order ID: <strong>{orderId}</strong>
          </p>
        )}
        <Link className="success-home" to="/">
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
