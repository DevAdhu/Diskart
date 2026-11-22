import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addressAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { FaEdit, FaTrash, FaPlus, FaArrowLeft, FaCheck } from 'react-icons/fa';

const emptyForm = {
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

const addressFields = [
  ['label', 'Label'],
  ['line1', 'Address line 1'],
  ['line2', 'Address line 2'],
  ['city', 'City'],
  ['state', 'State'],
  ['postalCode', 'Postal code'],
  ['country', 'Country'],
  ['phone', 'Phone'],
];

const requiredFields = ['label', 'line1', 'city', 'state', 'postalCode', 'country', 'phone'];

const formatAddress = (a) =>
  [a.line1, a.line2, [a.city, a.state].filter(Boolean).join(', '), a.postalCode, a.country]
    .filter(Boolean)
    .join(', ');

const AddressBook = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await addressAPI.list();
      setAddresses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      showToast('Could not load addresses', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const startEdit = (address) => {
    setEditingId(address.id);
    setForm({
      label: address.label || '',
      line1: address.line1 || '',
      line2: address.line2 || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || '',
      phone: address.phone || '',
      isDefault: Boolean(address.isDefault),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await addressAPI.update(editingId, form);
        showToast('Address updated', 'success');
      } else {
        await addressAPI.create(form);
        showToast('Address added', 'success');
      }
      cancelEdit();
      await loadAddresses();
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not save address', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (address) => {
    if (!window.confirm(`Delete the "${address.label || 'address'}" address?`)) return;
    try {
      await addressAPI.remove(address.id);
      showToast('Address deleted', 'success');
      await loadAddresses();
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not delete address', 'error');
    }
  };

  const handleSetDefault = async (address) => {
    try {
      // Send only editable fields — the id belongs in the URL.
      const payload = {
        label: address.label || '',
        line1: address.line1 || '',
        line2: address.line2 || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || '',
        phone: address.phone || '',
        isDefault: true,
      };
      await addressAPI.update(address.id, payload);
      showToast('Default address updated', 'success');
      await loadAddresses();
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not set default address', 'error');
    }
  };

  return (
    <div style={styles.page} className="address-page">
      <button style={styles.back} onClick={() => navigate('/checkout')}>
        <FaArrowLeft style={{ marginRight: 6 }} /> Back to Checkout
      </button>
      <div style={styles.titleRow}>
        <h2 style={styles.title}>Saved Addresses</h2>
        <button
          className="btn-primary"
          onClick={() => (showForm ? cancelEdit() : setShowForm(true))}
          style={styles.addBtn}
        >
          <FaPlus style={{ marginRight: 6 }} />
          {showForm ? 'Close' : 'Add Address'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form} className="address-form">
          <h3 style={styles.formTitle}>
            {editingId ? `Edit address #${editingId}` : 'New address'}
          </h3>
          <div style={styles.formGrid} className="address-form-grid">
            {addressFields.map(([name, label]) => (
              <label key={name} style={styles.field}>
                {label}
                <input
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  required={requiredFields.includes(name)}
                />
              </label>
            ))}
          </div>
          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              name="isDefault"
              checked={form.isDefault}
              onChange={handleChange}
              style={styles.checkbox}
            />
            Make this my default address
          </label>
          <div style={styles.formActions}>
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
            </button>
            <button type="button" style={styles.cancelBtn} onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={styles.loading}>Loading addresses...</div>
      ) : addresses.length === 0 ? (
        <div style={styles.empty}>
          <h3>No saved addresses yet</h3>
          <p style={styles.muted}>Add an address to make checkout faster.</p>
        </div>
      ) : (
        <div style={styles.list} className="address-list">
          {addresses.map((address) => (
            <div key={address.id} style={styles.card} className="address-card">
              <div style={styles.cardBody}>
                <div style={styles.cardHeader}>
                  <span style={styles.label}>{address.label || 'Address'}</span>
                  {address.isDefault && <span style={styles.defaultTag}>DEFAULT</span>}
                </div>
                <p style={styles.line}>{formatAddress(address)}</p>
                {address.phone && <p style={styles.line}>Phone: {address.phone}</p>}
              </div>
              <div style={styles.actions}>
                {!address.isDefault && (
                  <button style={styles.defaultBtn} onClick={() => handleSetDefault(address)}>
                    <FaCheck /> Set default
                  </button>
                )}
                <button style={styles.editBtn} onClick={() => startEdit(address)}>
                  <FaEdit /> Edit
                </button>
                <button style={styles.deleteBtn} onClick={() => handleDelete(address)}>
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={styles.footerNote}>
        Looking for your orders? <Link to="/orders" style={styles.link}>View orders</Link>
      </p>
    </div>
  );
};

const styles = {
  page: { maxWidth: 800, margin: '20px auto', padding: '0 16px' },
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
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: 500 },
  addBtn: { display: 'flex', alignItems: 'center' },
  form: {
    background: 'white',
    borderRadius: 4,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  formTitle: { fontSize: 17, fontWeight: 600, marginBottom: 16 },
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
  formActions: { display: 'flex', gap: 12 },
  cancelBtn: {
    background: '#f1f3f6',
    color: '#212121',
    border: '1px solid #ddd',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    background: 'white',
    borderRadius: 4,
    padding: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  cardBody: { flex: 1, minWidth: 220 },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  label: { fontWeight: 600, fontSize: 15 },
  defaultTag: {
    background: '#e3f2fd',
    color: '#1565c0',
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 3,
    padding: '2px 6px',
  },
  line: { fontSize: 13, color: '#555', lineHeight: 1.5 },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  defaultBtn: { background: '#e8f5e9', color: '#2e7d32', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 },
  editBtn: { background: '#e3f2fd', color: '#1565c0', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 },
  deleteBtn: { background: '#ffebee', color: '#c62828', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 },
  loading: { textAlign: 'center', padding: 60, color: '#666' },
  empty: { textAlign: 'center', padding: 60, background: 'white', borderRadius: 4 },
  muted: { color: '#878787', fontSize: 13 },
  footerNote: { textAlign: 'center', fontSize: 13, color: '#666', marginTop: 24 },
  link: { color: '#2874f0' },
};

export default AddressBook;
