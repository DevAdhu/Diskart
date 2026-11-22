import { useCallback, useEffect, useState } from 'react';

const RECENT_KEY = 'recentlyViewed';
const MAX_RECENT = 8;

export const readRecentlyViewed = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_KEY));
    if (!Array.isArray(stored)) return [];
    return stored
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id))
      .slice(0, MAX_RECENT);
  } catch (err) {
    return [];
  }
};

// Stores product ids only (max 8, most recent first) so a product can be
// re-fetched later and deleted products do not leave stale objects behind.
export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState(readRecentlyViewed);

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recentlyViewed));
    } catch (err) {
      // Ignore storage failures (private mode / quota).
    }
  }, [recentlyViewed]);

  const addRecentlyViewed = useCallback((id) => {
    const productId = Number(id);
    if (!Number.isFinite(productId)) return;
    setRecentlyViewed((prev) =>
      [productId, ...prev.filter((existing) => existing !== productId)].slice(
        0,
        MAX_RECENT
      )
    );
  }, []);

  const clearRecentlyViewed = useCallback(() => setRecentlyViewed([]), []);

  return { recentlyViewed, addRecentlyViewed, clearRecentlyViewed };
};
