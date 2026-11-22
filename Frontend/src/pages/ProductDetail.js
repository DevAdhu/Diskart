import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productAPI, reviewAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import {
  FaShoppingCart,
  FaArrowLeft,
  FaStar,
  FaRegStar,
  FaTrash,
  FaHeart,
  FaRegHeart,
} from 'react-icons/fa';

const emptyReviews = { averageRating: 0, totalReviews: 0, reviews: [] };

const RatingStars = ({ value, size = 14 }) => (
  <span style={styles.stars} aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((star) =>
      star <= Math.round(value || 0) ? (
        <FaStar key={star} size={size} color="#ff9f00" />
      ) : (
        <FaRegStar key={star} size={size} color="#d0d0d0" />
      )
    )}
  </span>
);

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
};

const renderSpecifications = (specs) => {
  if (!specs) return null;
  if (Array.isArray(specs)) {
    return specs.map((spec, i) => (
      <div key={i} style={styles.specRow}>
        <span style={styles.specKey}>Specification {i + 1}</span>
        <span style={styles.specValue}>{String(spec)}</span>
      </div>
    ));
  }
  if (typeof specs === 'object') {
    return Object.entries(specs).map(([key, value]) => (
      <div key={key} style={styles.specRow}>
        <span style={styles.specKey}>{key}</span>
        <span style={styles.specValue}>{String(value)}</span>
      </div>
    ));
  }
  return <p style={styles.specValue}>{String(specs)}</p>;
};

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [reviewData, setReviewData] = useState(emptyReviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { addRecentlyViewed } = useRecentlyViewed();

  const loadProduct = async () => {
    try {
      const res = await productAPI.getById(id);
      setProduct(res.data);
      addRecentlyViewed(id);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadRecommendations = async () => {
    try {
      const res = await productAPI.recommendations(id, 6);
      setRecommendations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setRecommendations([]);
    }
  };

  const loadReviews = async () => {
    try {
      const res = await reviewAPI.list(id);
      setReviewData(res.data || emptyReviews);
    } catch (err) {
      console.error(err);
      setReviewData(emptyReviews);
    }
  };

  useEffect(() => {
    setLoading(true);
    setProduct(null);
    setReviewData(emptyReviews);
    setRecommendations([]);
    setQty(1);
    setActiveImg(0);
    loadProduct();
    loadReviews();
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addToCart = () => {
    addItem(product, qty);
    showToast(`${product.name} added to cart!`, 'success');
    navigate('/cart');
  };

  const isOwnReview = (review) => {
    if (!user) return false;
    if (review.userId && user.id && review.userId === user.id) return true;
    return (
      Boolean(review.userName && user.name) &&
      String(review.userName).trim().toLowerCase() === String(user.name).trim().toLowerCase()
    );
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!comment.trim()) {
      showToast('Please write a comment', 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewAPI.add(id, { rating, comment: comment.trim() });
      setComment('');
      setRating(5);
      showToast('Thanks for your review!', 'success');
      await Promise.all([loadReviews(), loadProduct()]);
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (review) => {
    if (!window.confirm('Delete your review?')) return;
    try {
      await reviewAPI.remove(id, review.id);
      showToast('Review deleted', 'success');
      await Promise.all([loadReviews(), loadProduct()]);
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not delete review', 'error');
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!product) return <div style={styles.loading}>Product not found.</div>;

  const allImages =
    product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
      ? [product.imageUrl]
      : [];

  const specs = renderSpecifications(product.specifications);

  return (
    <div style={styles.page}>
      <button style={styles.back} onClick={() => navigate('/')}>
        <FaArrowLeft style={{ marginRight: 6 }} /> Back
      </button>

      <div style={styles.card} className="product-detail-card">
        <div style={styles.imgSection} className="product-detail-img-section">
          <div style={styles.thumbnails} className="product-detail-thumbnails">
            {allImages.map((img, i) => (
              <div
                key={i}
                onClick={() => setActiveImg(i)}
                style={{
                  ...styles.thumb,
                  ...(activeImg === i ? styles.thumbActive : {}),
                }}
              >
                <img src={img} alt={`view ${i + 1}`} style={styles.thumbImg} />
              </div>
            ))}
          </div>

          <div style={styles.mainImg}>
            {allImages.length > 0 ? (
              <>
                <button
                  style={styles.imgNav}
                  onClick={() =>
                    setActiveImg((i) =>
                      i === 0 ? allImages.length - 1 : i - 1
                    )
                  }
                >
                  ‹
                </button>
                <img
                  src={allImages[activeImg]}
                  alt={product.name}
                  style={styles.img}
                />
                <button
                  style={{ ...styles.imgNav, right: 8, left: 'auto' }}
                  onClick={() =>
                    setActiveImg((i) =>
                      i === allImages.length - 1 ? 0 : i + 1
                    )
                  }
                >
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
          {(product.brand || product.averageRating > 0) && (
            <div style={styles.ratingLine}>
              {product.brand && <span style={styles.brand}>{product.brand}</span>}
              {product.averageRating > 0 && (
                <span style={styles.ratingInline}>
                  <RatingStars value={product.averageRating} />
                  <span style={styles.ratingText}>
                    {Number(product.averageRating).toFixed(1)} (
                    {product.reviewCount || 0})
                  </span>
                </span>
              )}
            </div>
          )}
          <p style={styles.description}>
            {product.description || 'No description available.'}
          </p>
          <div style={styles.priceRow}>
            <span style={styles.price}>
              ₹{product.price?.toLocaleString('en-IN')}
            </span>
          </div>
          <p
            style={{
              ...styles.stock,
              color: product.stock > 0 ? '#388e3c' : '#c62828',
            }}
          >
            {product.stock > 0
              ? `✓ ${product.stock} in stock`
              : '✗ Out of stock'}
          </p>
          <div style={styles.qtyRow}>
            <span style={styles.qtyLabel}>Quantity:</span>
            <button
              style={styles.qtyBtn}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span style={styles.qtyVal}>{qty}</span>
            <button
              style={styles.qtyBtn}
              onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            >
              +
            </button>
          </div>
          <div style={styles.btnRow} className="product-detail-actions">
            <button
              style={{
                ...styles.cartBtn,
                ...(product.stock === 0 ? styles.disabled : {}),
              }}
              disabled={product.stock === 0}
              onClick={addToCart}
            >
              <FaShoppingCart style={{ marginRight: 8 }} />
              Add to Cart
            </button>
            <button
              style={{
                ...styles.buyBtn,
                ...(product.stock === 0 ? styles.disabled : {}),
              }}
              disabled={product.stock === 0}
              onClick={addToCart}
            >
              Buy Now
            </button>
            <button
              type="button"
              style={{
                ...styles.wishBtn,
                ...(isWishlisted(product.id) ? styles.wishBtnActive : {}),
              }}
              aria-label={
                isWishlisted(product.id)
                  ? 'Remove from wishlist'
                  : 'Add to wishlist'
              }
              title={isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product);
              }}
            >
              {isWishlisted(product.id) ? (
                <FaHeart size={18} color="#ff6161" />
              ) : (
                <FaRegHeart size={18} color="#878787" />
              )}
            </button>
          </div>

          {/* ---------- Rich product details ---------- */}
          {(product.brand || product.sku || product.warranty || specs) && (
            <div style={styles.detailsBox}>
              <h3 style={styles.detailsTitle}>Product Details</h3>
              <div style={styles.specRow}>
                <span style={styles.specKey}>Brand</span>
                <span style={styles.specValue}>{product.brand || '—'}</span>
              </div>
              <div style={styles.specRow}>
                <span style={styles.specKey}>SKU</span>
                <span style={styles.specValue}>{product.sku || '—'}</span>
              </div>
              <div style={styles.specRow}>
                <span style={styles.specKey}>Warranty</span>
                <span style={styles.specValue}>{product.warranty || '—'}</span>
              </div>
              {specs && <div style={styles.specsBlock}>{specs}</div>}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Recommendations ---------- */}
      {recommendations.length > 0 && (
        <section style={styles.recommendCard} className="recommend-card">
          <h2 style={styles.recommendTitle}>Customers also bought</h2>
          <div style={styles.recommendGrid}>
            {recommendations.map((item) => (
              <div
                key={item.id}
                style={styles.recommendCardItem}
                onClick={() => navigate(`/product/${item.id}`)}
              >
                <div style={styles.recommendImgBox}>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={styles.recommendImg}
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                  ) : (
                    <div style={styles.noImg}>No Image</div>
                  )}
                </div>
                <span style={styles.recommendName}>{item.name}</span>
                <span style={styles.recommendPrice}>
                  ₹{Number(item.price || 0).toLocaleString('en-IN')}
                </span>
                {item.averageRating > 0 && (
                  <span style={styles.recommendRating}>
                    <FaStar size={11} color="#ff9f00" />{' '}
                    {Number(item.averageRating).toFixed(1)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Reviews ---------- */}
      <section style={styles.reviewsCard} className="reviews-card">
        <h2 style={styles.reviewsTitle}>Ratings &amp; Reviews</h2>
        <div style={styles.reviewsSummary}>
          <div style={styles.averageBlock}>
            <span style={styles.averageValue}>
              {Number(reviewData.averageRating || 0).toFixed(1)}
            </span>
            <RatingStars value={reviewData.averageRating} size={18} />
            <span style={styles.reviewCount}>
              {reviewData.totalReviews || 0}{' '}
              {(reviewData.totalReviews || 0) === 1 ? 'review' : 'reviews'}
            </span>
          </div>

          <form onSubmit={handleSubmitReview} style={styles.reviewForm}>
            {user ? (
              <>
                <span style={styles.formLabel}>Rate this product</span>
                <div style={styles.ratingPicker}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      type="button"
                      key={value}
                      aria-label={`Rate ${value} stars`}
                      onClick={() => setRating(value)}
                      style={styles.starButton}
                    >
                      {value <= rating ? (
                        <FaStar size={24} color="#ff9f00" />
                      ) : (
                        <FaRegStar size={24} color="#d0d0d0" />
                      )}
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={3}
                  style={styles.textarea}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </>
            ) : (
              <p style={styles.loginNote}>
                <Link to="/login" style={styles.link}>
                  Login
                </Link>{' '}
                to write a review.
              </p>
            )}
          </form>
        </div>

        <div style={styles.reviewList}>
          {(reviewData.reviews || []).length === 0 ? (
            <p style={styles.noReviews}>No reviews yet. Be the first to review!</p>
          ) : (
            reviewData.reviews.map((review) => (
              <div key={review.id} style={styles.review} className="review-item">
                <div style={styles.reviewHead}>
                  <span style={styles.reviewUser}>{review.userName}</span>
                  <span style={styles.reviewDate}>{formatDate(review.createdAt)}</span>
                </div>
                <div style={styles.reviewRating}>
                  <RatingStars value={review.rating} />
                  <span style={styles.ratingText}>{review.rating}/5</span>
                  {isOwnReview(review) && (
                    <button
                      style={styles.deleteReview}
                      onClick={() => handleDeleteReview(review)}
                      aria-label="Delete your review"
                    >
                      <FaTrash /> Delete
                    </button>
                  )}
                </div>
                <p style={styles.reviewComment}>{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

const styles = {
  page: { maxWidth: 1000, margin: '20px auto', padding: '0 16px' },
  back: {
    background: 'none',
    border: 'none',
    color: '#2874f0',
    cursor: 'pointer',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
    padding: 0,
    fontWeight: 500,
  },
  card: {
    background: 'white',
    borderRadius: 4,
    display: 'flex',
    gap: 40,
    padding: 32,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  imgSection: { display: 'flex', gap: 12, width: 380, flexShrink: 0 },
  thumbnails: { display: 'flex', flexDirection: 'column', gap: 8 },
  thumb: {
    width: 60,
    height: 60,
    border: '1px solid #ddd',
    borderRadius: 4,
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f9f9f9',
  },
  thumbActive: { border: '2px solid #2874f0' },
  thumbImg: { maxWidth: 55, maxHeight: 55, objectFit: 'contain' },
  mainImg: {
    flex: 1,
    minHeight: 300,
    background: '#f9f9f9',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
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
    fontSize: 13,
    color: '#878787',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  name: { fontSize: 24, fontWeight: 500, color: '#212121', marginBottom: 12 },
  ratingLine: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 12 },
  brand: { fontSize: 13, color: '#2874f0', fontWeight: 600 },
  ratingInline: { display: 'flex', alignItems: 'center', gap: 6 },
  stars: { display: 'inline-flex', alignItems: 'center', gap: 2, verticalAlign: 'middle' },
  ratingText: { fontSize: 12, color: '#878787', marginLeft: 4 },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.7,
    marginBottom: 20,
  },
  priceRow: { marginBottom: 8 },
  price: { fontSize: 28, fontWeight: 700, color: '#212121' },
  stock: { fontSize: 14, fontWeight: 500, marginBottom: 24, marginTop: 8 },
  qtyRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  qtyLabel: { fontSize: 14, fontWeight: 500, marginRight: 4 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '1px solid #ddd',
    background: 'white',
    fontSize: 18,
    cursor: 'pointer',
  },
  qtyVal: { fontSize: 16, fontWeight: 600, minWidth: 30, textAlign: 'center' },
  btnRow: { display: 'flex', gap: 12 },
  cartBtn: {
    flex: 1,
    background: '#ff9f00',
    color: 'white',
    border: 'none',
    padding: '14px 0',
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtn: {
    flex: 1,
    background: '#fb641b',
    color: 'white',
    border: 'none',
    padding: '14px 0',
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 4,
    cursor: 'pointer',
  },
  disabled: { background: '#ccc', cursor: 'not-allowed' },
  wishBtn: {
    flex: '0 0 auto',
    minWidth: 52,
    background: 'white',
    color: '#212121',
    border: '1px solid #ddd',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishBtnActive: { background: '#fff0f0', border: '1px solid #ffcdd2' },
  recommendCard: {
    background: 'white',
    borderRadius: 4,
    padding: 24,
    marginTop: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  recommendTitle: { fontSize: 20, fontWeight: 600, marginBottom: 16 },
  recommendGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 12,
  },
  recommendCardItem: {
    border: '1px solid #f0f0f0',
    borderRadius: 4,
    padding: 10,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
  },
  recommendImgBox: {
    height: 110,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f9f9f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  recommendImg: { width: '100%', height: 110, objectFit: 'contain' },
  recommendName: {
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  recommendPrice: { fontSize: 13, fontWeight: 700, marginTop: 2 },
  recommendRating: { fontSize: 11, color: '#878787', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 },
  detailsBox: {
    marginTop: 28,
    borderTop: '1px solid #f0f0f0',
    paddingTop: 20,
  },
  detailsTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12 },
  specsBlock: { marginTop: 12, borderTop: '1px dashed #eee', paddingTop: 12 },
  specRow: {
    display: 'flex',
    gap: 12,
    justifyContent: 'space-between',
    fontSize: 13,
    padding: '5px 0',
    borderBottom: '1px solid #f9f9f9',
  },
  specKey: { color: '#878787', flexShrink: 0, textTransform: 'capitalize' },
  specValue: { color: '#333', textAlign: 'right', fontWeight: 500 },
  reviewsCard: {
    background: 'white',
    borderRadius: 4,
    padding: 24,
    marginTop: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  reviewsTitle: { fontSize: 20, fontWeight: 600, marginBottom: 20 },
  reviewsSummary: {
    display: 'flex',
    gap: 32,
    flexWrap: 'wrap',
    paddingBottom: 20,
    borderBottom: '1px solid #f0f0f0',
  },
  averageBlock: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 },
  averageValue: { fontSize: 36, fontWeight: 700, color: '#212121', lineHeight: 1 },
  reviewCount: { fontSize: 12, color: '#878787' },
  reviewForm: { flex: 1, minWidth: 260 },
  formLabel: { display: 'block', fontSize: 13, color: '#555', marginBottom: 6 },
  ratingPicker: { display: 'flex', gap: 4, marginBottom: 10 },
  starButton: { background: 'none', padding: 2, lineHeight: 1 },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: 4,
    fontSize: 14,
    marginBottom: 10,
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  loginNote: { fontSize: 14, color: '#666' },
  link: { color: '#2874f0' },
  reviewList: { marginTop: 8 },
  review: { padding: '16px 0', borderBottom: '1px solid #f0f0f0' },
  reviewHead: { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  reviewUser: { fontSize: 14, fontWeight: 600 },
  reviewDate: { fontSize: 12, color: '#878787' },
  reviewRating: { display: 'flex', alignItems: 'center', margin: '6px 0' },
  deleteReview: {
    background: 'none',
    color: '#c62828',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    marginLeft: 'auto',
    padding: 4,
  },
  reviewComment: { fontSize: 14, color: '#444', lineHeight: 1.6 },
  noReviews: { color: '#878787', fontSize: 14, textAlign: 'center', padding: 24 },
  loading: { textAlign: 'center', padding: 80, color: '#666' },
};

export default ProductDetail;
