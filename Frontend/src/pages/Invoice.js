import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaPrint } from 'react-icons/fa';

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const Invoice = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    let active = true;
    setLoading(true);
    orderAPI
      .getById(id)
      .then((res) => {
        if (active) setOrder(res.data);
      })
      .catch((err) => {
        if (active) {
          console.error(err);
          setError(err.response?.data?.error || 'Could not load this invoice.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, user, navigate]);

  if (loading) return <div style={styles.loading}>Loading invoice...</div>;

  if (error || !order) {
    return (
      <div style={styles.page}>
        <h2 style={styles.error}>{error || 'Order not found.'}</h2>
        <Link to="/orders" className="btn-primary" style={styles.linkButton}>
          Back to Orders
        </Link>
      </div>
    );
  }

  const addressLine2 = [order.addressLine1, order.addressLine2].filter(Boolean).join(', ');
  const cityLine = [order.city, order.state].filter(Boolean).join(', ');

  return (
    <div style={styles.page} className="invoice-page">
      <div className="no-print" style={styles.toolbar}>
        <button style={styles.back} onClick={() => navigate('/orders')}>
          <FaArrowLeft style={{ marginRight: 6 }} /> Back to Orders
        </button>
        <button style={styles.printBtn} onClick={() => window.print()}>
          <FaPrint style={{ marginRight: 8 }} /> Print / Save as PDF
        </button>
      </div>

      {/* Only this block is visible when printing (see App.css @media print). */}
      <div style={styles.paper} className="invoice-print-area">
        <div style={styles.invoiceHeader} className="invoice-header">
          <div>
            <h1 style={styles.brand}>DisKart</h1>
            <p style={styles.sellerLine}>Online Retail Store</p>
            <p style={styles.sellerLine}>Bengaluru, Karnataka 560001, India</p>
            <p style={styles.sellerLine}>GSTIN: 29ABCDE1234F1Z5</p>
          </div>
          <div style={styles.headerRight}>
            <h2 style={styles.invoiceTitle}>INVOICE</h2>
            <p style={styles.meta}>Order #{order.id}</p>
            <p style={styles.meta}>
              Date:{' '}
              {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'}
            </p>
            <p style={styles.meta}>Status: {order.status}</p>
          </div>
        </div>

        <hr style={styles.divider} />

        <div style={styles.parties} className="invoice-parties">
          <div style={styles.party}>
            <h3 style={styles.partyTitle}>BILL TO</h3>
            <p style={styles.partyName}>{order.recipientName || order.customerName || user?.name || 'Customer'}</p>
            <p style={styles.partyLine}>{addressLine2}</p>
            <p style={styles.partyLine}>{cityLine}</p>
            <p style={styles.partyLine}>
              {[order.postalCode, order.country].filter(Boolean).join(' ')}
            </p>
            {order.phone && <p style={styles.partyLine}>Phone: {order.phone}</p>}
          </div>
          <div style={styles.party}>
            <h3 style={styles.partyTitle}>SOLD BY</h3>
            <p style={styles.partyName}>DisKart</p>
            <p style={styles.partyLine}>Online Retail Store</p>
            <p style={styles.partyLine}>Bengaluru, Karnataka 560001, India</p>
            <p style={styles.partyLine}>GSTIN: 29ABCDE1234F1Z5</p>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, textAlign: 'left' }}>Item</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Qty</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Unit Price</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, i) => (
              <tr key={i}>
                <td style={styles.td}>{item.productName}</td>
                <td style={{ ...styles.td, textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ ...styles.td, textAlign: 'right' }}>{rupees(item.price)}</td>
                <td style={{ ...styles.td, textAlign: 'right' }}>
                  {rupees(item.price * item.quantity)}
                </td>
              </tr>
            ))}
            {(!order.items || order.items.length === 0) && (
              <tr>
                <td colSpan="4" style={{ ...styles.td, textAlign: 'center', color: '#878787' }}>
                  No line items available.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={styles.totals}>
          <div style={styles.totalRow}>
            <span>Subtotal</span>
            <span>{rupees(order.subtotal)}</span>
          </div>
          <div style={styles.totalRow}>
            <span>GST (18%)</span>
            <span>{rupees(order.tax)}</span>
          </div>
          <div style={styles.totalRow}>
            <span>Shipping</span>
            <span>
              {order.shippingFee ? rupees(order.shippingFee) : 'FREE'}
            </span>
          </div>
          <div style={styles.grandTotal}>
            <span>Total Payable</span>
            <span>{rupees(order.totalAmount)}</span>
          </div>
        </div>

        <hr style={styles.divider} />
        <p style={styles.footer}>
          Thank you for shopping with DisKart. This is a computer-generated invoice.
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: { maxWidth: 800, margin: '20px auto', padding: '0 16px' },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  back: {
    background: 'none',
    color: '#2874f0',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    padding: 0,
    fontWeight: 500,
  },
  printBtn: {
    background: '#fb641b',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    fontSize: 14,
  },
  paper: {
    background: 'white',
    padding: 32,
    borderRadius: 4,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  invoiceHeader: { display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 },
  brand: { fontSize: 28, color: '#2874f0', fontWeight: 700, marginBottom: 4 },
  sellerLine: { fontSize: 12, color: '#555', lineHeight: 1.6 },
  headerRight: { textAlign: 'right' },
  invoiceTitle: { fontSize: 22, letterSpacing: 2, color: '#212121', marginBottom: 6 },
  meta: { fontSize: 12, color: '#555', lineHeight: 1.6 },
  divider: { border: 'none', borderTop: '1px solid #ddd', margin: '20px 0' },
  parties: { display: 'flex', gap: 40, flexWrap: 'wrap' },
  party: { flex: 1, minWidth: 220, marginBottom: 24 },
  partyTitle: { fontSize: 11, letterSpacing: 1, color: '#878787', marginBottom: 8 },
  partyName: { fontSize: 14, fontWeight: 600, marginBottom: 4 },
  partyLine: { fontSize: 12, color: '#555', lineHeight: 1.6 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    padding: '10px 8px',
    background: '#fafafa',
    borderBottom: '1px solid #ddd',
    color: '#878787',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  td: { padding: '12px 8px', borderBottom: '1px solid #f0f0f0' },
  totals: { marginLeft: 'auto', width: 280, marginTop: 24 },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    fontSize: 13,
    padding: '6px 0',
  },
  grandTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    fontSize: 16,
    fontWeight: 700,
    borderTop: '1px solid #ddd',
    marginTop: 8,
    paddingTop: 12,
  },
  footer: { fontSize: 11, color: '#878787', textAlign: 'center' },
  loading: { textAlign: 'center', padding: 60, color: '#666' },
  error: { textAlign: 'center', fontSize: 18, color: '#c62828', marginBottom: 20 },
  linkButton: { display: 'inline-block', textDecoration: 'none' },
};

export default Invoice;
