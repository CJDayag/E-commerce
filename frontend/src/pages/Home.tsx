import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import api from '@/services/api';
import stockImg from "../assets/images/stockimg2.jpg";


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

export default function Home() {
    const [recentProducts, setRecentProducts] = useState<Product[]>([]);
    const [, setBestSellingProducts] = useState<Product[]>([]);
    const [loadingRecent, setLoadingRecent] = useState(true);
    const [, setLoadingBestSelling] = useState(true);

    useEffect(() => {
        // Fetch recently added products
        const fetchRecentProducts = async () => {
            try {
                const response = await api.get('/api/products/products/?ordering=-created_at&limit=4');

                if (response.data?.results) {
                    setRecentProducts(response.data.results);
                } else if (Array.isArray(response.data)) {
                    setRecentProducts(response.data.slice(0, 4));
                }
            } catch (error) {
                console.error('Failed to fetch recent products:', error);
            } finally {
                setLoadingRecent(false);
            }
        };

        // Fetch best selling products
        const fetchBestSellingProducts = async () => {
            try {
                const response = await api.get('/api/products/products/?ordering=-sold_count&limit=8');

                if (response.data?.results) {
                    setBestSellingProducts(response.data.results);
                } else if (Array.isArray(response.data)) {
                    setBestSellingProducts(response.data.slice(0, 8));
                }
            } catch (error) {
                console.error('Failed to fetch best selling products:', error);
            } finally {
                setLoadingBestSelling(false);
            }
        };

        fetchRecentProducts();
        fetchBestSellingProducts();
    }, []);

    return (
        <div className="container mx-auto p-5">
            {/* Hero Section */}
            <section className="mb-12">
                <div className="relative rounded-lg overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40 z-10"></div>
                    <img
                        src={stockImg}
                        alt="Shop Our Collection"
                        className="w-full h-[400px] object-cover"

                    />
                    <div className="absolute inset-0 z-20 flex flex-col justify-center p-8 md:p-12 lg:p-16">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                            Discover Amazing Products
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-lg">
                            Shop our latest collection of premium products at incredible prices
                        </p>
                        <div>
                            <Button asChild size="lg" className="text-lg px-8">
                                <Link to="/products">Shop Now</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recently Added Products */}
            <section className="mb-12">
                <h2 className="text-2xl md:text-3xl font-bold mb-6">Recently Added</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {loadingRecent ? (
                        // Show skeletons while loading
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="h-48 w-full rounded-lg" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ))
                    ) : (
                        // Show products when loaded
                        recentProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    )}
                </div>
                <div className="mt-6 text-center">
                    <Button variant="outline" asChild>
                        <Link to="/products">View All Products</Link>
                    </Button>
                </div>
            </section>

        </div>
    );
}