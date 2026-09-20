import { useState, useEffect, useCallback } from 'react';
import { WishlistItem } from '../types';

const STORAGE_KEY = 'seensoldthere_wishlist';

export function useWishlist() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load wishlist from localStorage:', e);
    }
    return [];
  });

  // Keep localStorage updated whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage:', e);
    }
  }, [wishlist]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setWishlist(JSON.parse(e.newValue));
        } catch (err) {
          console.error(err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isWishlisted = useCallback(
    (id: string) => {
      return wishlist.some((item) => item.id === id || item.productId === id);
    },
    [wishlist]
  );

  const toggleWishlist = useCallback(
    (item: Omit<WishlistItem, 'addedAt'>): boolean => {
      let isNowAdded = false;
      setWishlist((prev) => {
        const exists = prev.some((i) => i.id === item.id || i.productId === item.productId);
        if (exists) {
          isNowAdded = false;
          return prev.filter((i) => i.id !== item.id && i.productId !== item.productId);
        } else {
          isNowAdded = true;
          return [{ ...item, addedAt: Date.now() }, ...prev];
        }
      });
      return isNowAdded;
    },
    []
  );

  const removeFromWishlist = useCallback((id: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id && item.productId !== id));
  }, []);

  const clearWishlist = useCallback(() => {
    setWishlist([]);
  }, []);

  return {
    wishlist,
    wishlistCount: wishlist.length,
    isWishlisted,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
  };
}
