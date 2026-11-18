import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api, { API_URL } from '../../utils/api';
import './Orders.css';

const statuses = ['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
const statusFilters = ['All', 'Active', 'Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get(`${API_URL}/api/order/admin/all`);

      if (!data.success) {
        throw new Error(data.message || 'Could not load orders.');
      }

      setOrders(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const changeStatus = async (id, status) => {
    setUpdating(id);

    try {
      const { data } = await api.patch(`${API_URL}/api/order/admin/${id}/status`, { status });

      if (!data.success) {
        throw new Error(data.message || 'Update failed.');
      }

      toast.success('Order status updated.');
      await fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not update status.');
    } finally {
      setUpdating('');
    }
  };

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return orders.filter((order) => {
      const orderId = String(order._id || '').toLowerCase();
      const customerName = `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim().toLowerCase();
      const matchesSearch = !keyword || orderId.includes(keyword) || customerName.includes(keyword);

      const statusValue = order.status || 'Order Placed';
      const matchesFilter =
        filter === 'All' ||
        (filter === 'Active' && !['Delivered', 'Cancelled'].includes(statusValue)) ||
        statusValue === filter;

      return matchesSearch && matchesFilter;
    });
  }, [orders, search, filter]);

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const activeCount = orders.filter((order) => !['Delivered', 'Cancelled'].includes(order.status)).length;
  const paidCount = orders.filter((order) => order.paymentStatus === 'paid').length;

  return (
    <section className="admin-orders">
      <div className="admin-orders-heading">
        <div>
          <span className="section-kicker">Dashboard</span>
          <h2>Orders</h2>
        </div>
        <button type="button" className="admin-secondary-button" onClick={fetchOrders}>
          Refresh
        </button>
      </div>

      <div className="admin-orders-metrics">
        <div className="admin-metric-card accent">
          <span>Total revenue</span>
          <strong>₹{totalRevenue.toLocaleString('en-IN')}</strong>
        </div>
        <div className="admin-metric-card">
          <span>Active orders</span>
          <strong>{activeCount}</strong>
        </div>
        <div className="admin-metric-card">
          <span>Paid orders</span>
          <strong>{paidCount}</strong>
        </div>
      </div>

      <div className="admin-orders-controls">
        <label className="admin-search-box">
          <span>⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by order ID or customer"
          />
        </label>

        <div className="admin-status-filters" aria-label="Order status filters">
          {statusFilters.map((option) => (
            <button
              key={option}
              type="button"
              className={filter === option ? 'active' : ''}
              onClick={() => setFilter(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="orders-message">Loading orders…</p>}

      {error && (
        <div className="orders-error" role="alert">
          {error}
          <button type="button" onClick={fetchOrders}>Try again</button>
        </div>
      )}

      {!loading && !error && filteredOrders.length === 0 && (
        <div className="orders-empty">
          <h3>No matching orders</h3>
          <p>Adjust the filters or refresh for the latest updates.</p>
        </div>
      )}

      <div className="admin-order-list">
        {filteredOrders.map((order) => (
          <article className="admin-order-card" key={order._id}>
            <div className="admin-order-top">
              <div>
                <strong>Order #{String(order._id || '').slice(-8).toUpperCase()}</strong>
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <div className="admin-order-side">
                <span className={`payment-pill ${order.paymentStatus || 'pending'}`}>{order.paymentStatus || 'pending'}</span>
                <strong className="admin-order-total">₹{Number(order.total || 0).toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="admin-order-grid">
              <div className="admin-order-column">
                <h4>Customer</h4>
                <p><strong>{order.customer?.firstName || 'Guest'} {order.customer?.lastName || ''}</strong></p>
                <p>{order.customer?.email || 'No email'}</p>
                <p>{order.customer?.phone || 'No phone'}</p>
                <p>
                  {[order.customer?.street, order.customer?.city, order.customer?.state, order.customer?.zipCode, order.customer?.country]
                    .filter(Boolean)
                    .join(', ') || 'Address not available'}
                </p>
              </div>

              <div className="admin-order-column">
                <h4>Items</h4>
                <ul>
                  {(order.items || []).map((item, index) => (
                    <li key={`${item.foodId || item.name}-${index}`}>
                      <span>{item.name} × {item.quantity}</span>
                      <strong>₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('en-IN')}</strong>
                    </li>
                  ))}
                </ul>
                <p className="admin-order-fees">
                  Subtotal ₹{Number(order.subtotal || 0).toLocaleString('en-IN')} · Delivery ₹{Number(order.deliveryFee || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="admin-order-column">
                <h4>Payment & status</h4>
                <p>Method: {order.paymentMethod === 'STRIPE' ? 'Online (Stripe)' : 'Cash on delivery'}</p>
                <label className="status-select-label">
                  Order status
                  <select
                    value={order.status}
                    disabled={
                      updating === order._id ||
                      (order.paymentMethod === 'STRIPE' && order.paymentStatus !== 'paid' && order.status !== 'Cancelled')
                    }
                    onChange={(event) => changeStatus(order._id, event.target.value)}
                  >
                    {statuses
                      .filter((status) =>
                        order.paymentMethod !== 'STRIPE' ||
                        order.paymentStatus === 'paid' ||
                        status === order.status ||
                        status === 'Cancelled'
                      )
                      .map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                  </select>
                </label>

                {order.paymentMethod === 'STRIPE' && order.paymentStatus !== 'paid' && (
                  <small>Online payment must be verified before processing.</small>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
