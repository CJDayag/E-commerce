// ProductDialog.tsx
import { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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

    const handleAddToCart = async (data: FormValues) => {
        // Check if user is authenticated by verifying if auth token exists
        const token = localStorage.getItem('authToken');

        if (!token) {
            // User is not authenticated
            toast.error("Please log in to add items to your cart");
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left side - Image */}
                            <div className="flex justify-center items-center h-full">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="rounded-md object-cover w-full h-full max-h-[400px]"
                                    />
                                ) : (
                                    <div className="bg-muted h-full w-full rounded-md flex items-center justify-center text-muted-foreground min-h-[250px]">
                                        No image available
                                    </div>
                                )}
                            </div>

                            {/* Right side - Product Info */}
                            <div>
                                <Card className="h-full flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="text-xl flex justify-between items-center">
                                            <span>Details</span>
                                            <span className="font-medium">${Number(product.price).toFixed(2)}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 flex-grow">
                                        <div>
                                            <h3 className="font-medium">Description</h3>
                                            <p className="text-sm text-muted-foreground">{product.description}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <h3 className="font-medium">Stock</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
                                                </p>
                                            </div>
                                            <div>
                                                <h3 className="font-medium">Condition</h3>
                                                <p className="text-sm text-muted-foreground">{product.condition}</p>
                                            </div>
                                        </div>
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
