import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div style={styles.page}>
    <h1 style={styles.code}>404</h1>
    <h2 style={styles.title}>Page not found</h2>
    <p style={styles.text}>The page you are looking for does not exist.</p>
    <Link to="/" className="btn-primary" style={styles.link}>
      Back to Home
    </Link>
  </div>
);

const styles = {
  page: { textAlign: 'center', padding: '80px 16px', color: '#212121' },
  code: { fontSize: 64, fontWeight: 700, color: '#2874f0', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 500, marginBottom: 12 },
  text: { fontSize: 14, color: '#666', marginBottom: 24 },
  link: { textDecoration: 'none', display: 'inline-block' },
};

export default NotFound;
