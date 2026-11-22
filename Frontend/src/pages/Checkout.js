import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addressAPI, paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { FaArrowLeft, FaCheck, FaCreditCard, FaMapMarkerAlt } from 'react-icons/fa';

const emptyAddress = {
  label: 'Home',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  phone: '',
  isDefault: false,
};

const RAZORPAY_SCRIPT_ID = 'razorpay-checkout-js';
const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

// The script is injected on demand: no npm dependency and no extra request on
// pages that never check out.
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.getElementById(RAZORPAY_SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const formatAddress = (a) =>
  [a.line1, a.line2, [a.city, a.state].filter(Boolean).join(', '), a.postalCode, a.country]
    .filter(Boolean)
    .join(', ');

const Checkout = () => {
  const { user } = useAuth();
  const { cart, total: subtotal, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [savingAddress, setSavingAddress] = useState(false);
  const [paying, setPaying] = useState(false);

  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const shippingFee = subtotal > 0 && subtotal < 499 ? 40 : 0;
  const grandTotal = subtotal + tax + shippingFee;

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await addressAPI.list();
      const list = Array.isArray(res.data) ? res.data : [];
      setAddresses(list);
      const preferred =
        list.find((a) => a.isDefault) || list[0];
      setSelectedAddressId((current) =>
        current && list.some((a) => a.id === current)
          ? current
          : preferred
          ? preferred.id
          : null
      );
    } catch (err) {
      console.error(err);
      showToast('Could not load saved addresses', 'error');
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const res = await addressAPI.create(addressForm);
      const created = res.data;
      showToast('Address saved', 'success');
      setAddressForm(emptyAddress);
      setShowAddressForm(false);
      await loadAddresses();
      if (created?.id) setSelectedAddressId(created.id);
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not save address', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const recordFailure = async (order, reason) => {
    if (!order?.orderId) return;
    try {
      await paymentAPI.failure({
        orderId: order.orderId,
        razorpayOrderId: order.razorpayOrderId,
        reason,
      });
    } catch (err) {
      // The user-facing message is shown regardless of whether the failure
      // callback could be recorded.
      console.error(err);
    }
  };

  const finishPayment = async (order, simulated) => {
    const res = await paymentAPI.verify({
      orderId: order.orderId,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      razorpaySignature: order.razorpaySignature,
    });
    clearCart();
    showToast(
      simulated
        ? 'Simulated payment successful — no real money was charged.'
        : 'Payment successful! Your order is confirmed.',
      'success'
    );
    const placedId = res.data?.id || order.orderId;
    navigate(`/orders/${placedId}/invoice`, { replace: true });
  };

  const handlePay = async () => {
    if (!selectedAddressId) {
      showToast('Please select a delivery address', 'error');
      return;
    }
    if (cart.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }

    setPaying(true);
    let createdOrder = null;
    try {
      const res = await paymentAPI.createRazorpayOrder({
        addressId: selectedAddressId,
        productIds: cart.map((item) => item.id),
        quantities: cart.map((item) => item.qty),
      });
      createdOrder = res.data || {};

      const keyId = createdOrder.keyId;
      const isDemoKey = !keyId || String(keyId).startsWith('rzp_test_your');

      if (isDemoKey) {
        // Local/demo backend without real Razorpay credentials: keep the whole
        // checkout flow testable by simulating a short successful payment.
        await new Promise((resolve) => window.setTimeout(resolve, 1200));
        await finishPayment(
          {
            ...createdOrder,
            razorpayPaymentId: `demo_payment_${Date.now()}`,
            razorpaySignature: 'demo_signature',
          },
          true
        );
        return;
      }

      const ready = await loadRazorpayScript();
      if (!ready) {
        throw new Error('Could not load the Razorpay checkout script');
      }

      await new Promise((resolve, reject) => {
        const options = {
          key: keyId,
          amount: createdOrder.amountPaise,
          currency: createdOrder.currency || 'INR',
          name: 'DisKart',
          description: `Order #${createdOrder.orderId}`,
          order_id: createdOrder.razorpayOrderId,
          prefill: {
            name: user?.name || '',
            contact: user?.phone || '',
            email: user?.email || '',
          },
          theme: { color: '#2874f0' },
          handler: (payment) => {
            resolve();
            finishPayment({
              ...createdOrder,
              razorpayPaymentId: payment.razorpay_payment_id,
              razorpaySignature: payment.razorpay_signature,
            }, false).catch((err) => {
              console.error(err);
              showToast(
                err.response?.data?.error || 'Payment verification failed',
                'error'
              );
            });
          },
          modal: {
            ondismiss: () => {
              reject(new Error('Payment was cancelled'));
            },
          },
        };
        try {
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', (event) => {
            reject(new Error(event?.error?.description || 'Payment failed'));
          });
          rzp.open();
        } catch (err) {
          reject(err);
        }
      });
    } catch (err) {
      console.error(err);
      await recordFailure(createdOrder, err?.message || 'Payment failed');
      showToast(
        err?.message === 'Payment was cancelled'
          ? 'Payment was cancelled. Please try again.'
          : err.response?.data?.error || err?.message || 'Payment failed. Please try again.',
        'error'
      );
    } finally {
      setPaying(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div style={styles.empty}>
        <h2>Your cart is empty</h2>
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page} className="checkout-page">
      <button style={styles.back} onClick={() => navigate('/cart')}>
        <FaArrowLeft style={{ marginRight: 6 }} /> Back to Cart
      </button>
      <h2 style={styles.title}>Checkout</h2>

      <div style={styles.layout} className="checkout-layout">
        <div style={styles.main}>
          {/* ---------- Delivery address ---------- */}
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>
                <FaMapMarkerAlt style={{ marginRight: 8, color: '#2874f0' }} />
                Delivery Address
              </h3>
              <Link to="/addresses" style={styles.manageLink}>
                Manage addresses
              </Link>
            </div>

            {loadingAddresses ? (
              <p style={styles.muted}>Loading addresses...</p>
            ) : addresses.length === 0 ? (
              <p style={styles.muted}>
                You have no saved addresses. Add one below to continue.
              </p>
            ) : (
              <div style={styles.addressList}>
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    style={{
                      ...styles.addressCard,
                      ...(selectedAddressId === address.id ? styles.addressSelected : {}),
                    }}
                  >
                    <input
                      type="radio"
                      name="selectedAddress"
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                      style={styles.radio}
                    />
                    <span style={{ flex: 1 }}>
                      <span style={styles.addressLabel}>
                        {address.label || 'Address'}
                        {address.isDefault && (
                          <span style={styles.defaultTag}>DEFAULT</span>
                        )}
                      </span>
                      <span style={styles.addressLine}>{formatAddress(address)}</span>
                      {address.phone && (
                        <span style={styles.addressLine}>Phone: {address.phone}</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}

            <button
              type="button"
              style={styles.addLink}
              onClick={() => setShowAddressForm((open) => !open)}
            >
              {showAddressForm ? '− Hide address form' : '+ Add new address'}
            </button>

            {showAddressForm && (
              <form onSubmit={handleAddAddress} style={styles.addressForm}>
                <div style={styles.formGrid}>
                  {[
                    ['label', 'Label'],
                    ['line1', 'Address line 1'],
                    ['line2', 'Address line 2'],
                    ['city', 'City'],
                    ['state', 'State'],
                    ['postalCode', 'Postal code'],
                    ['country', 'Country'],
                    ['phone', 'Phone'],
                  ].map(([name, label]) => (
                    <label key={name} style={styles.field}>
                      {label}
                      <input
                        name={name}
                        value={addressForm[name]}
                        onChange={handleAddressChange}
                        required={['label', 'line1', 'city', 'state', 'postalCode', 'country', 'phone'].includes(name)}
                      />
                    </label>
                  ))}
                </div>
                <label style={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={addressForm.isDefault}
                    onChange={handleAddressChange}
                    style={styles.checkbox}
                  />
                  Make this my default address
                </label>
                <button className="btn-primary" type="submit" disabled={savingAddress}>
                  {savingAddress ? 'Saving...' : 'Save Address'}
                </button>
              </form>
            )}
          </section>

          {/* ---------- Items ---------- */}
          <section style={styles.panel}>
            <h3 style={styles.panelTitle}>Your Items</h3>
            {cart.map((item) => (
              <div key={item.id} style={styles.item}>
                <span style={styles.itemName}>
                  {item.name} <span style={styles.muted}>x{item.qty}</span>
                </span>
                <span style={styles.itemPrice}>
                  ₹{(item.price * item.qty).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </section>
        </div>

        {/* ---------- Bill ---------- */}
        <aside style={styles.right} className="checkout-right">
          <div style={styles.summary}>
            <h3 style={styles.summaryTitle}>PRICE DETAILS</h3>
            <hr />
            <div style={styles.summaryRow}>
              <span>Subtotal ({cart.length} items)</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>GST (18%)</span>
              <span>₹{tax.toLocaleString('en-IN')}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Shipping</span>
              <span style={{ color: shippingFee === 0 ? '#388e3c' : undefined }}>
                {shippingFee === 0 ? 'FREE' : `₹${shippingFee.toLocaleString('en-IN')}`}
              </span>
            </div>
            <hr />
            <div style={styles.totalRow}>
              <span>Total Amount</span>
              <span>₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
            <p style={styles.note}>
              The final payable amount is confirmed by the payment gateway.
            </p>
            <button
              style={{
                ...styles.payBtn,
                ...(paying ? styles.disabled : {}),
              }}
              onClick={handlePay}
              disabled={paying}
            >
              <FaCreditCard style={{ marginRight: 8 }} />
              {paying ? 'Processing...' : 'Pay with Razorpay'}
            </button>
            <p style={styles.secureNote}>
              <FaCheck style={{ marginRight: 4 }} /> Secure payment · You will only be
              charged after clicking Pay
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

const styles = {
  page: { maxWidth: 1100, margin: '20px auto', padding: '0 16px' },
  back: {
    background: 'none',
    border: 'none',
    color: '#2874f0',
    cursor: 'pointer',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    marginBottom: 12,
    padding: 0,
    fontWeight: 500,
  },
  title: { fontSize: 22, fontWeight: 500, marginBottom: 20 },
  layout: { display: 'flex', gap: 16, alignItems: 'flex-start' },
  main: { flex: 1, minWidth: 0 },
  right: { width: 330, flexShrink: 0 },
  panel: {
    background: 'white',
    borderRadius: 4,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  panelTitle: { fontSize: 17, fontWeight: 600, marginBottom: 16 },
  manageLink: { color: '#2874f0', fontSize: 13, textDecoration: 'none' },
  muted: { color: '#878787', fontSize: 13 },
  addressList: { display: 'flex', flexDirection: 'column', gap: 12 },
  addressCard: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    padding: 14,
    border: '1px solid #ddd',
    borderRadius: 4,
    cursor: 'pointer',
  },
  addressSelected: { borderColor: '#2874f0', background: '#f3f8ff' },
  radio: { width: 'auto', padding: 0, margin: '3px 0 0', flexShrink: 0 },
  addressLabel: { display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 4 },
  defaultTag: {
    background: '#e3f2fd',
    color: '#1565c0',
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 3,
    padding: '2px 6px',
    marginLeft: 8,
  },
  addressLine: { display: 'block', fontSize: 13, color: '#555', lineHeight: 1.5 },
  addLink: {
    background: 'none',
    color: '#2874f0',
    padding: '12px 0 0',
    fontSize: 14,
    fontWeight: 600,
  },
  addressForm: { marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 16 },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '0 12px',
  },
  field: { display: 'flex', flexDirection: 'column', fontSize: 13, color: '#555' },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    margin: '4px 0 16px',
  },
  checkbox: { width: 'auto', padding: 0, margin: 0 },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: 14,
  },
  itemName: { flex: 1 },
  itemPrice: { fontWeight: 600 },
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
    gap: 8,
    fontSize: 14,
    margin: '10px 0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    fontSize: 16,
    fontWeight: 700,
    margin: '12px 0',
  },
  note: { fontSize: 11, color: '#878787', margin: '4px 0 12px' },
  payBtn: {
    width: '100%',
    background: '#fb641b',
    color: 'white',
    padding: 14,
    fontSize: 15,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { background: '#ccc', cursor: 'not-allowed' },
  secureNote: { fontSize: 11, color: '#878787', textAlign: 'center', marginTop: 10 },
  empty: { textAlign: 'center', padding: 80 },
};

export default Checkout;
