import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL, StoreContext } from "../../context/StoreContext";
import "./MyOrders.css";

const TRACKING_STAGES = [
  { key: "Order Placed", label: "Order placed", subtitle: "Weve received your order." },
  { key: "Confirmed", label: "Confirmed", subtitle: "The kitchen has accepted it." },
  { key: "Preparing", label: "Preparing your food", subtitle: "Freshly cooking your meal." },
  { key: "Ready for Pickup", label: "Ready for pickup", subtitle: "Prepared and ready to hand off." },
  { key: "Out for Delivery", label: "Out for delivery", subtitle: "Your rider is on the way." },
  { key: "Delivered", label: "Delivered", subtitle: "Enjoy your meal." },
];

function normalizeStatus(status) {
  const value = String(status || "").trim().toLowerCase();

  if (value.includes("cancel")) return "Cancelled";
  if (value.includes("deliver") && !value.includes("out for")) {
    return "Delivered";
  }
  if (value.includes("out for delivery")) return "Out for Delivery";
  if (value.includes("prepar") || value.includes("processing")) {
    return "Preparing";
  }
  if (value.includes("confirm")) return "Confirmed";

  return "Order Placed";
}

function formatDate(date) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Date unavailable";

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getPaymentMethod(order) {
  const method = String(order.paymentMethod || order.payment || "").toLowerCase();

  if (method === "cod" || method.includes("cash on delivery")) {
    return "Cash on delivery";
  }

  return order.paymentMethod || order.payment || "Online payment";
}

function getPaymentStatus(status) {
  const value = String(status || "").toLowerCase();

  if (value === "paid" || value === "completed" || value === "success") {
    return "Paid";
  }

  if (value === "failed") return "Failed";

  return "Pending";
}

function getItemImage(item) {
  const image = item?.image || item?.img || "";
  if (!image) return "";
  if (/^(https?:|data:|blob:)/i.test(image)) return image;
  return `${API_URL}/images/${String(image).replace(/^\/+/, "")}`;
}

function StatusPill({ status }) {
  const normalized = normalizeStatus(status);

  return (
    <span className={`fh-status-pill fh-status-pill--${normalized.toLowerCase().replace(/\s+/g, "-")}`}>
      <span className="fh-status-dot" />
      {normalized}
    </span>
  );
}

