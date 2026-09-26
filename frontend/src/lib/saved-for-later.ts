export interface SavedForLaterItem {
  product: {
    id: number;
    name: string;
    price: number;
    image?: string;
  };
  quantity: number;
}

const STORAGE_KEY = 'saved_for_later';

const readStorage = (): SavedForLaterItem[] => {
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
    console.error('Failed to parse saved for later:', error);
    return [];
  }
};

const writeStorage = (items: SavedForLaterItem[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('saved-for-later:updated'));
};

export const getSavedForLaterItems = (): SavedForLaterItem[] => readStorage();

export const addSavedForLaterItem = (item: SavedForLaterItem) => {
  const items = readStorage();
  const existing = items.find((entry) => entry.product.id === item.product.id);

  if (existing) {
    existing.quantity += item.quantity;
    writeStorage([...items]);
    return;
  }

  writeStorage([...items, item]);
};

export const removeSavedForLaterItem = (productId: number) => {
  const items = readStorage().filter((item) => item.product.id !== productId);
  writeStorage(items);
};

export const clearSavedForLater = () => {
  writeStorage([]);
};
