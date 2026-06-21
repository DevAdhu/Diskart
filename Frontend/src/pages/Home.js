import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaShoppingCart, FaSearch } from 'react-icons/fa';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem('cart')) || []
  );
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await productAPI.getAll();
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) { loadProducts(); return; }
    try {
      const res = await productAPI.search(search);
      setProducts(res.data);
    } catch (err) { console.error(err); }
  };

  const addToCart = (product) => {
    const existing = cart.find(i => i.id === product.id);
    let updated;
    if (existing) {
      updated = cart.map(i =>
        i.id === product.id ? { ...i, qty: i.qty + 1 } : i
      );
    } else {
      updated = [...cart, { ...product, qty: 1 }];
    }
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    alert(`${product.name} added to cart!`);
  };

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? products
    : products.filter(p => p.category === activeCategory);

  if (loading) return (
    <div style={styles.loading}>Loading products...</div>
  );

  return (
    <div>
      <div style={styles.searchBar}>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            style={styles.searchInput}
            placeholder="Search for products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" style={styles.searchBtn}>
            <FaSearch />
          </button>
        </form>
      </div>

      <div style={styles.categories}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              ...styles.catBtn,
              ...(activeCategory === cat ? styles.catActive : {})
            }}>
            {cat}
          </button>
        ))}
      </div>

      <div style={styles.container}>
        {filtered.length === 0 ? (
          <div style={styles.empty}>No products found.</div>
        ) : (
          <div style={styles.grid}>
            {filtered.map(product => (
              <div key={product.id} style={styles.card}>
                <div
                  style={styles.imgBox}
                  onClick={() => navigate(`/product/${product.id}`)}>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={styles.img}
                      onError={e => e.target.style.display='none'}
                    />
                  ) : (
                    <div style={styles.noImg}>No Image</div>
                  )}
                </div>
                <div style={styles.info}>
                  <p style={styles.name}
                    onClick={() => navigate(`/product/${product.id}`)}>
                    {product.name}
                  </p>
                  <p style={styles.category}>{product.category}</p>
                  <p style={styles.price}>
                    ₹{product.price?.toLocaleString('en-IN')}
                  </p>
                  <p style={styles.stock}>
                    {product.stock > 0
                      ? `${product.stock} in stock`
                      : <span style={{color:'red'}}>Out of stock</span>}
                  </p>
                  <button
                    style={{
                      ...styles.addBtn,
                      ...(product.stock === 0 ? styles.disabledBtn : {})
                    }}
                    disabled={product.stock === 0}
                    onClick={() => addToCart(product)}>
                    <FaShoppingCart style={{marginRight:6}} />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  searchBar: {
    background: '#2874f0',
    padding: '12px 16px',
  },
  searchForm: {
    maxWidth: 600,
    margin: '0 auto',
    display: 'flex',
    gap: 0,
  },
  searchInput: {
    flex: 1,
    padding: '10px 16px',
    fontSize: 14,
    border: 'none',
    borderRadius: '4px 0 0 4px',
    outline: 'none',
    marginBottom: 0,
  },
  searchBtn: {
    background: '#ff9f00',
    color: 'white',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '0 4px 4px 0',
    cursor: 'pointer',
    fontSize: 16,
  },
  categories: {
    background: 'white',
    padding: '10px 16px',
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  catBtn: {
    background: '#f1f3f6',
    border: '1px solid #ddd',
    padding: '6px 16px',
    borderRadius: 20,
    cursor: 'pointer',
    fontSize: 13,
    whiteSpace: 'nowrap',
    fontWeight: 500,
  },
  catActive: {
    background: '#2874f0',
    color: 'white',
    border: '1px solid #2874f0',
  },
  container: {
    maxWidth: 1200,
    margin: '20px auto',
    padding: '0 16px',
  },
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
    transition: 'box-shadow 0.2s',
    cursor: 'pointer',
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
img: {
    width: '100%',
    height: '200px',
    objectFit: 'contain',
    padding: '12px',
},
  noImg: {
    color: '#aaa',
    fontSize: 13,
  },
  info: {
    padding: '12px 14px',
  },
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
  category: {
    fontSize: 12,
    color: '#878787',
    marginBottom: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: 700,
    color: '#212121',
    marginBottom: 4,
  },
  stock: {
    fontSize: 12,
    color: '#388e3c',
    marginBottom: 10,
  },
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
  disabledBtn: {
    background: '#ccc',
    cursor: 'not-allowed',
  },
  loading: {
    textAlign: 'center',
    padding: 60,
    fontSize: 16,
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: 60,
    fontSize: 16,
    color: '#666',
  },
};

export default Home;