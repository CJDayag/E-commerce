import { useEffect, useState } from 'react';
import axios from 'axios';
import { ShoppingCart } from 'lucide-react';
import { CartSheet } from '@/pages/Cart';
import { getGuestCartCount } from '@/lib/guest-cart';

const API_BASE_URL = 'http://localhost:8000';

export function FloatingCartButton() {
  const [count, setCount] = useState(0);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const refreshCount = async () => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      setCount(getGuestCartCount());
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/cart/`, {
        headers: getAuthHeaders(),
      });

      const cartData = Array.isArray(response.data) ? response.data[0] : response.data;
      const items = cartData?.items ?? [];
      const nextCount = items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
      setCount(nextCount);
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
    }
  };

  useEffect(() => {
    refreshCount();

    const handleCartUpdate = () => refreshCount();
    const handleGuestUpdate = () => setCount(getGuestCartCount());

    window.addEventListener('cart:updated', handleCartUpdate);
    window.addEventListener('guest-cart:updated', handleGuestUpdate);

    return () => {
      window.removeEventListener('cart:updated', handleCartUpdate);
      window.removeEventListener('guest-cart:updated', handleGuestUpdate);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <CartSheet
        customTrigger={
          <button
            type="button"
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:shadow-xl"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-6 w-6" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
                {count}
              </span>
            )}
          </button>
        }
      />
    </div>
  );
}
