export interface GuestCartItem {
  product: {
    id: number;
    name: string;
    price: number;
    image?: string;
  };
  quantity: number;
}

const STORAGE_KEY = 'guest_cart';

const readStorage = (): GuestCartItem[] => {
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
    console.error('Failed to parse guest cart:', error);
    return [];
  }
};

const writeStorage = (items: GuestCartItem[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('guest-cart:updated'));
};

export const getGuestCartItems = (): GuestCartItem[] => readStorage();

export const getGuestCartCount = (): number => {
  return readStorage().reduce((sum, item) => sum + item.quantity, 0);
};

export const addGuestCartItem = (item: GuestCartItem) => {
  const items = readStorage();
  const existing = items.find((entry) => entry.product.id === item.product.id);

  if (existing) {
    existing.quantity += item.quantity;
    writeStorage([...items]);
    return;
  }

  writeStorage([...items, item]);
};

export const updateGuestCartQuantity = (productId: number, quantity: number) => {
  const items = readStorage();
  const nextItems = items
    .map((item) => {
      if (item.product.id !== productId) {
        return item;
      }
      return { ...item, quantity };
    })
    .filter((item) => item.quantity > 0);

  writeStorage(nextItems);
};

export const removeGuestCartItem = (productId: number) => {
  const items = readStorage().filter((item) => item.product.id !== productId);
  writeStorage(items);
};

export const clearGuestCart = () => {
  writeStorage([]);
};
