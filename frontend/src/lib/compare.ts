export interface CompareItem {
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

const STORAGE_KEY = 'compare';
const MAX_COMPARE_ITEMS = 3;

const readStorage = (): CompareItem[] => {
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
    console.error('Failed to parse compare list:', error);
    return [];
  }
};

const writeStorage = (items: CompareItem[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('compare:updated'));
};

export const getCompareItems = (): CompareItem[] => readStorage();

export const isInCompare = (productId: number): boolean => {
  return readStorage().some((item) => item.id === productId);
};

export const canAddToCompare = (): boolean => {
  return readStorage().length < MAX_COMPARE_ITEMS;
};

export const addToCompare = (item: CompareItem): boolean => {
  const items = readStorage();

  if (items.some((existing) => existing.id === item.id)) {
    return true;
  }

  if (items.length >= MAX_COMPARE_ITEMS) {
    return false;
  }

  writeStorage([...items, item]);
  return true;
};

export const removeFromCompare = (productId: number) => {
  const items = readStorage().filter((item) => item.id !== productId);
  writeStorage(items);
};

export const toggleCompare = (item: CompareItem): { inCompare: boolean; success: boolean } => {
  const items = readStorage();
  const exists = items.some((existing) => existing.id === item.id);

  if (exists) {
    writeStorage(items.filter((existing) => existing.id !== item.id));
    return { inCompare: false, success: true };
  }

  if (items.length >= MAX_COMPARE_ITEMS) {
    return { inCompare: false, success: false };
  }

  writeStorage([...items, item]);
  return { inCompare: true, success: true };
};

export const clearCompare = () => {
  writeStorage([]);
};

export const MAX_COMPARE = MAX_COMPARE_ITEMS;
