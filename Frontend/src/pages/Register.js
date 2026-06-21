import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authAPI.register(form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.left}>
          <h1 style={styles.brand}>DisKart</h1>
          <p style={styles.tagline}>Looks like you're new here! Sign up to get started</p>
        </div>
        <div style={styles.right}>
          <h2 style={styles.title}>Create Account</h2>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <input
              placeholder="Full Name"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required
            />
            <button
              type="submit"
              className="btn-primary"
              style={styles.btn}
              disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <p style={styles.switch}>
            Existing user?{' '}
            <Link to="/login" style={styles.switchLink}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f1f3f6',
  },
  card: {
    display: 'flex',
    background: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    width: 750,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  left: {
    background: '#2874f0',
    padding: '40px 30px',
    width: 300,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  brand: { color: 'white', fontSize: 28, marginBottom: 16 },
  tagline: { color: '#9fc5f8', fontSize: 16, lineHeight: 1.6 },
  right: { padding: '40px 30px', flex: 1 },
  title: { fontSize: 22, marginBottom: 24, color: '#212121' },
  btn: { width: '100%', padding: 14, fontSize: 16, marginTop: 8 },
  error: {
    background: '#fff3f3',
    border: '1px solid #ffcdd2',
    color: '#c62828',
    padding: '10px 14px',
    borderRadius: 4,
    marginBottom: 16,
    fontSize: 14,
  },
  switch: { marginTop: 20, textAlign: 'center', fontSize: 14, color: '#666' },
  switchLink: { color: '#2874f0', fontWeight: 600, textDecoration: 'none' },
};

export default Register;