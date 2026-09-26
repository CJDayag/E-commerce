// src/components/Cart.tsx
import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash, Plus, Minus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
    Card,
    CardDescription,
    CardTitle
} from "@/components/ui/card";
import { toast } from 'sonner';
import {
    addGuestCartItem,
    getGuestCartItems,
    removeGuestCartItem,
    updateGuestCartQuantity,
    type GuestCartItem,
} from '@/lib/guest-cart';
import {
    addSavedForLaterItem,
    getSavedForLaterItems,
    removeSavedForLaterItem,
    type SavedForLaterItem,
} from '@/lib/saved-for-later';

// Define API base URL
const API_BASE_URL = 'http://localhost:8000';

// Updated interface for Cart Item to match the serializer
interface CartItem {
    cart_item_id: number;
    product: {
        id: number;
        name: string;
        price: string; // API returns price as string
        image?: string;
    };
    quantity: number;
}

interface CartSheetProps {
    customTrigger?: React.ReactNode;
}

// Updated interface for Cart to match the serializer
interface Cart {
    cart_id: number;
    user_id: number;
    items: CartItem[];
    created_at: string;
}

// Interface for our transformed cart with calculated fields
interface TransformedCart {
    id: number;
    items: Array<{
        id: number;
        product: {
            id: number;
            name: string;
            price: number;
            image?: string;
        };
        quantity: number;
    }>;
    total_price: number;
    item_count: number;
}

interface NormalizedCartItem {
    id: number;
    product: {
        id: number;
        name: string;
        price: number;
        image?: string;
    };
    quantity: number;
}

