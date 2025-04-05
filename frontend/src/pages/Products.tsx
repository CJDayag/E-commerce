import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '@/services/api';

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ProductCard } from "@/components/product-card";



interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: {
    id: number;
    name: string;
  };
  stock: number;
  condition: 'NEW' | 'USED' | 'REFURBISHED';
  image: string | null;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          search: searchParams.get('search') || '',
          ordering: searchParams.get('sort') || '',
          category: searchParams.get('category') || '',
        });

        const response = await api.get(`/api/products/products/?${params}`);
        console.log("API Response:", response.data);

        // Check if response.data is an array or has a results property
        if (Array.isArray(response.data)) {
          setProducts(response.data);
        } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
          // Django REST Framework often returns paginated results with this structure
          setProducts(response.data.results);
        } else {
          console.error('Unexpected API response format:', response.data);
          setProducts([]);
          setError('Received unexpected data format from server');
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-[200px] w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Products</title>
      </Helmet>
          <h1 className="mb-8 text-3xl font-bold">Products</h1>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {products.length === 0 && (
            <div className="flex h-96 items-center justify-center">
              <Alert>
                <AlertDescription>
                  No products found.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      );
}