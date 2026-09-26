import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  clearCompare,
  getCompareItems,
  removeFromCompare,
  type CompareItem,
} from '@/lib/compare';

export default function Compare() {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    const refresh = () => setItems(getCompareItems());

    refresh();
    window.addEventListener('compare:updated', refresh);
    return () => window.removeEventListener('compare:updated', refresh);
  }, []);

  const handleRemove = (productId: number) => {
    removeFromCompare(productId);
  };

  const handleClear = () => {
    clearCompare();
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>Compare</title>
        </Helmet>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Compare</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select products to compare key specs side by side.
          </p>
        </div>
        <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
          <Alert>
            <AlertDescription>
              Your compare list is empty. Add up to three products to compare.
            </AlertDescription>
          </Alert>
          <Button asChild>
            <Link to="/products">Browse products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Compare</title>
      </Helmet>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compare</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare the essentials before you buy.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/products">Add more</Link>
          </Button>
          <Button variant="secondary" onClick={handleClear}>
            Clear list
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-md bg-muted">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>${Number(item.price).toFixed(2)}</TableCell>
                <TableCell>{item.category?.name ?? '—'}</TableCell>
                <TableCell>{item.condition}</TableCell>
                <TableCell>{item.stock > 0 ? `${item.stock} available` : 'Out of stock'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleRemove(item.id)}>
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
