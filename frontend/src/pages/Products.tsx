import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clearCompare, getCompareItems, removeFromCompare, type CompareItem } from "@/lib/compare";



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

interface Category {
  id: number;
  name: string;
}

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
  { label: 'Name: A to Z', value: 'name' },
  { label: 'Name: Z to A', value: '-name' },
];

const ALL_CATEGORIES_VALUE = 'all';
const DEFAULT_SORT_VALUE = 'newest';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES_VALUE);
  const [selectedSort, setSelectedSort] = useState(DEFAULT_SORT_VALUE);
  const [compareItems, setCompareItems] = useState<CompareItem[]>([]);

  const normalizedSearch = useMemo(() => searchTerm.trim(), [searchTerm]);
  const visibleProducts = useMemo(() => {
    if (selectedCategory === ALL_CATEGORIES_VALUE) {
      return products;
    }

    return products.filter((product) => String(product.category.id) === selectedCategory);
  }, [products, selectedCategory]);

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/products/categories/');
        const data = response.data?.results || response.data || [];
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || ALL_CATEGORIES_VALUE);
    setSelectedSort(searchParams.get('sort') || DEFAULT_SORT_VALUE);
  }, [searchParams]);

  useEffect(() => {
    const refresh = () => setCompareItems(getCompareItems());

    refresh();
    window.addEventListener('compare:updated', refresh);
    return () => window.removeEventListener('compare:updated', refresh);
  }, []);

  const updateParams = (next: { search?: string; category?: string; sort?: string }) => {
    const params = new URLSearchParams(searchParams);

    if (next.search !== undefined) {
      if (next.search) {
        params.set('search', next.search);
      } else {
        params.delete('search');
      }
    }

    if (next.category !== undefined) {
      if (next.category && next.category !== ALL_CATEGORIES_VALUE) {
        params.set('category', next.category);
      } else {
        params.delete('category');
      }
    }

    if (next.sort !== undefined) {
      if (next.sort && next.sort !== DEFAULT_SORT_VALUE) {
        params.set('sort', next.sort);
      } else {
        params.delete('sort');
      }
    }

    setSearchParams(params, { replace: true });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({ search: normalizedSearch });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(ALL_CATEGORIES_VALUE);
    setSelectedSort(DEFAULT_SORT_VALUE);
    setSearchParams({}, { replace: true });
  };

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
    <div className={
      `container mx-auto px-4 py-8 ${compareItems.length > 0 ? 'pb-28' : ''}`
    }
    >
      <Helmet>
        <title>Products</title>
      </Helmet>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse, filter, and compare parts that fit your build.
          </p>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-3xl">
          <div className="flex-1">
            <Input
              placeholder="Search by name, description, or category"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              setSelectedCategory(value);
              updateParams({ category: value });
            }}
          >
            <SelectTrigger className="sm:w-52">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES_VALUE}>All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedSort}
            onValueChange={(value) => {
              setSelectedSort(value);
              updateParams({ sort: value });
            }}
          >
            <SelectTrigger className="sm:w-52">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.label} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button type="submit">Search</Button>
            <Button type="button" variant="outline" onClick={handleClearFilters}>
              Clear
            </Button>
          </div>
        </form>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {visibleProducts.length === 0 && (
        <div className="flex h-96 items-center justify-center">
          <Alert>
            <AlertDescription>
              No products found.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {compareItems.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col gap-4 rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium">Compare list</p>
                <p className="text-xs text-muted-foreground">
                  {compareItems.length} item{compareItems.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {compareItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                    <span className="line-clamp-1 max-w-[140px]">{item.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFromCompare(item.id)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${item.name} from compare`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={clearCompare}>
                  Clear
                </Button>
                <Button asChild>
                  <Link to="/compare">Compare now</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}