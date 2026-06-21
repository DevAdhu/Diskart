import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';

const statusColors = {
  PENDING:   { bg: '#fff8e1', color: '#f57f17' },
  CONFIRMED: { bg: '#e3f2fd', color: '#1565c0' },
  SHIPPED:   { bg: '#f3e5f5', color: '#6a1b9a' },
  DELIVERED: { bg: '#e8f5e9', color: '#2e7d32' },
  CANCELLED: { bg: '#ffebee', color: '#c62828' },
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await orderAPI.getMyOrders(user.id);
      setOrders(res.data.reverse());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) return (
    <div style={styles.loading}>Loading orders...</div>
  );

  if (orders.length === 0) return (
    <div style={styles.empty}>
      <h2>No orders yet!</h2>
      <button
        className="btn-primary"
        style={{marginTop:16}}
        onClick={() => navigate('/')}>
        Start Shopping
      </button>
    </div>
  );

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>My Orders</h2>
      {orders.map(order => (
        <div key={order.id} style={styles.card}>
          <div style={styles.header}>
            <div>
              <span style={styles.orderId}>Order #{order.id}</span>
              <span style={styles.date}>
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day:'numeric', month:'long', year:'numeric'
                })}
              </span>
            </div>
            <span style={{
              ...styles.status,
              background: statusColors[order.status]?.bg,
              color: statusColors[order.status]?.color,
            }}>
              {order.status}
            </span>
          </div>

          <div style={styles.items}>
            {order.items?.map((item, i) => (
              <div key={i} style={styles.item}>
                <span style={styles.itemName}>{item.productName}</span>
                <span style={styles.itemQty}>Qty: {item.quantity}</span>
                <span style={styles.itemPrice}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div style={styles.footer}>
            <span style={styles.total}>
              Total: ₹{order.totalAmount?.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const styles = {
  page: {
    maxWidth: 800,
    margin: '20px auto',
    padding: '0 16px',
  },
  title: {
    fontSize: 22,
    fontWeight: 500,
    marginBottom: 20,
    color: '#212121',
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
    padding: '14px 20px',
    borderBottom: '1px solid #f0f0f0',
    background: '#fafafa',
  },
  orderId: {
    fontWeight: 600,
    fontSize: 15,
    marginRight: 12,
  },
  date: {
    fontSize: 13,
    color: '#878787',
  },
  status: {
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  items: { padding: '12px 20px' },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f9f9f9',
    fontSize: 14,
  },
  itemName: { flex: 1, fontWeight: 500 },
  itemQty: { color: '#878787', margin: '0 20px' },
  itemPrice: { fontWeight: 600 },
  footer: {
    padding: '12px 20px',
    borderTop: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  total: {
    fontSize: 16,
    fontWeight: 700,
    color: '#212121',
  },
  loading: { textAlign: 'center', padding: 60, color: '#666' },
  empty: { textAlign: 'center', padding: 80 },
};

export default Orders;