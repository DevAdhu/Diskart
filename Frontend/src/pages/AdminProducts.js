import React, { useState, useEffect, useCallback } from 'react';
import { productAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { FaEdit, FaTrash, FaPlus, FaTimes } from 'react-icons/fa';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category: '',
  imageUrl: '',
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll();
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast('Could not load products', 'error');
      console.error(err);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price != null ? product.price : '',
      stock: product.stock != null ? product.stock : '',
      category: product.category || '',
      imageUrl: product.imageUrl || '',
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
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      category: form.category.trim(),
      imageUrl: form.imageUrl.trim(),
    };
    try {
      if (editingId) {
        await productAPI.update(editingId, payload);
        showToast('Product updated', 'success');
      } else {
        await productAPI.create(payload);
        showToast('Product created', 'success');
      }
      cancelEdit();
      await loadProducts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not save product', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await productAPI.delete(product.id);
      showToast('Product deleted', 'success');
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not delete product', 'error');
    }
  };

  return (
    <div style={styles.page} className="admin-page">
      <div style={styles.titleRow}>
        <h2 style={styles.title}>Manage Products</h2>
        <button
          className="btn-primary"
          onClick={() => {
            if (showForm) cancelEdit();
            else setShowForm(true);
          }}
          style={styles.addBtn}
        >
          {showForm ? <FaTimes /> : <FaPlus />}
          {showForm ? ' Close' : ' Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form} className="admin-form">
          <h3 style={styles.formTitle}>
            {editingId ? `Edit product #${editingId}` : 'New product'}
          </h3>
          <div style={styles.formGrid} className="admin-form-grid">
            <label style={styles.field}>
              Name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>
            <label style={styles.field}>
              Category
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              />
            </label>
            <label style={styles.field}>
              Price (₹)
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
              />
            </label>
            <label style={styles.field}>
              Stock
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                min="0"
                required
              />
            </label>
            <label style={{ ...styles.field, gridColumn: '1 / -1' }}>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                style={styles.textarea}
              />
            </label>
            <label style={{ ...styles.field, gridColumn: '1 / -1' }}>
              Image URL
              <input
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://..."
              />
            </label>
          </div>
          <div style={styles.formActions}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
            </button>
            <button type="button" style={styles.cancelBtn} onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={styles.tableWrap} className="admin-table-wrap">
        {loading ? (
          <div style={styles.loading}>Loading products...</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td style={styles.td}>{product.id}</td>
                  <td style={styles.td}>{product.name}</td>
                  <td style={styles.td}>{product.category}</td>
                  <td style={styles.td}>₹{product.price?.toLocaleString('en-IN')}</td>
                  <td style={styles.td}>{product.stock}</td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={styles.editBtn}
                        onClick={() => startEdit(product)}
                        aria-label={`Edit ${product.name}`}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        style={styles.deleteBtn}
                        onClick={() => handleDelete(product)}
                        aria-label={`Delete ${product.name}`}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="6" style={styles.noProducts}>
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { maxWidth: 1100, margin: '20px auto', padding: '0 16px' },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: 500, color: '#212121' },
  addBtn: { display: 'flex', alignItems: 'center', gap: 8 },
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
    gap: '0 16px',
  },
  field: { display: 'flex', flexDirection: 'column', fontSize: 13, color: '#555' },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: 4,
    fontSize: 14,
    marginBottom: 12,
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  formActions: { display: 'flex', gap: 12, marginTop: 8 },
  cancelBtn: {
    background: '#f1f3f6',
    color: '#212121',
    border: '1px solid #ddd',
    padding: '10px 20px',
  },
  tableWrap: {
    background: 'white',
    borderRadius: 4,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflowX: 'auto',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    background: '#fafafa',
    borderBottom: '1px solid #eee',
    color: '#878787',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    whiteSpace: 'nowrap',
  },
  td: { padding: '12px 16px', borderBottom: '1px solid #f0f0f0' },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  editBtn: {
    background: '#e3f2fd',
    color: '#1565c0',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    fontSize: 12,
  },
  deleteBtn: {
    background: '#ffebee',
    color: '#c62828',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    fontSize: 12,
  },
  noProducts: { textAlign: 'center', padding: 40, color: '#666' },
  loading: { textAlign: 'center', padding: 60, color: '#666' },
};

export default AdminProducts;
