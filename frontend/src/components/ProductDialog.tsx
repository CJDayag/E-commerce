// ProductDialog.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Heart, Scale, Star } from "lucide-react";

// Shadcn components
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { isInWishlist, toggleWishlist } from "@/lib/wishlist";
import { isInCompare, toggleCompare, MAX_COMPARE } from "@/lib/compare";
import { addGuestCartItem } from "@/lib/guest-cart";

// Types
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
    condition: string;
    image: string | null;
}

interface ProductDialogProps {
    productId: number;
    children: React.ReactNode;
}

// Form schema
const formSchema = z.object({
    quantity: z.number().min(1, "Quantity must be at least 1"),
});

const apiURL = 'http://127.0.0.1:8000';

type FormValues = z.infer<typeof formSchema>;

export default function ProductDialog({ productId, children }: ProductDialogProps) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isCompared, setIsCompared] = useState(false);

    // Form setup
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            quantity: 1,
        },
    });

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchProduct = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${apiURL}/api/products/products/${productId}/`);
            setProduct(response.data);
        } catch (error) {
            console.error("Failed to fetch product:", error);
            toast.error("Failed to fetch product details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (product) {
            setIsWishlisted(isInWishlist(product.id));
        }
    }, [product]);

    useEffect(() => {
        if (product) {
            setIsCompared(isInCompare(product.id));
        }
    }, [product]);

    useEffect(() => {
        const handler = () => {
            if (product) {
                setIsWishlisted(isInWishlist(product.id));
            }
        };

        window.addEventListener('wishlist:updated', handler);
        return () => window.removeEventListener('wishlist:updated', handler);
    }, [product]);

    useEffect(() => {
        const handler = () => {
            if (product) {
                setIsCompared(isInCompare(product.id));
            }
        };

        window.addEventListener('compare:updated', handler);
        return () => window.removeEventListener('compare:updated', handler);
    }, [product]);

    const handleWishlistToggle = () => {
        if (!product) {
            return;
        }

        const next = toggleWishlist(product);
        setIsWishlisted(next);
        toast.success(next ? 'Added to wishlist' : 'Removed from wishlist');
    };

    const handleCompareToggle = () => {
        if (!product) {
            return;
        }

        const result = toggleCompare(product);

        if (!result.success) {
            toast.error(`You can compare up to ${MAX_COMPARE} items.`);
            return;
        }

        setIsCompared(result.inCompare);
        toast.success(result.inCompare ? 'Added to compare' : 'Removed from compare');
    };

    const handleAddToCart = async (data: FormValues) => {
        // Check if user is authenticated by verifying if auth token exists
        const token = localStorage.getItem('authToken');

        if (!token) {
            if (!product) {
                toast.error("Product data is unavailable");
                return;
            }

            addGuestCartItem({
                product: {
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    image: product.image ?? undefined,
                },
                quantity: data.quantity,
            });

            toast.success(`Added ${data.quantity} ${product.name} to cart`);
            setOpen(false);
            return;
        }

        try {
            await axios.post(`${apiURL}/api/cart/add_item/`, {
                product_id: productId,
                quantity: data.quantity,
            }, {
                headers: getAuthHeaders()
            });
            toast.success(`Added ${data.quantity} ${product?.name} to cart`);
            setOpen(false);
        } catch (error) {
            console.error("Failed to add item to cart:", error);
            toast.error("Failed to add item to cart");
        }
    };

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            setOpen(newOpen);
            if (newOpen) {
                fetchProduct();
            }
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
                {loading ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Loading Product</DialogTitle>
                            <DialogDescription>Please wait while we fetch the product details</DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
                        </div>
                    </>
                ) : product ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>{product.name}</DialogTitle>
                            <DialogDescription>
                                {product.category?.name} • {product.condition}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Left side - Image */}
                            <div className="flex h-full flex-col gap-3">
                                <div className="relative overflow-hidden rounded-md border bg-muted">
                                    {product.image ? (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="h-full max-h-[420px] w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex min-h-[280px] items-center justify-center text-muted-foreground">
                                            No image available
                                        </div>
                                    )}
                                    <div className="absolute left-3 top-3">
                                        <Badge variant={product.stock > 0 ? "secondary" : "destructive"}>
                                            {product.stock > 0 ? 'In stock' : 'Out of stock'}
                                        </Badge>
                                    </div>
                                </div>
                                {product.image && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="h-14 w-14 overflow-hidden rounded-md border"
                                            aria-label="Product image thumbnail"
                                        >
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Right side - Product Info */}
                            <div>
                                <Card className="h-full flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="text-xl flex items-center justify-between gap-3">
                                            <span>Details</span>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="icon"
                                                    onClick={handleWishlistToggle}
                                                    aria-pressed={isWishlisted}
                                                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                                                    className={cn(
                                                        "h-9 w-9 rounded-full bg-background/80 backdrop-blur",
                                                        isWishlisted ? "text-red-500" : "text-muted-foreground"
                                                    )}
                                                >
                                                    <Heart className={cn("h-4 w-4", isWishlisted && "fill-red-500")} />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="icon"
                                                    onClick={handleCompareToggle}
                                                    aria-pressed={isCompared}
                                                    aria-label={isCompared ? 'Remove from compare' : 'Add to compare'}
                                                    className={cn(
                                                        "h-9 w-9 rounded-full bg-background/80 backdrop-blur",
                                                        isCompared ? "text-primary" : "text-muted-foreground"
                                                    )}
                                                >
                                                    <Scale className={cn("h-4 w-4", isCompared && "fill-primary")} />
                                                </Button>
                                                <span className="font-medium">${Number(product.price).toFixed(2)}</span>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-4">
                                        <Tabs defaultValue="details" className="w-full">
                                            <TabsList className="grid w-full grid-cols-3">
                                                <TabsTrigger value="details">Details</TabsTrigger>
                                                <TabsTrigger value="specs">Specs</TabsTrigger>
                                                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="details" className="space-y-4 pt-4">
                                                <div>
                                                    <h3 className="text-sm font-medium">Description</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {product.description}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant="outline">Category: {product.category?.name ?? '—'}</Badge>
                                                    <Badge variant="outline">Condition: {product.condition}</Badge>
                                                    <Badge variant="outline">SKU: #{product.id}</Badge>
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="specs" className="space-y-3 pt-4">
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div className="text-muted-foreground">Category</div>
                                                    <div>{product.category?.name ?? '—'}</div>
                                                    <div className="text-muted-foreground">Condition</div>
                                                    <div>{product.condition}</div>
                                                    <div className="text-muted-foreground">Availability</div>
                                                    <div>{product.stock > 0 ? `${product.stock} available` : 'Out of stock'}</div>
                                                    <div className="text-muted-foreground">Product ID</div>
                                                    <div>#{product.id}</div>
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="reviews" className="space-y-3 pt-4">
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    {[...Array(5)].map((_, index) => (
                                                        <Star key={index} className="h-4 w-4" />
                                                    ))}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    No reviews yet. Be the first to share feedback.
                                                </p>
                                            </TabsContent>
                                        </Tabs>
                                    </CardContent>
                                    <Separator />
                                    <CardFooter className="pt-4">
                                        <Form {...form}>
                                            <form onSubmit={form.handleSubmit(handleAddToCart)} className="w-full flex items-end gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="quantity"
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormLabel>Quantity</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min={1}
                                                                    max={product.stock}
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button
                                                    type="submit"
                                                    disabled={product.stock <= 0}
                                                    className="flex-1"
                                                >
                                                    {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                                                </Button>
                                            </form>
                                        </Form>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Error Loading Product</DialogTitle>
                            <DialogDescription>
                                We encountered a problem loading the product information
                            </DialogDescription>
                        </DialogHeader>
                        <div className="p-6 text-center text-muted-foreground">
                            Failed to load product information
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
