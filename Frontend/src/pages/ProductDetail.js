import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { FaShoppingCart, FaArrowLeft } from 'react-icons/fa';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadProduct();
  }, [id]); // eslint-disable-line

  const loadProduct = async () => {
    try {
      const res = await productAPI.getById(id);
      setProduct(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existing = cart.find(i => i.id === product.id);
    let updated;
    if (existing) {
      updated = cart.map(i =>
        i.id === product.id ? { ...i, qty: i.qty + qty } : i
      );
    } else {
      updated = [...cart, { ...product, qty }];
    }
    localStorage.setItem('cart', JSON.stringify(updated));
    alert(`${product.name} added to cart!`);
    navigate('/cart');
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!product) return <div style={styles.loading}>Product not found.</div>;

  const allImages = product.images && product.images.length > 0
    ? product.images
    : product.imageUrl ? [product.imageUrl] : [];

  return (
    <div style={styles.page}>
      <button style={styles.back} onClick={() => navigate('/')}>
        <FaArrowLeft style={{marginRight:6}} /> Back
      </button>

      <div style={styles.card}>
        <div style={styles.imgSection}>
          <div style={styles.thumbnails}>
            {allImages.map((img, i) => (
              <div
                key={i}
                onClick={() => setActiveImg(i)}
                style={{
                  ...styles.thumb,
                  ...(activeImg === i ? styles.thumbActive : {})
                }}>
                <img src={img} alt={`view ${i+1}`} style={styles.thumbImg} />
              </div>
            ))}
          </div>

          <div style={styles.mainImg}>
            {allImages.length > 0 ? (
              <>
                <button
                   style={styles.imgNav}
                   onClick={() => setActiveImg(i =>
                   i === 0 ? allImages.length - 1 : i - 1)}>
                   ‹
                </button>
                <img
                  src={allImages[activeImg]}
                  alt={product.name}
                  style={styles.img}
                />
                <button
                  style={{...styles.imgNav, right: 8, left: 'auto'}}
                  onClick={() => setActiveImg(i =>
                  i === allImages.length - 1 ? 0 : i + 1)}>
                  ›
                </button>
              </>
            ) : (
              <div style={styles.noImg}>No Image</div>
            )}
          </div>
        </div>

        <div style={styles.info}>
          <p style={styles.category}>{product.category}</p>
          <h1 style={styles.name}>{product.name}</h1>
          <p style={styles.description}>
            {product.description || 'No description available.'}
          </p>
          <div style={styles.priceRow}>
            <span style={styles.price}>
              ₹{product.price?.toLocaleString('en-IN')}
            </span>
          </div>
          <p style={{
            ...styles.stock,
            color: product.stock > 0 ? '#388e3c' : '#c62828'
          }}>
            {product.stock > 0
              ? `✓ ${product.stock} in stock`
              : '✗ Out of stock'}
          </p>
          <div style={styles.qtyRow}>
            <span style={styles.qtyLabel}>Quantity:</span>
            <button style={styles.qtyBtn}
              onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <span style={styles.qtyVal}>{qty}</span>
            <button style={styles.qtyBtn}
              onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
          </div>
          <div style={styles.btnRow}>
            <button
              style={{...styles.cartBtn,
                ...(product.stock === 0 ? styles.disabled : {})}}
              disabled={product.stock === 0}
              onClick={addToCart}>
              <FaShoppingCart style={{marginRight:8}} />
              Add to Cart
            </button>
            <button
              style={{...styles.buyBtn,
                ...(product.stock === 0 ? styles.disabled : {})}}
              disabled={product.stock === 0}
              onClick={addToCart}>
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: { maxWidth: 1000, margin: '20px auto', padding: '0 16px' },
  back: {
    background: 'none', border: 'none', color: '#2874f0',
    cursor: 'pointer', fontSize: 14, display: 'flex',
    alignItems: 'center', marginBottom: 16, padding: 0, fontWeight: 500,
  },
  card: {
    background: 'white', borderRadius: 4,
    display: 'flex', gap: 40, padding: 32,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  imgSection: {
    display: 'flex', gap: 12, width: 380, flexShrink: 0,
  },
  thumbnails: {
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  thumb: {
    width: 60, height: 60, border: '1px solid #ddd',
    borderRadius: 4, overflow: 'hidden', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f9f9f9',
  },
  thumbActive: { border: '2px solid #2874f0' },
  thumbImg: { maxWidth: 55, maxHeight: 55, objectFit: 'contain' },
  mainImg: {
    flex: 1, minHeight: 300, background: '#f9f9f9',
    borderRadius: 4, display: 'flex', alignItems: 'center',
    justifyContent: 'center', position: 'relative', overflow: 'hidden',
  },
  img: { maxWidth: '90%', maxHeight: 300, objectFit: 'contain' },
  imgNav: {
    position: 'absolute',
    left: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.5)',
    border: 'none',
    borderRadius: '50%',
    width: 36,
    height: 36,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    color: 'white',
    fontWeight: 400,
    lineHeight: '1',
    zIndex: 2,
    padding: 0,
    margin: 0,
    boxSizing: 'border-box',
},
  noImg: { color: '#aaa', fontSize: 14 },
  info: { flex: 1 },
  category: {
    fontSize: 13, color: '#878787', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  name: { fontSize: 24, fontWeight: 500, color: '#212121', marginBottom: 12 },
  description: { fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 20 },
  priceRow: { marginBottom: 8 },
  price: { fontSize: 28, fontWeight: 700, color: '#212121' },
  stock: { fontSize: 14, fontWeight: 500, marginBottom: 24, marginTop: 8 },
  qtyRow: {
    display: 'flex', alignItems: 'center',
    gap: 12, marginBottom: 24,
  },
  qtyLabel: { fontSize: 14, fontWeight: 500, marginRight: 4 },
  qtyBtn: {
    width: 32, height: 32, borderRadius: '50%',
    border: '1px solid #ddd', background: 'white',
    fontSize: 18, cursor: 'pointer',
  },
  qtyVal: { fontSize: 16, fontWeight: 600, minWidth: 30, textAlign: 'center' },
  btnRow: { display: 'flex', gap: 12 },
  cartBtn: {
    flex: 1, background: '#ff9f00', color: 'white',
    border: 'none', padding: '14px 0', fontSize: 15,
    fontWeight: 600, borderRadius: 4, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  buyBtn: {
    flex: 1, background: '#fb641b', color: 'white',
    border: 'none', padding: '14px 0', fontSize: 15,
    fontWeight: 600, borderRadius: 4, cursor: 'pointer',
  },
  disabled: { background: '#ccc', cursor: 'not-allowed' },
  loading: { textAlign: 'center', padding: 80, color: '#666' },
};

export default ProductDetail;