import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { FaShoppingCart, FaSearch } from 'react-icons/fa';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState('name,asc');
  const [size, setSize] = useState(12);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');

  const navigate = useNavigate();
  const { addItem } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    setLoading(true);

    productAPI
      .getPaged({
        page,
        size,
        sort,
        keyword,
        category: activeCategory === 'All' ? '' : activeCategory,
      })
      .then((res) => {
        if (!active) return;
        const data = res.data || {};
        const list = Array.isArray(data) ? data : data.content || [];
        setProducts(list);
        setTotalElements(
          data.totalElements != null ? data.totalElements : list.length
        );
        setTotalPages(
          data.totalPages != null
            ? data.totalPages
            : Math.ceil((data.totalElements || list.length) / size)
        );

        // Remember categories seen while paging so the filter pills persist.
        const seen = new Set(categories.filter((c) => c !== 'All'));
        list.forEach((p) => p.category && seen.add(p.category));
        setCategories(['All', ...Array.from(seen)]);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, sort, keyword, activeCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setKeyword(searchInput.trim());
  };

  const handleCategory = (cat) => {
    setActiveCategory(cat);
    setPage(0);
  };

  const handleSort = (e) => {
    setSort(e.target.value);
    setPage(0);
  };

  const handleSize = (e) => {
    setSize(Number(e.target.value));
    setPage(0);
  };

  const addToCart = (product) => {
    addItem(product, 1);
    showToast(`${product.name} added to cart!`, 'success');
  };

  const visiblePages = [];
  const startPage = Math.max(0, Math.min(page - 2, Math.max(0, totalPages - 5)));
  for (let i = startPage; i < Math.min(totalPages, startPage + 5); i++) {
    visiblePages.push(i);
  }

  const startItem = totalElements === 0 ? 0 : page * size + 1;
  const endItem = Math.min(totalElements, (page + 1) * size);

  if (loading && products.length === 0) {
    return <div style={styles.loading}>Loading products...</div>;
  }

  return (
    <div>
      <div style={styles.searchBar}>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            style={styles.searchInput}
            placeholder="Search for products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" style={styles.searchBtn} aria-label="Search">
            <FaSearch />
          </button>
        </form>
      </div>

      <div style={styles.categories}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategory(cat)}
            style={{
              ...styles.catBtn,
              ...(activeCategory === cat ? styles.catActive : {}),
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={styles.container}>
        <div style={styles.controls} className="home-controls">
          <div style={styles.resultCount}>
            {totalElements === 0
              ? 'No products found'
              : `Showing ${startItem}–${endItem} of ${totalElements} products`}
          </div>
          <div style={styles.controlGroup}>
            <label style={styles.controlLabel} htmlFor="home-sort">
              Sort by
            </label>
            <select
              id="home-sort"
              value={sort}
              onChange={handleSort}
              style={styles.select}
            >
              <option value="name,asc">Name: A–Z</option>
              <option value="name,desc">Name: Z–A</option>
              <option value="price,asc">Price: Low to High</option>
              <option value="price,desc">Price: High to Low</option>
            </select>
            <label style={styles.controlLabel} htmlFor="home-size">
              Show
            </label>
            <select
              id="home-size"
              value={size}
              onChange={handleSize}
              style={styles.select}
            >
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>
        </div>

        {products.length === 0 ? (
          <div style={styles.empty} className="home-empty">
            No products found.
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
                  <p style={styles.price}>
                    ₹{product.price?.toLocaleString('en-IN')}
                  </p>
                  <p style={styles.stock}>
                    {product.stock > 0
                      ? `${product.stock} in stock`
                      : <span style={{ color: 'red' }}>Out of stock</span>}
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
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={styles.pagination} className="home-pagination">
            <button
              style={{
                ...styles.pageBtn,
                ...(page === 0 ? styles.pageDisabled : {}),
              }}
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            {visiblePages.map((p) => (
              <button
                key={p}
                style={{
                  ...styles.pageBtn,
                  ...(p === page ? styles.pageActive : {}),
                }}
                onClick={() => setPage(p)}
              >
                {p + 1}
              </button>
            ))}
            <button
              style={{
                ...styles.pageBtn,
                ...(page >= totalPages - 1 ? styles.pageDisabled : {}),
              }}
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next
            </button>
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
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  resultCount: { fontSize: 13, color: '#666' },
  controlGroup: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  controlLabel: { fontSize: 13, color: '#666' },
  select: {
    width: 'auto',
    marginBottom: 0,
    padding: '8px 10px',
    fontSize: 13,
    border: '1px solid #ddd',
    borderRadius: 4,
    background: 'white',
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
  price: { fontSize: 16, fontWeight: 700, color: '#212121', marginBottom: 4 },
  stock: { fontSize: 12, color: '#388e3c', marginBottom: 10 },
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
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 24,
  },
  pageBtn: {
    background: 'white',
    color: '#212121',
    border: '1px solid #ddd',
    padding: '8px 14px',
    minWidth: 40,
    fontSize: 13,
    fontWeight: 500,
  },
  pageActive: {
    background: '#2874f0',
    color: 'white',
    border: '1px solid #2874f0',
  },
  pageDisabled: { color: '#aaa', cursor: 'not-allowed' },
  loading: { textAlign: 'center', padding: 60, fontSize: 16, color: '#666' },
  empty: { textAlign: 'center', padding: 60, fontSize: 16, color: '#666' },
};

export default Home;
