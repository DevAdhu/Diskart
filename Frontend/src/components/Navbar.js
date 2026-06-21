import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaShoppingCart, FaUser, FaStore } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <FaStore style={{ marginRight: 8 }} />
          DisKart
        </Link>

        <div style={styles.links}>
          <Link to="/" style={styles.link}>Home</Link>

          {user ? (
            <>
              <Link to="/orders" style={styles.link}>My Orders</Link>
              <Link to="/cart" style={styles.link}>
                <FaShoppingCart /> Cart
              </Link>
              <span style={styles.userName}>
                <FaUser style={{ marginRight: 4 }} />
                {user.name}
              </span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link}>Login</Link>
              <Link to="/register" style={styles.registerBtn}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    background: '#2874f0',
    padding: '0 16px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    color: 'white',
    textDecoration: 'none',
    fontSize: 22,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
  },
  userName: {
    color: 'white',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
  },
  logoutBtn: {
    background: 'white',
    color: '#2874f0',
    border: 'none',
    padding: '6px 14px',
    borderRadius: 4,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
  },
  registerBtn: {
    background: 'white',
    color: '#2874f0',
    padding: '6px 14px',
    borderRadius: 4,
    fontWeight: 600,
    textDecoration: 'none',
    fontSize: 13,
  },
};

export default Navbar;