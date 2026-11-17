import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const KEY = 'shop.cart';

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
    }
  }, [items]);

  const add = (product, qty = 1) => {
    setIsOpen(true);
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.productId);
      const current = existing?.qty ?? 0;
      const nextQty = Math.min(current + qty, product.stock);
      const line = {
        productId: product.productId,
        name: product.name,
        price: product.price,
        stock: product.stock,
        thumbUrl: product.thumbUrl,
        imageUrl: product.imageUrl,
        category: product.category,
        qty: nextQty,
      };
      return existing ? prev.map((i) => (i.productId === product.productId ? line : i)) : [...prev, line];
    });
  };

  const setQty = (productId, qty) =>
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, Math.min(qty, i.stock)) } : i)));

  const remove = (productId) => setItems((prev) => prev.filter((i) => i.productId !== productId));

  const value = {
    items,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    add,
    setQty,
    remove,
    clear: () => setItems([]),
    count: items.reduce((n, i) => n + i.qty, 0),
    total: items.reduce((sum, i) => sum + i.price * i.qty, 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
