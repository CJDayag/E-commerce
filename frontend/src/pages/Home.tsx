import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import api from '@/services/api';
import stockImg from "../assets/images/stockimg2.jpg";
import { Star, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';


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
    const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
    const [loadingBestSelling, setLoadingBestSelling] = useState(true);
    const [email, setEmail] = useState('');
    const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

    const categoryTiles = [
        {
            title: 'Graphics Cards',
            description: 'RTX, Radeon, and workstation GPUs',
            search: 'GPU',
            tone: 'from-slate-900 via-slate-800 to-slate-700 text-white',
        },
        {
            title: 'Processors',
            description: 'Intel and AMD CPUs for every build',
            search: 'CPU',
            tone: 'from-amber-200 via-orange-200 to-rose-200 text-slate-900',
        },
        {
            title: 'Memory',
            description: 'DDR4, DDR5, and high-speed kits',
            search: 'RAM',
            tone: 'from-emerald-200 via-teal-200 to-cyan-200 text-slate-900',
        },
        {
            title: 'Storage',
            description: 'NVMe, SSD, and high-capacity drives',
            search: 'SSD',
            tone: 'from-indigo-200 via-violet-200 to-sky-200 text-slate-900',
        },
    ];

    useEffect(() => {
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
        fetchBestSellingProducts();
    }, []);

    const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!email.trim()) {
            toast.error('Please enter your email');
            return;
        }

        try {
            setIsSubmittingEmail(true);
            await api.post('/api/marketing/subscribe/', { email });
            toast.success('Thanks for subscribing!');
            setEmail('');
        } catch (error) {
            console.error('Failed to subscribe:', error);
            toast.error('Subscription failed. Please try again.');
        } finally {
            setIsSubmittingEmail(false);
        }
    };

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

            {/* Category Quick Jump */}
            <section className="mb-12">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold">Shop by Category</h2>
                        <p className="text-sm text-muted-foreground">
                            Jump straight to the parts you need.
                        </p>
                    </div>
                    <Button variant="ghost" asChild>
                        <Link to="/products">Browse all</Link>
                    </Button>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {categoryTiles.map((tile) => (
                        <Link
                            key={tile.title}
                            to={`/products?search=${encodeURIComponent(tile.search)}`}
                            className={
                                `group relative overflow-hidden rounded-2xl bg-gradient-to-r ${tile.tone} p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`
                            }
                        >
                            <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/20 blur-2xl"></div>
                            <div className="relative">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">Category</p>
                                <h3 className="mt-2 text-2xl font-semibold">{tile.title}</h3>
                                <p className="mt-2 text-sm opacity-80">{tile.description}</p>
                                <span className="mt-6 inline-flex items-center text-sm font-semibold">
                                    Shop now →
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Build Guide */}
            <section className="mb-12">
                <div className="rounded-3xl border bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-lg">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Build guide</p>
                            <h2 className="mt-2 text-2xl md:text-3xl font-semibold">Start a PC build in minutes</h2>
                            <p className="mt-2 text-sm text-white/70">
                                Follow the essentials and jump to the right parts.
                            </p>
                        </div>
                        <Button asChild className="bg-white text-slate-900 hover:bg-white/90">
                            <Link to="/products">Build with these parts</Link>
                        </Button>
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-4">
                        {[
                            { title: 'Choose CPU', search: 'CPU', detail: 'Intel or AMD' },
                            { title: 'Pick Motherboard', search: 'motherboard', detail: 'Match the socket' },
                            { title: 'Add Memory', search: 'RAM', detail: 'DDR4 or DDR5' },
                            { title: 'Select Storage', search: 'SSD', detail: 'NVMe for speed' },
                        ].map((step, index) => (
                            <Link
                                key={step.title}
                                to={`/products?search=${encodeURIComponent(step.search)}`}
                                className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-1 hover:bg-white/10"
                            >
                                <div className="text-xs text-white/60">Step {index + 1}</div>
                                <div className="mt-2 text-base font-semibold">{step.title}</div>
                                <div className="mt-1 text-sm text-white/70">{step.detail}</div>
                                <span className="mt-4 inline-flex text-xs font-semibold text-white/80">
                                    Shop {step.search} →
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Bundles */}
            <section className="mb-12">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold">Featured Bundles</h2>
                        <p className="text-sm text-muted-foreground">
                            Curated combos to jumpstart your build and save time.
                        </p>
                    </div>
                    <Button variant="ghost" asChild>
                        <Link to="/products">Build your own</Link>
                    </Button>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {[
                        {
                            title: 'Gaming Core Bundle',
                            description: 'Ryzen 7 + B650 + 32GB DDR5',
                            savings: 'Save 8%',
                            search: 'Ryzen 7',
                            tone: 'from-rose-500/15 via-orange-500/10 to-amber-500/15',
                        },
                        {
                            title: 'Creator Bundle',
                            description: 'Intel i7 + Z790 + 64GB DDR5',
                            savings: 'Save 10%',
                            search: 'Intel i7',
                            tone: 'from-indigo-500/15 via-sky-500/10 to-cyan-500/15',
                        },
                        {
                            title: 'Value Upgrade Pack',
                            description: 'Core i5 + B760 + 16GB DDR4',
                            savings: 'Save 6%',
                            search: 'Core i5',
                            tone: 'from-emerald-500/15 via-teal-500/10 to-lime-500/15',
                        },
                    ].map((bundle) => (
                        <div
                            key={bundle.title}
                            className={
                                `rounded-2xl border bg-gradient-to-br ${bundle.tone} p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`
                            }
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Bundle</p>
                                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-sm">
                                    {bundle.savings}
                                </span>
                            </div>
                            <h3 className="mt-3 text-lg font-semibold">{bundle.title}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">{bundle.description}</p>
                            <Button asChild className="mt-5 w-full" variant="secondary">
                                <Link to={`/products?search=${encodeURIComponent(bundle.search)}`}>Shop this bundle</Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Top-rated Products */}
            <section className="mb-12">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold">Top-rated Products</h2>
                        <p className="text-sm text-muted-foreground">
                            Customer favorites with strong reviews.
                        </p>
                    </div>
                    <Button variant="ghost" asChild>
                        <Link to="/products">See all</Link>
                    </Button>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-amber-600">
                    {[...Array(5)].map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-amber-500" />
                    ))}
                    <span className="text-muted-foreground">Average 4.8 across best sellers</span>
                </div>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {loadingBestSelling ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="h-48 w-full rounded-lg" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ))
                    ) : (
                        bestSellingProducts.slice(0, 4).map((product) => (
                            <ProductCard key={product.id} product={product} highlightLabel="Top Rated" />
                        ))
                    )}
                </div>
            </section>

            {/* Trust & Assurance */}
            <section className="mb-12">
                <div className="grid gap-4 md:grid-cols-3">
                    {[
                        {
                            title: 'Fast Shipping',
                            description: '2-5 day delivery with tracking on every order.',
                            tag: 'Express options',
                            icon: Truck,
                        },
                        {
                            title: 'Warranty Coverage',
                            description: 'Verified parts backed by manufacturer warranties.',
                            tag: 'Support included',
                            icon: ShieldCheck,
                        },
                        {
                            title: 'Easy Returns',
                            description: '30-day hassle-free returns on unused items.',
                            tag: 'Simple refunds',
                            icon: RefreshCcw,
                        },
                    ].map((item) => (
                        <div
                            key={item.title}
                            className="rounded-2xl border bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:bg-white/5"
                        >
                            <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                {item.tag}
                            </p>
                                <item.icon className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Email Capture */}
            <section className="mb-12">
                <div className="rounded-3xl border bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-6 text-white shadow-lg">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Deal alerts</p>
                            <h2 className="mt-2 text-2xl md:text-3xl font-semibold">Get restock + promo drops</h2>
                            <p className="mt-2 text-sm text-white/70">
                                Weekly highlights, no spam. Be first to know about limited deals.
                            </p>
                        </div>
                        <form className="flex w-full flex-col gap-2 md:w-auto md:flex-row" onSubmit={handleEmailSubmit}>
                            <input
                                type="email"
                                placeholder="you@email.com"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="h-11 w-full rounded-full border border-white/15 bg-white/10 px-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 md:w-64"
                            />
                            <Button type="submit" className="h-11 rounded-full bg-white text-slate-900 hover:bg-white/90" disabled={isSubmittingEmail}>
                                {isSubmittingEmail ? 'Sending...' : 'Notify me'}
                            </Button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Brand Logos */}
            <section className="mb-12">
                <div className="rounded-2xl border bg-white/70 px-6 py-4 shadow-sm dark:bg-white/5">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Trusted brands</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-semibold text-muted-foreground md:grid-cols-6">
                        {['ASUS', 'MSI', 'Intel', 'AMD', 'Corsair', 'Samsung'].map((brand) => (
                            <div
                                key={brand}
                                className="flex items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 py-3"
                            >
                                {brand}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
}