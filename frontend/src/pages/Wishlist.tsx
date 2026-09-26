import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProductCard } from '@/components/product-card';
import { getWishlist, type WishlistItem } from '@/lib/wishlist';

export default function Wishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const refresh = () => setItems(getWishlist());

    refresh();
    window.addEventListener('wishlist:updated', refresh);
    return () => window.removeEventListener('wishlist:updated', refresh);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Wishlist</title>
      </Helmet>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Wishlist</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Save parts you want to compare or buy later.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
          <Alert>
            <AlertDescription>
              Your wishlist is empty. Start adding your favorite products.
            </AlertDescription>
          </Alert>
          <Button asChild>
            <Link to="/products">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
