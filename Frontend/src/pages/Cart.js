import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import { FaTrash, FaPlus, FaMinus } from 'react-icons/fa';

const Cart = () => {
  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem('cart')) || []
  );
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const updateQty = (id, delta) => {
    const updated = cart.map(item =>
      item.id === id
        ? { ...item, qty: Math.max(1, item.qty + delta) }
        : item
    );
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const removeItem = (id) => {
    const updated = cart.filter(item => item.id !== id);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const placeOrder = async () => {
    if (!user) { navigate('/login'); return; }
    if (cart.length === 0) { alert('Cart is empty!'); return; }
    setLoading(true);
    try {
      await orderAPI.place(user.id, {
        productIds: cart.map(i => i.id),
        quantities: cart.map(i => i.qty),
      });
      localStorage.removeItem('cart');
      setCart([]);
      alert('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      alert(err.response?.data?.error || 'Order failed');
    }
    setLoading(false);
  };

  if (cart.length === 0) return (
    <div style={styles.empty}>
      <h2>Your cart is empty!</h2>
      <button
        className="btn-primary"
        style={{marginTop:16}}
        onClick={() => navigate('/')}>
        Continue Shopping
      </button>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <h2 style={styles.title}>My Cart ({cart.length} items)</h2>
        {cart.map(item => (
          <div key={item.id} style={styles.item}>
            <div style={styles.itemImg}>
              {item.imageUrl
                ? <img src={item.imageUrl} alt={item.name} style={styles.img} />
                : <div style={styles.noImg}>No Image</div>
              }
            </div>
            <div style={styles.itemInfo}>
              <p style={styles.itemName}>{item.name}</p>
              <p style={styles.itemCat}>{item.category}</p>
              <p style={styles.itemPrice}>
                ₹{(item.price * item.qty).toLocaleString('en-IN')}
              </p>
            </div>
            <div style={styles.itemActions}>
              <div style={styles.qtyRow}>
                <button
                  style={styles.qtyBtn}
                  onClick={() => updateQty(item.id, -1)}>
                  <FaMinus />
                </button>
                <span style={styles.qty}>{item.qty}</span>
                <button
                  style={styles.qtyBtn}
                  onClick={() => updateQty(item.id, 1)}>
                  <FaPlus />
                </button>
              </div>
              <button
                style={styles.removeBtn}
                onClick={() => removeItem(item.id)}>
                <FaTrash /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.right}>
        <div style={styles.summary}>
          <h3 style={styles.summaryTitle}>PRICE DETAILS</h3>
          <hr />
          {cart.map(item => (
            <div key={item.id} style={styles.summaryRow}>
              <span>{item.name} x{item.qty}</span>
              <span>₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <hr />
          <div style={styles.summaryRow}>
            <span>Delivery</span>
            <span style={{color:'green'}}>FREE</span>
          </div>
          <hr />
          <div style={{...styles.summaryRow, fontWeight:700, fontSize:16}}>
            <span>Total Amount</span>
            <span>₹{total.toLocaleString('en-IN')}</span>
          </div>
          <button
            style={styles.orderBtn}
            onClick={placeOrder}
            disabled={loading}>
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
          {!user && (
            <p style={styles.loginNote}>
              Please <span
                style={{color:'#2874f0',cursor:'pointer'}}
                onClick={() => navigate('/login')}>
                login
              </span> to place order
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    maxWidth: 1100,
    margin: '20px auto',
    padding: '0 16px',
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
  },
  left: { flex: 1 },
  title: {
    background: 'white',
    padding: '16px 20px',
    fontSize: 18,
    fontWeight: 500,
    borderBottom: '1px solid #f0f0f0',
    marginBottom: 0,
  },
  item: {
    background: 'white',
    padding: 20,
    display: 'flex',
    gap: 16,
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center',
  },
  itemImg: {
    width: 100,
    height: 100,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f9f9f9',
  },
  img: { maxWidth: 90, maxHeight: 90, objectFit: 'contain' },
  noImg: { color: '#aaa', fontSize: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: 500, marginBottom: 4 },
  itemCat: { fontSize: 13, color: '#878787', marginBottom: 8 },
  itemPrice: { fontSize: 16, fontWeight: 700 },
  itemActions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  qtyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    border: '1px solid #ddd',
    borderRadius: 4,
    padding: '4px 8px',
  },
  qtyBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    color: '#2874f0',
    padding: 4,
  },
  qty: { fontSize: 15, fontWeight: 600, minWidth: 24, textAlign: 'center' },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#878787',
    cursor: 'pointer',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  right: { width: 320, flexShrink: 0 },
  summary: {
    background: 'white',
    padding: 20,
    borderRadius: 4,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  summaryTitle: {
    fontSize: 13,
    color: '#878787',
    marginBottom: 12,
    letterSpacing: 1,
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    margin: '10px 0',
  },
  orderBtn: {
    width: '100%',
    background: '#fb641b',
    color: 'white',
    border: 'none',
    padding: 14,
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 4,
    cursor: 'pointer',
    marginTop: 16,
  },
  loginNote: {
    textAlign: 'center',
    fontSize: 13,
    color: '#666',
    marginTop: 12,
  },
  empty: {
    textAlign: 'center',
    padding: 80,
  },
};

export default Cart;