function SummaryMetric({ label, value, accent = false }) {
  return (
    <div className={`fh-summary-tile ${accent ? "fh-summary-tile--accent" : ""}`}>
      <span className="fh-summary-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OrderTrackingPanel({ order }) {
  const status = normalizeStatus(order.status);
  const paymentStatus = getPaymentStatus(order.paymentStatus);
  const paymentMethod = getPaymentMethod(order);
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  if (status === "Cancelled") {
    return (
      <div className="fh-tracking-panel fh-tracking-panel--cancelled">
        <div className="fh-tracking-panel-header">
          <div>
            <span className="fh-section-kicker">Delivery status</span>
            <h3>Order cancelled</h3>
          </div>
          <StatusPill status={status} />
        </div>

        <div className="fh-cancelled-copy">
          <span>!</span>
          <div>
            <strong>This order was cancelled.</strong>
            <p>If you need help with a payment or delivery issue, contact support.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = {
    "Order Placed": 0,
    Confirmed: 1,
    Preparing: 2,
    "Out for Delivery": 4,
    Delivered: 5,
  }[status] ?? 0;

  return (
    <div className="fh-tracking-panel">
      <div className="fh-tracking-panel-header">
        <div>
          <span className="fh-section-kicker">Delivery tracking</span>
          <h3>{status}</h3>
        </div>
        <StatusPill status={status} />
      </div>

      <div className="fh-tracking-grid">
        <div className="fh-tracking-timeline" aria-label="Order progress timeline">
          {TRACKING_STAGES.map((stage, index) => {
            const isDone = index < currentIndex;
            const isActive = index === currentIndex;
            const isUpcoming = index > currentIndex;

            return (
              <div
                key={stage.key}
                className={`fh-tracking-step ${isDone ? "is-done" : ""} ${isActive ? "is-active" : ""} ${isUpcoming ? "is-upcoming" : ""}`}
              >
                <div className="fh-tracking-node">
                  <span>{isDone ? "✓" : index + 1}</span>
                </div>

                <div className="fh-tracking-copy">
                  <strong>{stage.label}</strong>
                  <p>{stage.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="fh-tracking-summary">
          <div className="fh-summary-box">
            <span>Order reference</span>
            <strong>#{String(order._id || "").slice(-8).toUpperCase()}</strong>
          </div>
          <div className="fh-summary-box">
            <span>Order date</span>
            <strong>{formatDate(order.createdAt)}</strong>
          </div>
          <div className="fh-summary-box">
            <span>Payment</span>
            <strong>{paymentStatus}</strong>
          </div>
          <div className="fh-summary-box">
            <span>Method</span>
            <strong>{paymentMethod}</strong>
          </div>
          <div className="fh-summary-box fh-summary-box--wide">
            <span>Items</span>
            <strong>{itemCount} item{itemCount === 1 ? "" : "s"}</strong>
          </div>
          <div className="fh-summary-box fh-summary-box--wide">
            <span>ETA</span>
            <strong>Not provided by backend</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, expanded, onToggle, onRefresh, refreshing }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const status = normalizeStatus(order.status);
  const paymentStatus = getPaymentStatus(order.paymentStatus);
  const paymentMethod = getPaymentMethod(order);
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const firstItem = items[0];

  return (
    <article className={`fh-order-card ${expanded ? "is-expanded" : ""}`}>
      <div className="fh-order-card-head">
        <div className="fh-card-header-main">
          <div className="fh-card-thumb">
            {firstItem && firstItem.image ? (
              <img
                src={getItemImage(firstItem)}
                alt={firstItem.name || "Food item"}
                onError={(event) => {
                  const target = event.currentTarget;
                  target.style.display = "none";
                  target.parentElement.classList.add("fh-card-thumb--fallback");
                }}
              />
            ) : (
              <span>🍽️</span>
            )}
          </div>

          <div className="fh-card-info">
            <span className="fh-card-order-tag">Order #{String(order._id || "").slice(-8).toUpperCase()}</span>
            <h3>{items.slice(0, 2).map((item) => item.name || "Food item").join(" • ") || "FoodieHub order"}</h3>
            <div className="fh-card-meta">
              <span>{formatDate(order.createdAt)}</span>
              <span>{itemCount} item{itemCount === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>

        <div className="fh-card-side">
          <StatusPill status={status} />
          <strong className="fh-card-total">{money(order.total)}</strong>
        </div>
      </div>

      <div className="fh-order-card-body">
        <div className="fh-order-item-list">
          {items.slice(0, 3).map((item, index) => (
            <div className="fh-order-item-row" key={item._id || item.foodId || `${item.name}-${index}`}>
              <span>{item.name || "Food item"}</span>
              <strong>x{item.quantity || 1}</strong>
            </div>
          ))}
        </div>

        <div className="fh-card-detail-stack">
          <div className="fh-card-detail">
            <span>Payment</span>
            <strong>{paymentStatus}</strong>
          </div>
          <div className="fh-card-detail">
            <span>Method</span>
            <strong>{paymentMethod}</strong>
          </div>
        </div>
      </div>

      <div className="fh-card-actions">
        <button type="button" className="fh-primary-button" onClick={() => onToggle(order._id)}>
          {expanded ? "Hide details" : "Track order"}
        </button>
        <button type="button" className="fh-secondary-button" onClick={() => onToggle(order._id)}>
          {expanded ? "Hide overview" : "View details"}
        </button>
        {status !== "Cancelled" && status !== "Delivered" && (
          <button type="button" className="fh-tertiary-button" onClick={() => onRefresh?.(order._id)} disabled={Boolean(refreshing)}>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        )}
      </div>

      {expanded && <OrderTrackingPanel order={order} />}
    </article>
  );
}

export default function MyOrders() {
  const { token, user } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshingOrderId, setRefreshingOrderId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("newest");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const loadOrders = useCallback(
    async (silent = false) => {
      if (!token) {
        setOrders([]);
        setError("Sign in to view your order history.");
        setLoading(false);
        return;
      }

      if (!silent) setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/api/order/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Could not load your orders.");
        }

        const fetchedOrders = Array.isArray(result.data) ? result.data : [];
        setOrders(fetchedOrders);

        setExpandedOrderId((currentId) => {
          if (currentId && fetchedOrders.some((order) => order._id === currentId)) {
            return currentId;
          }

          const activeOrder = fetchedOrders.find(
            (order) => !["Delivered", "Cancelled"].includes(normalizeStatus(order.status))
          );

          return activeOrder?._id || fetchedOrders[0]?._id || null;
        });
      } catch (err) {
        setError(err.message || "Unable to load orders.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    let isMounted = true;

    async function runLoad() {
      if (!isMounted) return;
      await loadOrders();
    }

    runLoad();

    return () => {
      isMounted = false;
    };
  }, [loadOrders, user]);

  useEffect(() => {
    if (!token) return undefined;

    const intervalId = window.setInterval(() => {
      loadOrders(true);
    }, 20000);

    return () => window.clearInterval(intervalId);
  }, [token, loadOrders]);

  const refreshOrder = useCallback(
    async (orderId) => {
      if (!orderId || !token) return;
      setRefreshingOrderId(orderId);

      try {
        const response = await fetch(`${API_URL}/api/order/${orderId}/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Could not refresh this order.");
        }

        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order._id === orderId ? { ...order, ...result.data } : order
          )
        );
      } catch (err) {
        setError(err.message || "Unable to refresh this order.");
      } finally {
        setRefreshingOrderId(null);
      }
    },
    [token]
  );

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = orders.filter((order) => {
      const status = normalizeStatus(order.status);
      const matchesFilter =
        filter === "All" ||
        (filter === "Active" && !["Delivered", "Cancelled"].includes(status)) ||
        status === filter;

      const orderId = String(order._id || "").toLowerCase();
      const itemNames = (order.items || [])
        .map((item) => item.name || "")
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        orderId.includes(normalizedSearch.replace(/^#/, "")) ||
        itemNames.includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });

    return result.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sort === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [orders, search, filter, sort]);

  const activeOrder = filteredOrders.find((order) => order._id === expandedOrderId);
  const compactOrders = filteredOrders.filter((order) => order._id !== activeOrder?._id);

  const filterOptions = [
    { label: "All", value: "All" },
    { label: "Active", value: "Active" },
    { label: "Delivered", value: "Delivered" },
    { label: "Cancelled", value: "Cancelled" },
  ];

  const filterCount = (value) =>
    orders.filter((order) => {
      const status = normalizeStatus(order.status);

      if (value === "All") return true;
      if (value === "Active") return !["Delivered", "Cancelled"].includes(status);
      return status === value;
    }).length;

  const totalSpend = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const activeOrderCount = orders.filter(
    (order) => !["Delivered", "Cancelled"].includes(normalizeStatus(order.status))
  ).length;

  return (
    <main className="fh-my-orders-page">
      <div className="fh-my-orders-shell">
        <header className="fh-my-orders-header">
          <div>
            <span className="fh-section-kicker">Your account</span>
            <h1>My orders</h1>
            <p>Track every meal, check your order timeline, and keep your latest receipts in one place.</p>
          </div>

          <div className="fh-header-badge">
            <span className="fh-header-badge-icon">✦</span>
            <div>
              <strong>{orders.length}</strong>
              <span>Total orders</span>
            </div>
          </div>
        </header>

        <section className="fh-summary-grid" aria-label="Order summary metrics">
          <SummaryMetric label="Active orders" value={activeOrderCount} accent />
          <SummaryMetric label="Delivered" value={orders.filter((order) => normalizeStatus(order.status) === "Delivered").length} />
          <SummaryMetric label="Spent so far" value={money(totalSpend)} />
        </section>

        <section className="fh-my-orders-toolbar" aria-label="Search and filter orders">
          <label className="fh-search-field">
            <span>⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by order ID or food name"
            />
          </label>

          <div className="fh-filter-row">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={filter === option.value ? "is-selected" : ""}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
                <span>{filterCount(option.value)}</span>
              </button>
            ))}
          </div>

          <label className="fh-sort-field">
            <span>↕</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort orders">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </section>

        {loading && (
          <div className="fh-state-panel fh-state-panel--loading" role="status" aria-live="polite">
            <div className="fh-spinner" aria-hidden="true" />
            <div>
              <strong>Loading your orders</strong>
              <p>Gathering your delivery updates…</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="fh-state-panel fh-state-panel--error" role="alert">
            <div className="fh-state-icon">!</div>
            <div>
              <strong>We couldnt load your orders</strong>
              <p>{error}</p>
            </div>
            <Link to="/" className="fh-primary-link">Return home</Link>
          </div>
        )}

        {!loading && !error && filteredOrders.length === 0 && (
          <div className="fh-empty-state">
            <div className="fh-empty-illustration">🍽️</div>
            <h2>{orders.length ? "No orders match your search" : "Your next favourite meal is waiting"}</h2>
            <p>
              {orders.length
                ? "Try another keyword or switch the order filter."
                : "Start exploring the menu to place your first FoodieHub order."}
            </p>

            {orders.length ? (
              <button
                type="button"
                className="fh-primary-button"
                onClick={() => {
                  setSearch("");
                  setFilter("All");
                }}
              >
                Clear filters
              </button>
            ) : (
              <Link to="/" className="fh-primary-button">Explore menu</Link>
            )}
          </div>
        )}

        {!loading && !error && filteredOrders.length > 0 && (
          <>
            <div className="fh-list-header">
              <div>
                <span className="fh-section-kicker">Order history</span>
                <h2>{filteredOrders.length} order{filteredOrders.length > 1 ? "s" : ""}</h2>
              </div>
              <p>Updated with the latest statuses from the kitchen and delivery team.</p>
            </div>

            <div className="fh-order-stack">
              {activeOrder && (
                <OrderCard
                  order={activeOrder}
                  expanded
                  onToggle={(orderId) => setExpandedOrderId((current) => (current === orderId ? null : orderId))}
                  onRefresh={refreshOrder}
                  refreshing={refreshingOrderId === activeOrder._id}
                />
              )}

              {compactOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  expanded={expandedOrderId === order._id}
                  onToggle={(orderId) => setExpandedOrderId((current) => (current === orderId ? null : orderId))}
                  onRefresh={refreshOrder}
                  refreshing={refreshingOrderId === order._id}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
