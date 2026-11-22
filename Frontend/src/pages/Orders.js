import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { orderAPI } from '../services/api';
import { FaChevronDown, FaChevronUp, FaTimes } from 'react-icons/fa';

const statusColors = {
  PENDING: { bg: '#fff8e1', color: '#f57f17' },
  CONFIRMED: { bg: '#e3f2fd', color: '#1565c0' },
  SHIPPED: { bg: '#f3e5f5', color: '#6a1b9a' },
  DELIVERED: { bg: '#e8f5e9', color: '#2e7d32' },
  CANCELLED: { bg: '#ffebee', color: '#c62828' },
  PAYMENT_FAILED: { bg: '#fce4ec', color: '#ad1457' },
};

const statuses = [
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'PAYMENT_FAILED',
];

const formatTimelineDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const statusLabel = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('mine'); // 'mine' | 'all' (admin only)
  const [expanded, setExpanded] = useState({});
  const [history, setHistory] = useState({});
  const [historyLoading, setHistoryLoading] = useState({});
  const [cancelling, setCancelling] = useState(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      setLoading(true);
      try {
        const res =
          isAdmin && view === 'all'
            ? await orderAPI.getAllOrders()
            : await orderAPI.getMyOrders();
        const list = Array.isArray(res.data) ? res.data : [];
        setOrders(list.slice().reverse());
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    loadOrders();
  }, [user, view, isAdmin, navigate]);

  const handleStatusChange = async (orderId, status) => {
    try {
      await orderAPI.updateStatus(orderId, status);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );
      showToast(`Order #${orderId} marked ${status}`, 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not update status', 'error');
    }
  };

  // Load the tracking timeline the first time an order is expanded.
  const toggleTracking = async (orderId) => {
    const willOpen = !expanded[orderId];
    setExpanded((prev) => ({ ...prev, [orderId]: willOpen }));
    if (!willOpen || history[orderId]) return;

    setHistoryLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await orderAPI.history(orderId);
      setHistory((prev) => ({
        ...prev,
        [orderId]: Array.isArray(res.data) ? res.data : [],
      }));
    } catch (err) {
      showToast('Could not load tracking details', 'error');
      setHistory((prev) => ({ ...prev, [orderId]: [] }));
    } finally {
      setHistoryLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleCancel = async (order) => {
    if (!window.confirm(`Cancel order #${order.id}?`)) return;
    setCancelling(order.id);
    try {
      const res = await orderAPI.cancel(order.id);
      const updated = res.data || {};
      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id
            ? { ...item, ...updated, status: updated.status || 'CANCELLED' }
            : item
        )
      );
      showToast(`Order #${order.id} cancelled`, 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not cancel order', 'error');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div style={styles.empty}>
        <h2>No orders yet!</h2>
        <button
          className="btn-primary"
          style={{ marginTop: 16 }}
          onClick={() => navigate('/')}
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.titleRow}>
        <h2 style={styles.title}>{isAdmin && view === 'all' ? 'All Orders' : 'My Orders'}</h2>
        {isAdmin && (
          <div style={styles.viewSwitch}>
            <button
              style={{
                ...styles.viewBtn,
                ...(view === 'all' ? styles.viewBtnActive : {}),
              }}
              onClick={() => setView('all')}
            >
              All Orders
            </button>
            <button
              style={{
                ...styles.viewBtn,
                ...(view === 'mine' ? styles.viewBtnActive : {}),
              }}
              onClick={() => setView('mine')}
            >
              My Orders
            </button>
          </div>
        )}
      </div>

      {orders.map((order) => (
        <div key={order.id} style={styles.card} className="orders-card">
          <div style={styles.header} className="orders-header">
            <div style={styles.headerLeft}>
              <span style={styles.orderId}>Order #{order.id}</span>
              <span style={styles.date}>
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              {isAdmin && order.customerName && (
                <span style={styles.customer}>{order.customerName}</span>
              )}
            </div>
            <div style={styles.statusArea}>
              {isAdmin && (
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  style={styles.statusSelect}
                  aria-label={`Status for order ${order.id}`}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              )}
              <span
                style={{
                  ...styles.status,
                  background: statusColors[order.status]?.bg,
                  color: statusColors[order.status]?.color,
                }}
              >
                {order.status}
              </span>
            </div>
          </div>

          <div style={styles.items}>
            {order.items?.map((item, i) => (
              <div key={i} style={styles.item} className="orders-item">
                <span style={styles.itemName}>{item.productName}</span>
                <span style={styles.itemQty}>Qty: {item.quantity}</span>
                <span style={styles.itemPrice}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div style={styles.details} className="orders-details">
            <div style={styles.detailCol}>
              <span style={styles.detailLabel}>DELIVERY ADDRESS</span>
              <span style={styles.detailValue}>
                {order.recipientName || order.customerName || '—'}
              </span>
              <span style={styles.detailValue}>
                {[order.addressLine1, order.addressLine2].filter(Boolean).join(', ')}
              </span>
              <span style={styles.detailValue}>
                {[order.city, order.state].filter(Boolean).join(', ')}
                {order.postalCode ? ` - ${order.postalCode}` : ''}
              </span>
              <span style={styles.detailValue}>{order.country}</span>
              {order.phone && (
                <span style={styles.detailValue}>Phone: {order.phone}</span>
              )}
            </div>
            <div style={styles.detailCol}>
              <span style={styles.detailLabel}>BILLING BREAKDOWN</span>
              <span style={styles.billRow}>
                <span>Subtotal</span>
                <span>₹{(order.subtotal || 0).toLocaleString('en-IN')}</span>
              </span>
              <span style={styles.billRow}>
                <span>GST (18%)</span>
                <span>₹{(order.tax || 0).toLocaleString('en-IN')}</span>
              </span>
              <span style={styles.billRow}>
                <span>Shipping</span>
                <span>
                  {order.shippingFee
                    ? `₹${order.shippingFee.toLocaleString('en-IN')}`
                    : 'FREE'}
                </span>
              </span>
            </div>
          </div>

          {/* ---------- Tracking timeline ---------- */}
          {expanded[order.id] && (
            <div style={styles.trackingPanel} className="orders-tracking">
              {historyLoading[order.id] ? (
                <p style={styles.trackingEmpty}>Loading tracking details...</p>
              ) : (history[order.id] || []).length === 0 ? (
                <p style={styles.trackingEmpty}>No tracking updates yet.</p>
              ) : (
                <div style={styles.timeline}>
                  {(history[order.id] || []).map((entry, index) => {
                    const entries = history[order.id];
                    const currentIndex = entries.findIndex(
                      (item) => item.status === order.status
                    );
                    const isCurrent =
                      index === (currentIndex >= 0 ? currentIndex : entries.length - 1);
                    return (
                      <div key={entry.id || index} style={styles.timelineItem}>
                        <span
                          style={{
                            ...styles.timelineDot,
                            ...(isCurrent ? styles.timelineDotCurrent : {}),
                          }}
                        />
                        <div style={styles.timelineBody}>
                          <span
                            style={{
                              ...styles.timelineStatus,
                              ...(isCurrent ? styles.timelineCurrent : {}),
                            }}
                          >
                            {statusLabel(entry.status)}
                            {isCurrent && <span style={styles.currentTag}>Current</span>}
                          </span>
                          {entry.note && (
                            <span style={styles.timelineNote}>{entry.note}</span>
                          )}
                          <span style={styles.timelineDate}>
                            {formatTimelineDate(entry.changedAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div style={styles.footer}>
            <div style={styles.footerActions}>
              <button
                type="button"
                style={styles.trackBtn}
                onClick={() => toggleTracking(order.id)}
                aria-expanded={Boolean(expanded[order.id])}
              >
                {expanded[order.id] ? <FaChevronUp /> : <FaChevronDown />}
                {expanded[order.id] ? ' Hide tracking' : ' Track order'}
              </button>
              {!isAdmin &&
                (order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                  <button
                    type="button"
                    style={styles.cancelBtn}
                    disabled={cancelling === order.id}
                    onClick={() => handleCancel(order)}
                  >
                    <FaTimes />
                    {cancelling === order.id ? ' Cancelling...' : ' Cancel order'}
                  </button>
                )}
              <Link
                to={`/orders/${order.id}/invoice`}
                style={styles.invoiceLink}
                className="orders-invoice-link"
              >
                View Invoice
              </Link>
            </div>
            <span style={styles.total}>
              Total: ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const styles = {
  page: { maxWidth: 800, margin: '20px auto', padding: '0 16px' },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: 500, color: '#212121' },
  viewSwitch: { display: 'flex', gap: 8 },
  viewBtn: {
    background: 'white',
    color: '#212121',
    border: '1px solid #ddd',
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 500,
  },
  viewBtnActive: {
    background: '#2874f0',
    color: 'white',
    border: '1px solid #2874f0',
  },
  card: {
    background: 'white',
    borderRadius: 4,
    marginBottom: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    padding: '14px 20px',
    borderBottom: '1px solid #f0f0f0',
    background: '#fafafa',
  },
  headerLeft: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  orderId: { fontWeight: 600, fontSize: 15 },
  date: { fontSize: 13, color: '#878787' },
  customer: { fontSize: 13, color: '#555', fontWeight: 500 },
  statusArea: { display: 'flex', alignItems: 'center', gap: 10 },
  statusSelect: {
    width: 'auto',
    marginBottom: 0,
    padding: '6px 8px',
    fontSize: 13,
  },
  status: {
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  items: { padding: '12px 20px' },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    padding: '8px 0',
    borderBottom: '1px solid #f9f9f9',
    fontSize: 14,
  },
  itemName: { flex: 1, fontWeight: 500 },
  itemQty: { color: '#878787', margin: '0 20px' },
  itemPrice: { fontWeight: 600 },
  details: {
    display: 'flex',
    gap: 24,
    flexWrap: 'wrap',
    padding: '12px 20px',
    background: '#fafafa',
    borderTop: '1px solid #f0f0f0',
  },
  detailCol: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 220, gap: 2 },
  detailLabel: {
    fontSize: 11,
    color: '#878787',
    letterSpacing: 0.7,
    fontWeight: 600,
    marginBottom: 4,
  },
  detailValue: { fontSize: 12, color: '#555', lineHeight: 1.5 },
  billRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    fontSize: 12,
    color: '#555',
    lineHeight: 1.7,
  },
  trackingPanel: {
    padding: '16px 20px',
    borderTop: '1px solid #f0f0f0',
    background: '#fafafa',
  },
  trackingEmpty: { fontSize: 13, color: '#878787', textAlign: 'center', padding: 12 },
  timeline: { display: 'flex', flexDirection: 'column' },
  timelineItem: { display: 'flex', gap: 12, minHeight: 52 },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: '#fff',
    border: '2px solid #cfd8dc',
    marginTop: 3,
    flexShrink: 0,
    zIndex: 1,
  },
  timelineDotCurrent: {
    background: '#ff9f00',
    border: '2px solid #2874f0',
    boxShadow: '0 0 0 3px rgba(40,116,240,0.15)',
  },
  timelineBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    paddingBottom: 14,
    marginLeft: -19,
    borderLeft: '2px solid #e0e0e0',
    paddingLeft: 26,
    flex: 1,
  },
  timelineStatus: { fontSize: 14, fontWeight: 600, color: '#555' },
  timelineCurrent: { color: '#2874f0' },
  currentTag: {
    fontSize: 10,
    fontWeight: 700,
    color: '#2874f0',
    background: '#e3f2fd',
    borderRadius: 10,
    padding: '2px 7px',
    marginLeft: 8,
    verticalAlign: 'middle',
  },
  timelineNote: { fontSize: 13, color: '#444', lineHeight: 1.5 },
  timelineDate: { fontSize: 11, color: '#878787' },
  footerActions: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  trackBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'white',
    color: '#2874f0',
    border: '1px solid #2874f0',
    padding: '7px 12px',
    fontSize: 13,
    fontWeight: 600,
  },
  cancelBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'white',
    color: '#c62828',
    border: '1px solid #ffcdd2',
    padding: '7px 12px',
    fontSize: 13,
    fontWeight: 600,
  },
  footer: {
    padding: '12px 20px',
    borderTop: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  invoiceLink: { color: '#2874f0', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  total: { fontSize: 16, fontWeight: 700, color: '#212121' },
  loading: { textAlign: 'center', padding: 60, color: '#666' },
  empty: { textAlign: 'center', padding: 80 },
};

export default Orders;
