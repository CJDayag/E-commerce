export interface WishlistItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: {
    id: number;
    name: string;
  };
  stock: number;
  condition: 'NEW' | 'USED' | 'REFURBISHED' | string;
  image: string | null;
}

const STORAGE_KEY = 'wishlist';

const readStorage = (): WishlistItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse wishlist:', error);
    return [];
  }
};

const writeStorage = (items: WishlistItem[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('wishlist:updated'));
};

export const getWishlist = (): WishlistItem[] => readStorage();

export const isInWishlist = (productId: number): boolean => {
  return readStorage().some((item) => item.id === productId);
};

export const addToWishlist = (item: WishlistItem) => {
  const items = readStorage();
  if (items.some((existing) => existing.id === item.id)) {
    return;
  }

  writeStorage([item, ...items]);
};

export const removeFromWishlist = (productId: number) => {
  const items = readStorage().filter((item) => item.id !== productId);
  writeStorage(items);
};

export const toggleWishlist = (item: WishlistItem): boolean => {
  const items = readStorage();
  const exists = items.some((existing) => existing.id === item.id);

  if (exists) {
    writeStorage(items.filter((existing) => existing.id !== item.id));
    return false;
  }

  writeStorage([item, ...items]);
  return true;
};
