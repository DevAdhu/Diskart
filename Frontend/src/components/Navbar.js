import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import {
  FaShoppingCart,
  FaHeart,
  FaUser,
  FaStore,
  FaBars,
  FaTimes,
  FaMapMarkerAlt,
} from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav className="app-nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
          <FaStore /> DisKart
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`nav-links${menuOpen ? ' nav-links-open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
            Home
          </Link>

          {user ? (
            <>
              <Link
                to="/orders"
                className="nav-link"
                onClick={() => setMenuOpen(false)}
              >
                My Orders
              </Link>
              <Link
                to="/wishlist"
                className="nav-link"
                onClick={() => setMenuOpen(false)}
              >
                <FaHeart /> Wishlist
                {wishlistCount > 0 && (
                  <span className="cart-badge wishlist-badge">{wishlistCount}</span>
                )}
              </Link>
              <Link
                to="/cart"
                className="nav-link"
                onClick={() => setMenuOpen(false)}
              >
                <FaShoppingCart /> Cart
                {itemCount > 0 && (
                  <span className="cart-badge">{itemCount}</span>
                )}
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/products"
                  className="nav-link"
                  onClick={() => setMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              <Link
                to="/addresses"
                className="nav-link"
                onClick={() => setMenuOpen(false)}
              >
                <FaMapMarkerAlt /> Addresses
              </Link>
              <span className="nav-user">
                <FaUser /> {user.name}
              </span>
              <button type="button" className="nav-logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="nav-link"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="nav-register"
                onClick={() => setMenuOpen(false)}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
