import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { wishlistAPI } from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);
const WISHLIST_KEY = 'wishlist';

// The wishlist may contain full product objects or just ids (e.g. old local
// data) — normalise both so isWishlisted() works either way.
const itemId = (item) => (item && typeof item === 'object' ? item.id : item);
const numericId = (value) => {
  const id = Number(value);
  return Number.isFinite(id) ? id : NaN;
};

const readLocalWishlist = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(WISHLIST_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch (err) {
    return [];
  }
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState(readLocalWishlist);
  const [loading, setLoading] = useState(false);
  // StrictMode re-runs effects in development; reconcile only once per login.
  const reconciledFor = useRef(null);

  // Always keep a local snapshot: guests use it as their real wishlist and
  // logged-in users need it to reconcile guest favourites after login.
  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    } catch (err) {
      // Ignore storage failures (private mode / quota).
    }
  }, [wishlist]);

  useEffect(() => {
    let active = true;
    const local = readLocalWishlist();

    if (!user) {
      reconciledFor.current = null;
      setWishlist(local);
      return () => {
        active = false;
      };
    }

    const userKey = user.id || localStorage.getItem('token') || 'logged-in';
    if (reconciledFor.current === userKey) {
      return () => {
        active = false;
      };
    }
    reconciledFor.current = userKey;

    setLoading(true);
    (async () => {
      try {
        const res = await wishlistAPI.list();
        let list = Array.isArray(res.data) ? res.data : [];
        const serverIds = new Set(list.map((item) => numericId(itemId(item))));

        // Merge any guest-only favourites into the account once (best effort).
        const pending = local.filter((item) => {
          const id = numericId(itemId(item));
          return Number.isFinite(id) && !serverIds.has(id);
        });
        for (const item of pending) {
          try {
            const added = await wishlistAPI.add(numericId(itemId(item)));
            if (Array.isArray(added.data)) list = added.data;
          } catch (err) {
            console.error(err);
          }
        }
        if (active) setWishlist(list);
      } catch (err) {
        console.error(err);
        if (active) setWishlist(local);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  const isWishlisted = useCallback(
    (id) => {
      const target = numericId(id);
      return Number.isFinite(target) && wishlist.some(
        (item) => numericId(itemId(item)) === target
      );
    },
    [wishlist]
  );

  const toggleWishlist = useCallback(
    async (product) => {
      const id = numericId(itemId(product));
      if (!Number.isFinite(id)) return;

      const exists = isWishlisted(id);
      // Optimistic update keeps the heart responsive even on a slow network.
      setWishlist((prev) =>
        exists
          ? prev.filter((item) => numericId(itemId(item)) !== id)
          : [...prev, product]
      );

      if (!user) return; // Local-only already persisted by the effect above.

      try {
        const res = exists
          ? await wishlistAPI.remove(id)
          : await wishlistAPI.add(id);
        if (Array.isArray(res.data)) setWishlist(res.data);
      } catch (err) {
        console.error(err);
        // Roll back on failure.
        setWishlist((prev) =>
          exists
            ? [...prev, product]
            : prev.filter((item) => numericId(itemId(item)) !== id)
        );
      }
    },
    [user, isWishlisted]
  );

  const removeFromWishlist = useCallback(
    async (id) => {
      const target = numericId(id);
      setWishlist((prev) =>
        prev.filter((item) => numericId(itemId(item)) !== target)
      );
      if (!user) return;

      try {
        const res = await wishlistAPI.remove(target);
        if (Array.isArray(res.data)) setWishlist(res.data);
      } catch (err) {
        console.error(err);
      }
    },
    [user]
  );

  const value = useMemo(
    () => ({
      wishlist,
      isWishlisted,
      toggleWishlist,
      removeFromWishlist,
      count: wishlist.length,
      loading,
    }),
    [wishlist, isWishlisted, toggleWishlist, removeFromWishlist, loading]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used inside a WishlistProvider');
  }
  return context;
};