export function CartSheet({ customTrigger }: CartSheetProps) {
    const [cart, setCart] = useState<TransformedCart | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [guestCartItems, setGuestCartItems] = useState<GuestCartItem[]>([]);
    const [savedForLaterItems, setSavedForLaterItems] = useState<SavedForLaterItem[]>([]);
    const [hasToken, setHasToken] = useState(() => Boolean(localStorage.getItem('authToken')));
    const navigate = useNavigate();

    // Function to get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // Function to fetch cart data
    const fetchCart = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/cart/`, {
                headers: getAuthHeaders()
            });
            console.log('Cart API response:', response.data);

            // If response is an array, take the first cart
            const cartData: Cart = Array.isArray(response.data) ? response.data[0] : response.data;

            // Transform the cart data to match our interface
            if (cartData && cartData.items) {
                // Transform cart items to match our display format
                const transformedItems = cartData.items.map(item => ({
                    id: item.cart_item_id, // Use cart_item_id from serializer
                    product: {
                        ...item.product,
                        price: Number(item.product.price) // Convert string price to number
                    },
                    quantity: item.quantity
                }));

                // Create transformed cart object with calculated values
                const transformedCart: TransformedCart = {
                    id: cartData.cart_id, // Use cart_id from serializer
                    items: transformedItems,
                    total_price: transformedItems.reduce(
                        (sum, item) => sum + (item.product.price * item.quantity), 0
                    ),
                    item_count: transformedItems.reduce(
                        (sum, item) => sum + item.quantity, 0
                    )
                };

                setCart(transformedCart);
                window.dispatchEvent(new Event('cart:updated'));
            }
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshGuestCart = () => {
        setGuestCartItems(getGuestCartItems());
    };

    const refreshSavedForLater = () => {
        setSavedForLaterItems(getSavedForLaterItems());
    };

    // Function to update item quantity
    const updateItemQuantity = async (item: NormalizedCartItem, newQuantity: number) => {
        if (newQuantity <= 0) {
            await removeItem(item);
            return;
        }

        if (!hasToken) {
            updateGuestCartQuantity(item.product.id, newQuantity);
            refreshGuestCart();
            return;
        }

        setIsLoading(true);
        try {
            await axios.put(
                `${API_BASE_URL}/api/cart/update_item/`,
                {
                    cart_item_id: item.id,
                    quantity: newQuantity
                },
                { headers: getAuthHeaders() }
            );
            fetchCart();
        } catch (error) {
            console.error('Failed to update item:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const removeItem = async (item: NormalizedCartItem) => {
        if (!hasToken) {
            removeGuestCartItem(item.product.id);
            refreshGuestCart();
            toast.success('Item removed from cart');
            return;
        }

        setIsLoading(true);
        try {
            await axios.delete(
                `${API_BASE_URL}/api/cart/remove_item/`,
                {
                    headers: getAuthHeaders(),
                    data: { cart_item_id: item.id }
                }
            );
            fetchCart();
            toast.success('Item removed from cart');
        } catch (error) {
            console.error('Failed to remove item:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveForLater = async (item: NormalizedCartItem) => {
        addSavedForLaterItem({ product: item.product, quantity: item.quantity });

        if (!hasToken) {
            removeGuestCartItem(item.product.id);
            refreshGuestCart();
            refreshSavedForLater();
            toast.success('Saved for later');
            return;
        }

        setIsLoading(true);
        try {
            await axios.delete(
                `${API_BASE_URL}/api/cart/remove_item/`,
                {
                    headers: getAuthHeaders(),
                    data: { cart_item_id: item.id }
                }
            );
            fetchCart();
            refreshSavedForLater();
            toast.success('Saved for later');
        } catch (error) {
            console.error('Failed to save item for later:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const moveSavedToCart = async (item: SavedForLaterItem) => {
        if (!hasToken) {
            addGuestCartItem(item);
            removeSavedForLaterItem(item.product.id);
            refreshGuestCart();
            refreshSavedForLater();
            toast.success('Moved to cart');
            return;
        }

        setIsLoading(true);
        try {
            await axios.post(
                `${API_BASE_URL}/api/cart/add_item/`,
                {
                    product_id: item.product.id,
                    quantity: item.quantity,
                },
                { headers: getAuthHeaders() }
            );
            removeSavedForLaterItem(item.product.id);
            fetchCart();
            refreshSavedForLater();
            toast.success('Moved to cart');
        } catch (error) {
            console.error('Failed to move item to cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch cart when component mounts or sheet opens
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const tokenExists = Boolean(localStorage.getItem('authToken'));
        setHasToken(tokenExists);

        if (tokenExists) {
            fetchCart();
        } else {
            refreshGuestCart();
        }

        refreshSavedForLater();
    }, [isOpen]);

    useEffect(() => {
        const handleGuestCartUpdate = () => refreshGuestCart();
        const handleSavedUpdate = () => refreshSavedForLater();

        window.addEventListener('guest-cart:updated', handleGuestCartUpdate);
        window.addEventListener('saved-for-later:updated', handleSavedUpdate);

        return () => {
            window.removeEventListener('guest-cart:updated', handleGuestCartUpdate);
            window.removeEventListener('saved-for-later:updated', handleSavedUpdate);
        };
    }, []);

    const normalizedItems: NormalizedCartItem[] = useMemo(() => {
        if (hasToken) {
            return cart?.items ?? [];
        }

        return guestCartItems.map((item) => ({
            id: item.product.id,
            product: item.product,
            quantity: item.quantity,
        }));
    }, [cart?.items, guestCartItems, hasToken]);

    const cartItemCount = useMemo(() => {
        if (hasToken) {
            return cart?.item_count ?? 0;
        }

        return guestCartItems.reduce((sum, item) => sum + item.quantity, 0);
    }, [cart?.item_count, guestCartItems, hasToken]);

    const cartTotal = useMemo(() => {
        if (hasToken) {
            return cart?.total_price ?? 0;
        }

        return guestCartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    }, [cart?.total_price, guestCartItems, hasToken]);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                {customTrigger ? (
                    customTrigger
                ) : (
                    <div className="relative cursor-pointer">
                        <ShoppingCart className="h-5 w-5 opacity-80 group-hover:opacity-100" />
                        {cartItemCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                                {cartItemCount}
                            </span>
                        )}
                    </div>
                )}
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-md overflow-y-auto px-6">
                <SheetHeader>
                    <SheetTitle className="flex items-center">
                        <ShoppingCart className="mr-2" /> Your Cart
                    </SheetTitle>
                    <SheetDescription>
                        {normalizedItems.length
                            ? `You have ${normalizedItems.length} item${normalizedItems.length !== 1 ? 's' : ''} in your cart.`
                            : 'Your cart is empty.'
                        }
                    </SheetDescription>
                </SheetHeader>

                <div className="py-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8">Loading cart...</div>
                    ) : normalizedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <ShoppingCart className="h-12 w-12 mb-4 opacity-30" />
                            <p className="text-muted-foreground">Your cart is empty</p>
                            <Button variant="outline" className="mt-4" onClick={() => setIsOpen(false)}>
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {normalizedItems.map((item) => (
                                    <Card key={item.id} className="overflow-hidden">
                                        <div className="flex">
                                            {item.product.image && (
                                                <div className="h-24 w-24 flex-shrink-0">
                                                    <img
                                                        src={item.product.image}
                                                        alt={item.product.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex flex-1 flex-col justify-between p-3">
                                                <div>
                                                    <CardTitle className="text-base">
                                                        {item.product.name}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        ${item.product.price.toFixed(2)}
                                                    </CardDescription>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-1">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => updateItemQuantity(item, item.quantity - 1)}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="w-6 text-center">{item.quantity}</span>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => updateItemQuantity(item, item.quantity + 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs"
                                                            onClick={() => saveForLater(item)}
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-red-500"
                                                            onClick={() => removeItem(item)}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-base">
                                    <span>Total</span>
                                    <span className="font-bold">${cartTotal.toFixed(2)}</span>
                                </div>

                                {normalizedItems.length > 0 && (
                                    <div className="mt-6">
                                        <Button
                                            className="w-full"
                                            onClick={() => {
                                                setIsOpen(false);
                                                navigate(hasToken ? '/checkout' : '/login');
                                            }}
                                        >
                                            {hasToken ? 'Proceed to Checkout' : 'Sign in to Checkout'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                    {savedForLaterItems.length > 0 && (
                        <>
                            <Separator className="my-4" />
                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-sm font-medium">Saved for later</p>
                                    <span className="text-xs text-muted-foreground">
                                        {savedForLaterItems.length} item{savedForLaterItems.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {savedForLaterItems.map((item) => (
                                        <Card key={item.product.id} className="overflow-hidden">
                                            <div className="flex">
                                                {item.product.image && (
                                                    <div className="h-20 w-20 flex-shrink-0">
                                                        <img
                                                            src={item.product.image}
                                                            alt={item.product.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex flex-1 items-center justify-between p-3">
                                                    <div>
                                                        <CardTitle className="text-sm">
                                                            {item.product.name}
                                                        </CardTitle>
                                                        <CardDescription>
                                                            ${item.product.price.toFixed(2)}
                                                        </CardDescription>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => moveSavedToCart(item)}
                                                        >
                                                            Move to Cart
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-red-500"
                                                            onClick={() => removeSavedForLaterItem(item.product.id)}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}