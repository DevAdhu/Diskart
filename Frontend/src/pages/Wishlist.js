import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { FaShoppingCart, FaTrash, FaHeart, FaStar, FaRegStar } from 'react-icons/fa';

const Wishlist = () => {
  const { wishlist, removeFromWishlist, count } = useWishlist();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  // Most entries are already full products; resolve legacy id-only entries.
  useEffect(() => {
    let active = true;
    Promise.allSettled(
      wishlist.map((item) =>
        item && typeof item === 'object'
          ? Promise.resolve(item)
          : productAPI.getById(item).then((res) => res.data)
      )
    ).then((results) => {
      if (!active) return;
      setProducts(
        results
          .filter((result) => result.status === 'fulfilled' && result.value?.id != null)
          .map((result) => result.value)
      );
    });
    return () => {
      active = false;
    };
  }, [wishlist]);

  const addToCart = (product) => {
    if (product.stock === 0) {
      showToast(`${product.name} is out of stock`, 'error');
      return;
    }
    addItem(product, 1);
    showToast(`${product.name} added to cart!`, 'success');
  };

  const handleRemove = (product) => {
    removeFromWishlist(product.id);
    showToast(`${product.name} removed from wishlist`, 'info');
  };

  return (
    <div style={styles.page}>
      <div style={styles.titleRow}>
        <h2 style={styles.title}>My Wishlist</h2>
        <span style={styles.count}>{count} {count === 1 ? 'item' : 'items'}</span>
      </div>

      {products.length === 0 ? (
        <div style={styles.empty}>
          <FaHeart size={40} color="#ff6161" />
          <h2 style={styles.emptyTitle}>Your wishlist is empty</h2>
          <p style={styles.emptyText}>
            Save products you love by tapping the heart icon.
          </p>
          <Link to="/" style={styles.shopLink}>Continue shopping</Link>
        </div>
      ) : (
        <div style={styles.grid} className="home-grid">
          {products.map((product) => (
            <div key={product.id} style={styles.card}>
              <div
                style={styles.imgBox}
                className="home-img-box"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={styles.img}
                    className="home-img"
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                ) : (
                  <div style={styles.noImg}>No Image</div>
                )}
              </div>
              <div style={styles.info}>
                <p
                  style={styles.name}
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  {product.name}
                </p>
                <p style={styles.category}>{product.category}</p>
                {product.averageRating > 0 && (
                  <p style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((star) =>
                      star <= Math.round(product.averageRating) ? (
                        <FaStar key={star} size={12} color="#ff9f00" />
                      ) : (
                        <FaRegStar key={star} size={12} color="#d0d0d0" />
                      )
                    )}
                    <span style={styles.ratingCount}>
                      {Number(product.averageRating).toFixed(1)}
                    </span>
                  </p>
                )}
                <p style={styles.price}>
                  ₹{product.price?.toLocaleString('en-IN')}
                </p>
                <button
                  style={{
                    ...styles.addBtn,
                    ...(product.stock === 0 ? styles.disabledBtn : {}),
                  }}
                  disabled={product.stock === 0}
                  onClick={() => addToCart(product)}
                >
                  <FaShoppingCart style={{ marginRight: 6 }} />
                  Add to Cart
                </button>
                <button
                  type="button"
                  style={styles.removeBtn}
                  onClick={() => handleRemove(product)}
                >
                  <FaTrash style={{ marginRight: 6 }} />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { maxWidth: 1200, margin: '20px auto', padding: '0 16px' },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
    flexWrap: 'wrap',
  },
  title: { fontSize: 22, fontWeight: 500, color: '#212121' },
  count: { fontSize: 13, color: '#878787' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 16,
  },
  card: {
    background: 'white',
    borderRadius: 4,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  imgBox: {
    height: 200,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f9f9f9',
    overflow: 'hidden',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
  },
  img: { width: '100%', height: 200, objectFit: 'contain', padding: 12 },
  noImg: { color: '#aaa', fontSize: 13 },
  info: { padding: '12px 14px' },
  name: {
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 4,
    color: '#212121',
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  category: { fontSize: 12, color: '#878787', marginBottom: 6 },
  ratingRow: { display: 'flex', alignItems: 'center', marginBottom: 6 },
  ratingCount: { fontSize: 11, color: '#878787', marginLeft: 6 },
  price: { fontSize: 16, fontWeight: 700, color: '#212121', marginBottom: 10 },
  addBtn: {
    width: '100%',
    background: '#ff9f00',
    color: 'white',
    border: 'none',
    padding: '9px 0',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: { background: '#ccc', cursor: 'not-allowed' },
  removeBtn: {
    width: '100%',
    background: 'white',
    color: '#c62828',
    border: '1px solid #ffcdd2',
    padding: '8px 0',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  empty: {
    background: 'white',
    borderRadius: 4,
    padding: '60px 20px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  emptyTitle: { fontSize: 20, fontWeight: 500, margin: '12px 0 6px' },
  emptyText: { fontSize: 14, color: '#878787', marginBottom: 18 },
  shopLink: {
    display: 'inline-block',
    background: '#2874f0',
    color: 'white',
    padding: '10px 24px',
    borderRadius: 4,
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 14,
  },
};

export default Wishlist;
