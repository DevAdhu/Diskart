import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import {
  FaShoppingCart,
  FaSearch,
  FaStar,
  FaRegStar,
  FaHeart,
  FaRegHeart,
  FaFilter,
  FaTimes,
} from 'react-icons/fa';

const ProductRating = ({ value, count }) => (
  <span style={styles.rating} aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((star) =>
      star <= Math.round(value) ? (
        <FaStar key={star} size={12} color="#ff9f00" />
      ) : (
        <FaRegStar key={star} size={12} color="#d0d0d0" />
      )
    )}
    <span style={styles.ratingCount}>
      {Number(value).toFixed(1)} ({count || 0})
    </span>
  </span>
);

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [sort, setSort] = useState('name,asc');
  const [size, setSize] = useState(12);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [brands, setBrands] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [recentProducts, setRecentProducts] = useState([]);

  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const { recentlyViewed } = useRecentlyViewed();

  // Distinct brands for the filter sidebar.
  useEffect(() => {
    let active = true;
    productAPI
      .brands()
      .then((res) => {
        if (!active) return;
        setBrands(Array.isArray(res.data) ? res.data.filter(Boolean) : []);
      })
      .catch(() => {
        if (active) setBrands([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // Re-fetch recently viewed products by id; deleted products simply vanish.
  useEffect(() => {
    if (!recentlyViewed.length) {
      setRecentProducts([]);
      return undefined;
    }
    let active = true;
    Promise.allSettled(recentlyViewed.map((id) => productAPI.getById(id))).then(
      (results) => {
        if (!active) return;
        setRecentProducts(
          results
            .filter(
              (result) =>
                result.status === 'fulfilled' && result.value?.data?.id != null
            )
            .map((result) => result.value.data)
        );
      }
    );
    return () => {
      active = false;
    };
  }, [recentlyViewed]);

  // Debounced type-ahead search suggestions.
  useEffect(() => {
    const query = searchInput.trim();
    if (!query) {
      setSuggestions([]);
      setSuggestOpen(false);
      return undefined;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      productAPI
        .suggest(query, 8)
        .then((res) => {
          if (!active) return;
          setSuggestions(Array.isArray(res.data) ? res.data : []);
          setSuggestOpen(true);
        })
        .catch(() => {
          if (active) setSuggestions([]);
        });
    }, 300);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  // Main paged catalogue query — every filter is sent to the backend.
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
        minPrice,
        maxPrice,
        brand: selectedBrands.length ? selectedBrands.join(',') : '',
        minRating,
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
  }, [
    page,
    size,
    sort,
    keyword,
    activeCategory,
    minPrice,
    maxPrice,
    selectedBrands,
    minRating,
  ]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setKeyword(searchInput.trim());
    setSuggestOpen(false);
  };

  const goToSuggestion = (product) => {
    setSuggestOpen(false);
    setSearchInput('');
    navigate(`/product/${product.id}`);
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

  const toggleBrand = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
    setPage(0);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setKeyword('');
    setActiveCategory('All');
    setMinPrice('');
    setMaxPrice('');
    setSelectedBrands([]);
    setMinRating('');
    setSuggestions([]);
    setSuggestOpen(false);
    setPage(0);
  };

  const addToCart = (product) => {
    addItem(product, 1);
    showToast(`${product.name} added to cart!`, 'success');
  };

  const chips = [];
  if (keyword) {
    chips.push({
      key: 'keyword',
      label: `Search: ${keyword}`,
      clear: () => {
        setKeyword('');
        setSearchInput('');
        setPage(0);
      },
    });
  }
  if (activeCategory !== 'All') {
    chips.push({
      key: 'category',
      label: `Category: ${activeCategory}`,
      clear: () => handleCategory('All'),
    });
  }
  if (minPrice !== '') {
    chips.push({
      key: 'minPrice',
      label: `Min ₹${minPrice}`,
      clear: () => {
        setMinPrice('');
        setPage(0);
      },
    });
  }
  if (maxPrice !== '') {
    chips.push({
      key: 'maxPrice',
      label: `Max ₹${maxPrice}`,
      clear: () => {
        setMaxPrice('');
        setPage(0);
      },
    });
  }
  selectedBrands.forEach((brand) =>
    chips.push({
      key: `brand-${brand}`,
      label: `Brand: ${brand}`,
      clear: () => toggleBrand(brand),
    })
  );
  if (minRating) {
    chips.push({
      key: 'rating',
      label: `${minRating}★ & above`,
      clear: () => {
        setMinRating('');
        setPage(0);
      },
    });
  }

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
        <div className="home-search-wrap">
          <form onSubmit={handleSearch} style={styles.searchForm}>
            <input
              style={styles.searchInput}
              placeholder="Search for products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => {
                if (searchInput.trim() && suggestions.length) setSuggestOpen(true);
              }}
              onBlur={() => window.setTimeout(() => setSuggestOpen(false), 120)}
              aria-label="Search products"
              autoComplete="off"
            />
            <button type="submit" style={styles.searchBtn} aria-label="Search">
              <FaSearch />
            </button>
          </form>
          {suggestOpen && searchInput.trim() && (
            <div className="home-suggestions" role="listbox">
              {suggestions.length === 0 ? (
                <div style={styles.suggestEmpty}>No suggestions found</div>
              ) : (
                suggestions.map((item) => (
                  <div
                    key={item.id}
                    className="home-suggestion"
                    role="option"
                    aria-selected="false"
                    onMouseDown={(e) => {
                      e.preventDefault(); // keep focus so click isn't lost to blur
                      goToSuggestion(item);
                    }}
                  >
                    <span style={styles.suggestName}>{item.name}</span>
                    <span style={styles.suggestMeta}>
                      {item.category && (
                        <span style={styles.suggestCat}>{item.category}</span>
                      )}
                      <span style={styles.suggestPrice}>
                        ₹{Number(item.price || 0).toLocaleString('en-IN')}
                      </span>
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
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
        {recentProducts.length > 0 && (
          <section style={styles.recentSection}>
            <h2 style={styles.sectionTitle}>Recently Viewed</h2>
            <div className="home-recent-strip">
              {recentProducts.map((product) => (
                <div
                  key={product.id}
                  style={styles.recentCard}
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div style={styles.recentImgBox}>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={styles.recentImg}
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    ) : (
                      <div style={styles.noImg}>No Image</div>
                    )}
                  </div>
                  <span style={styles.recentName}>{product.name}</span>
                  <span style={styles.recentPrice}>
                    ₹{Number(product.price || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <button
          type="button"
          className="home-filter-toggle"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
        >
          <FaFilter /> Filters{chips.length ? ` (${chips.length})` : ''}
        </button>

        <div className="home-layout">
          <aside
            className={`home-filters${filtersOpen ? ' home-filters-open' : ''}`}
            style={styles.filters}
          >
            <div style={styles.filterBox}>
              <h3 style={styles.filterTitle}>Filters</h3>

              <label style={styles.filterLabel}>Price range</label>
              <div style={styles.priceRow}>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setPage(0);
                  }}
                  style={styles.priceInput}
                  aria-label="Minimum price"
                />
                <span style={styles.priceDash}>—</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(0);
                  }}
                  style={styles.priceInput}
                  aria-label="Maximum price"
                />
              </div>

              <label style={styles.filterLabel}>Brand</label>
              <div style={styles.brandList}>
                {brands.length === 0 && (
                  <span style={styles.filterMuted}>No brands available</span>
                )}
                {brands.map((brand) => (
                  <label key={brand} style={styles.checkRow}>
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                      style={styles.checkbox}
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>

              <label style={{ ...styles.filterLabel, marginTop: 12 }} htmlFor="home-rating">
                Rating
              </label>
              <select
                id="home-rating"
                value={minRating}
                onChange={(e) => {
                  setMinRating(e.target.value);
                  setPage(0);
                }}
                style={styles.select}
              >
                <option value="">All ratings</option>
                <option value={4}>4★ &amp; above</option>
                <option value={3}>3★ &amp; above</option>
              </select>
            </div>
          </aside>

          <div className="home-results">
            {chips.length > 0 && (
              <div className="home-active-filters">
                {chips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    className="home-filter-chip"
                    style={styles.chipBtn}
                    onClick={chip.clear}
                  >
                    {chip.label} <FaTimes size={11} />
                  </button>
                ))}
                <button type="button" style={styles.clearAll} onClick={clearAllFilters}>
                  Clear all
                </button>
              </div>
            )}

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
                      <button
                        type="button"
                        style={{
                          ...styles.heartBtn,
                          ...(isWishlisted(product.id) ? styles.heartActive : {}),
                        }}
                        aria-label={
                          isWishlisted(product.id)
                            ? `Remove ${product.name} from wishlist`
                            : `Add ${product.name} to wishlist`
                        }
                        title={isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product);
                        }}
                      >
                        {isWishlisted(product.id) ? (
                          <FaHeart size={17} color="#ff6161" />
                        ) : (
                          <FaRegHeart size={17} color="#878787" />
                        )}
                      </button>
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
                          <ProductRating
                            value={product.averageRating}
                            count={product.reviewCount}
                          />
                        </p>
                      )}
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
    display: 'flex',
    gap: 0,
    width: '100%',
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
  suggestEmpty: { padding: 12, fontSize: 13, color: '#878787' },
  suggestName: { fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  suggestMeta: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  suggestCat: { fontSize: 12, color: '#878787' },
  suggestPrice: { fontSize: 13, fontWeight: 600, color: '#2874f0' },
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
  recentSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 600, marginBottom: 10, color: '#212121' },
  recentCard: {
    minWidth: 150,
    maxWidth: 150,
    background: 'white',
    borderRadius: 4,
    padding: 8,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    flexShrink: 0,
  },
  recentImgBox: {
    height: 90,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f9f9f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  recentImg: { width: '100%', height: 90, objectFit: 'contain' },
  recentName: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  recentPrice: { display: 'block', fontSize: 13, fontWeight: 700, color: '#212121', marginTop: 2 },
  filters: { width: 230 },
  filterBox: {
    background: 'white',
    borderRadius: 4,
    padding: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  filterTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16 },
  filterLabel: { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 8 },
  filterMuted: { fontSize: 12, color: '#878787' },
  priceRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 },
  priceInput: { width: '100%', minWidth: 0, marginBottom: 0, padding: '8px', fontSize: 13 },
  priceDash: { color: '#878787' },
  brandList: { display: 'flex', flexDirection: 'column', gap: 6 },
  checkRow: { display: 'flex', alignItems: 'center', fontSize: 13, color: '#333', cursor: 'pointer', marginBottom: 0 },
  checkbox: { width: 'auto', marginBottom: 0, marginRight: 8 },
  chipBtn: { cursor: 'pointer' },
  clearAll: {
    background: 'none',
    color: '#2874f0',
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    padding: '4px 6px',
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
    position: 'relative',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    width: 34,
    height: 34,
    padding: 0,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.95)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartActive: { background: '#fff0f0' },
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
  ratingRow: { marginBottom: 6 },
  rating: { display: 'inline-flex', alignItems: 'center', gap: 1, verticalAlign: 'middle' },
  ratingCount: { fontSize: 11, color: '#878787', marginLeft: 6 },
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
