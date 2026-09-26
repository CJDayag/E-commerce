// src/pages/Checkout.tsx
import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { AlertCircle, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Define API base URL
const API_BASE_URL = 'http://localhost:8000';

// Define interfaces based on Django models
interface OrderItem {
    id: number;
    product: {
        id: number;
        name: string;
        price: number;
        image?: string;
    };
    quantity: number;
    price: number;
}

interface Order {
    id: number;
    user: number;
    created_at: string;
    status: string;
    payment_method: string;
    total_price: number;
    promo_code?: string | null;
    discount_amount?: number | string;
    items: OrderItem[];
}

// Define cart interfaces to match with the Cart component
interface CartItem {
    id: number;
    product: {
        id: number;
        name: string;
        price: number;
        image?: string;
    };
    quantity: number;
}

interface TransformedCart {
    id: number;
    items: CartItem[];
    total_price: number;
    item_count: number;
}

// Form schema validation using Zod
const formSchema = z.object({
    payment_method: z.string().nonempty("Payment method is required"),
    shipping_address: z.object({
        address_line1: z.string().nonempty("Address line 1 is required"),
        address_line2: z.string().optional(),
        city: z.string().nonempty("City is required"),
        state: z.string().nonempty("State is required"),
        postal_code: z.string().nonempty("Postal code is required"),
        country: z.string().nonempty("Country is required"),
    }),
    phone_number: z.string().nonempty("Phone number is required"),
});


export default function Checkout() {
    const [cart, setCart] = useState<TransformedCart | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
    const [discount, setDiscount] = useState(0);
    const [shippingMethod, setShippingMethod] = useState('standard');
    const navigate = useNavigate();

    // Form setup
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            payment_method: 'COD',
            shipping_address: {
                address_line1: '',
                address_line2: '',
                city: '',
                state: '',
                postal_code: '',
                country: '',
            },
            phone_number: '',
        },
    });


    // Function to get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // Fetch cart data
    const fetchCart = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/cart/`, {
                headers: getAuthHeaders()
            });

            // If response is an array, take the first cart
            const cartData = Array.isArray(response.data) ? response.data[0] : response.data;

            if (cartData && cartData.items) {
                // Transform cart items to match our display format
                const transformedItems = cartData.items.map(item => ({
                    id: item.cart_item_id,
                    product: {
                        ...item.product,
                        price: Number(item.product.price)
                    },
                    quantity: item.quantity
                }));

                // Create transformed cart object
                const transformedCart = {
                    id: cartData.cart_id,
                    items: transformedItems,
                    total_price: transformedItems.reduce(
                        (sum, item) => sum + (item.product.price * item.quantity), 0
                    ),
                    item_count: transformedItems.reduce(
                        (sum, item) => sum + item.quantity, 0
                    )
                };

                setCart(transformedCart);
            }
        } catch (error) {
            console.error('Failed to fetch cart:', error);
            toast.error('Failed to load cart data');
        } finally {
            setIsLoading(false);
        }
    };

    // Place order from cart
    const placeOrder = async (values: z.infer<typeof formSchema>) => {
        setIsPlacingOrder(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/orders/create_from_cart/`, {
                payment_method: values.payment_method,
                shipping_address: values.shipping_address,
                phone_number: values.phone_number,
                promo_code: appliedPromoCode,
            }, {
                headers: getAuthHeaders()
            });

            setOrder(response.data);
            setOrderComplete(true);
            toast.success("Order placed successfully!");

        } catch (error) {
            console.error('Error placing order:', error);
            toast.error("Failed to place order. Please try again.");
        } finally {
            setIsPlacingOrder(false);
        }
    };

    // Fetch cart when component mounts
    useEffect(() => {
        fetchCart();
    }, []);

    // If cart is empty and not loading, redirect to products
    useEffect(() => {
        if (!isLoading && cart && cart.items.length === 0) {
            toast.error('Your cart is empty');
            navigate('/products');
        }
    }, [cart, isLoading, navigate]);

    // Handle form submission
    const onSubmit = (data: z.infer<typeof formSchema>) => {
        placeOrder(data);
    };

    const subtotal = useMemo(() => cart?.total_price ?? 0, [cart?.total_price]);
    const shippingCost = useMemo(() => {
        if (shippingMethod === 'express') {
            return 24.99;
        }

        if (shippingMethod === 'priority') {
            return 12.99;
        }

        return 0;
    }, [shippingMethod]);
    const estimatedTotal = useMemo(() => {
        return Math.max(subtotal + shippingCost - discount, 0);
    }, [subtotal, shippingCost, discount]);

    const handleApplyPromo = async () => {
        const normalized = promoCode.trim().toUpperCase();

        if (!normalized) {
            toast.error('Enter a promo code');
            return;
        }

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/orders/promocodes/validate/`,
                { code: normalized },
                { headers: getAuthHeaders() }
            );

            const nextDiscount = Number(response.data.discount_amount) || 0;
            setDiscount(nextDiscount);
            setAppliedPromoCode(response.data.code || normalized);
            toast.success('Promo code applied');
        } catch (error) {
            console.error('Failed to validate promo code:', error);
            setDiscount(0);
            setAppliedPromoCode(null);
            toast.error('Invalid promo code');
        }
    };

    if (orderComplete && order) {
        return (
            <div className="container max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <Card className="w-full">
                    <CardHeader className="bg-green-50 dark:bg-green-950">
                        <div className="flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                        </div>
                        <CardTitle className="text-center">Order Confirmed!</CardTitle>
                        <CardDescription className="text-center">
                            Your order #{order.id} has been placed successfully
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-medium text-lg">Order Details</h3>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="text-muted-foreground">Order Number:</div>
                                    <div className="font-medium">{order.id}</div>
                                    <div className="text-muted-foreground">Date:</div>
                                    <div className="font-medium">{new Date(order.created_at).toLocaleString()}</div>
                                    <div className="text-muted-foreground">Status:</div>
                                    <div className="font-medium capitalize">{order.status.toLowerCase()}</div>
                                    <div className="text-muted-foreground">Payment Method:</div>
                                    <div className="font-medium">{order.payment_method === 'COD' ? 'Cash on Delivery' : order.payment_method}</div>
                                    {order.promo_code && (
                                        <>
                                            <div className="text-muted-foreground">Promo Code:</div>
                                            <div className="font-medium">{order.promo_code}</div>
                                            <div className="text-muted-foreground">Discount:</div>
                                            <div className="font-medium text-emerald-600">
                                                -${Number(order.discount_amount || 0).toFixed(2)}
                                            </div>
                                        </>
                                    )}
                                    <div className="text-muted-foreground">Total:</div>
                                    <span className="font-bold">
                                          ${((order.total_price || order.total_amount || 0) * 1).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="font-medium text-lg mb-4">Order Items</h3>
                                <div className="space-y-4">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                {item.product.image && (
                                                    <div className="h-12 w-12 flex-shrink-0">
                                                        <img
                                                            src={item.product.image}
                                                            alt={item.product.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium">{item.product.name}</p>
                                                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-center mt-6">
                                <Button onClick={() => navigate('/products')} className="w-full sm:w-auto">
                                    Continue Shopping
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            {isLoading ? (
                <div className="flex justify-center py-12">Loading checkout information...</div>
            ) : cart && cart.items.length > 0 ? (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Shipping & Payment</CardTitle>
                                <CardDescription>Enter your shipping details and choose payment method</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="shipping_address.address_line1"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Address Line 1</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="123 Main St" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="shipping_address.address_line2"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Address Line 2 (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Apt 4B" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="shipping_address.city"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>City</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="New York" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="shipping_address.state"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>State/Province</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="NY" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="shipping_address.postal_code"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Postal Code</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="10001" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="shipping_address.country"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Country</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="United States" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="phone_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Phone Number</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="+1 (555) 123-4567" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="payment_method"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Payment Method</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a payment method" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="COD">Cash on Delivery</SelectItem>
                                                            <SelectItem value="CARD" disabled>Credit/Debit Card (Coming soon)</SelectItem>
                                                            <SelectItem value="PAYPAL" disabled>PayPal (Coming soon)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription>
                                                        Additional payment methods are coming soon
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle>Please Note</AlertTitle>
                                            <AlertDescription>
                                                By placing this order, you agree to our terms and conditions.
                                            </AlertDescription>
                                        </Alert>

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={isPlacingOrder}
                                        >
                                            {isPlacingOrder ? (
                                                <>Processing Order...</>
                                            ) : (
                                                <>Place Order</>
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <Card className="md:sticky md:top-6">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Order Summary</CardTitle>
                                    <ShoppingBag className="h-5 w-5" />
                                </div>
                                <CardDescription>{cart?.item_count} items in your cart</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-5">
                                    {cart?.items.map((item) => (
                                        <div key={item.id} className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{item.product.name}</p>
                                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                            </div>
                                            <p>${(item.product.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}

                                    <Separator />

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Shipping</span>
                                                <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                                            </div>
                                            <Select
                                                value={shippingMethod}
                                                onValueChange={setShippingMethod}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose shipping" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="standard">Standard (3-5 days) • Free</SelectItem>
                                                    <SelectItem value="priority">Priority (2-3 days) • $12.99</SelectItem>
                                                    <SelectItem value="express">Express (1-2 days) • $24.99</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Promo code</span>
                                                {discount > 0 && (
                                                    <span className="text-emerald-600">-${discount.toFixed(2)}</span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={promoCode}
                                                    onChange={(event) => setPromoCode(event.target.value)}
                                                    placeholder="WELCOME10"
                                                />
                                                <Button type="button" variant="outline" onClick={handleApplyPromo}>
                                                    Apply
                                                </Button>
                                            </div>
                                            {appliedPromoCode ? (
                                                <p className="text-xs text-emerald-600">Applied: {appliedPromoCode}</p>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">Enter a promo code from the banner.</p>
                                            )}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="flex justify-between items-center font-medium">
                                        <span>Estimated total</span>
                                        <span>${estimatedTotal.toFixed(2)}</span>
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => navigate('/cart')}
                                        >
                                            Back to Cart
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No items in your cart</AlertTitle>
                    <AlertDescription>
                        Your cart is empty. Please add some products before checking out.
                        <div className="mt-4">
                            <Button variant="outline" onClick={() => navigate('/products')}>
                                Browse Products
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}