import { useEffect, useMemo, useState } from 'react';
import API from '@/services/api';
import { X } from 'lucide-react';

interface PromoCode {
  id: number;
  code: string;
  description: string;
  discount_type: 'PERCENT' | 'FIXED';
  amount: string | number;
  created_at: string;
}

const STORAGE_KEY = 'promo-banner-dismissed';

export function PromoBanner() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDismissed(localStorage.getItem(STORAGE_KEY) === 'true');
    }
  }, []);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const response = await API.get('/api/orders/promocodes/');
        const data = response.data?.results || response.data || [];
        setPromos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load promo codes:', error);
      }
    };

    fetchPromos();
  }, []);

  const latestPromo = useMemo(() => {
    if (promos.length === 0) {
      return null;
    }

    return [...promos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }, [promos]);

  if (dismissed || !latestPromo) {
    return null;
  }

  const amountLabel = latestPromo.discount_type === 'PERCENT'
    ? `${latestPromo.amount}% off`
    : `$${latestPromo.amount} off`;

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  };

  return (
    <div className="fixed left-1/2 top-20 z-40 w-[92%] max-w-3xl -translate-x-1/2">
      <div className="relative flex flex-col gap-1 rounded-2xl bg-primary text-primary-foreground px-4 py-3 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.25em]">New promo</p>
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold text-primary-foreground">
            {latestPromo.code}
          </span>
          <span>{amountLabel}</span>
          {latestPromo.description && (
            <span className="text-xs font-normal text-primary-foreground/80">
              {latestPromo.description}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full bg-primary-foreground/20 p-1 text-primary-foreground transition hover:bg-primary-foreground/30"
          aria-label="Dismiss promo banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
