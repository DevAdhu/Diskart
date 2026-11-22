import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();
const CART_KEY = 'cart';

const readStoredCart = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch (err) {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  // Loaded once from localStorage; every page now shares this state.
  const [cart, setCart] = useState(readStoredCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const addItem = (product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, qty: (item.qty || 1) + qty }
            : item
        );
      }
      return [...prev, { ...product, qty }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, qty: Math.max(1, (item.qty || 1) + delta) }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  // Total quantity (used by the navbar badge).
  const itemCount = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
  const total = cart.reduce(
    (sum, item) => sum + (item.price || 0) * (item.qty || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        updateQty,
        removeItem,
        clearCart,
        itemCount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
