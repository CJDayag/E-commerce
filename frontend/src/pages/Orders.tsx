// src/pages/Orders.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';

// UI Components
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PackageOpen, Clock, ShoppingBag, AlertCircle, Loader2 } from 'lucide-react';

// Define API base URL
const API_BASE_URL = 'http://localhost:8000';

// Define interfaces based on Django models
interface Product {
    id: number;
    name: string;
    price: number;
    image?: string;
}

interface OrderItem {
    id: number;
    product: Product;
    quantity: number;
    price: number;
}

interface Order {
    id: number;
    user: number;
    created_at: string;
    status: string;
    payment_method: string;
    total_price: string;
    items: OrderItem[];
}

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Function to get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // Fetch orders data
    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await axios.get(`${API_BASE_URL}/api/orders/`, {
                    headers: getAuthHeaders()
                });

                setOrders(response.data);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError('Failed to load your orders. Please try again later.');
                toast.error('Could not load orders');
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, []);

    // Function to get appropriate badge color based on order status
    const getStatusBadgeVariant = (status: string) => {
        switch(status) {
            case 'PENDING':
                return 'secondary';
            case 'PROCESSING':
                return 'warning';
            case 'SHIPPED':
                return 'info';
            case 'DELIVERED':
                return 'success';
            case 'CANCELLED':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    // Function to get appropriate icon based on order status
    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'PENDING':
                return <Clock className="h-4 w-4 mr-2" />;
            case 'PROCESSING':
                return <Loader2 className="h-4 w-4 mr-2 animate-spin" />;
            case 'SHIPPED':
                return <PackageOpen className="h-4 w-4 mr-2" />;
            case 'DELIVERED':
                return <ShoppingBag className="h-4 w-4 mr-2" />;
            case 'CANCELLED':
                return <AlertCircle className="h-4 w-4 mr-2" />;
            default:
                return null;
        }
    };

    // Format date string to readable format
    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'PPP p');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading your orders...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="max-w-lg mx-auto mt-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="container py-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">My Orders</h1>
            </div>

            {orders.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12">
                        <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium text-center">You don't have any orders yet</p>
                        <p className="text-muted-foreground text-center mt-1">
                            Items you order will appear here
                        </p>
                        <Button
                            className="mt-6"
                            onClick={() => window.location.href = '/products'}
                        >
                            Browse Products
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <Card key={order.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/50">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <CardTitle>Order #{order.id}</CardTitle>
                                        <CardDescription>
                                            Placed on {formatDate(order.created_at)}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center">
                                        <Badge variant={getStatusBadgeVariant(order.status) as any} className="flex items-center">
                                            {getStatusIcon(order.status)}
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="mb-4">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-muted-foreground">Payment Method</span>
                                        <span className="font-medium">{order.payment_method}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Amount</span>
                                        <span className="font-bold">
                                          ${((order.total_price || order.total_amount || 0) * 1).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="items">
                                        <AccordionTrigger>
                                            Order Items ({order.items.length})
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Product</TableHead>
                                                        <TableHead className="text-right">Qty</TableHead>
                                                        <TableHead className="text-right">Price</TableHead>
                                                        <TableHead className="text-right">Subtotal</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {order.items.map((item) => (
                                                        <TableRow key={item.id}>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-3">
                                                                    {item.product.image && (
                                                                        <div className="h-10 w-10 rounded overflow-hidden">
                                                                            <img
                                                                                src={item.product.image}
                                                                                alt={item.product.name}
                                                                                className="h-full w-full object-cover"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    <span>{item.product.name}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                                            <TableCell className="text-right">${Number(item.price).toFixed(2)}</TableCell>
                                                            <TableCell className="text-right">${(Number(item.price) * item.quantity).toFixed(2)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}