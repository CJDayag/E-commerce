// OrderDetailDialog.tsx
import { useState } from 'react';
import { format } from 'date-fns';
import { Package, CreditCard, Home, Calendar, User, Truck } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import API from "@/services/api.ts"; // Adjust this import path based on your project structure

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
    order_number: string;  // Now required field
    user: {
        id: number;
        username: string;
        email: string;
    };
    items: OrderItem[];
    total_amount: number;
    status: string;
    created_at: string;
    updated_at: string;  // New field
    shipping_address: {
        address_line1: string;
        address_line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    };
    payment_method: string;
}

type ApiError = {
    response?: {
        data?: {
            detail?: string;
        };
    };
    message?: string;
};

interface OrderDetailDialogProps {
    order: Order;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStatusChange: (status: string) => void;
}


export default function OrderDetailDialog({
                                              order,
                                              open,
                                              onOpenChange,
                                              onStatusChange
                                          }: OrderDetailDialogProps) {
    const getStatusBadge = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING':
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
            case 'PROCESSING':
                return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Processing</Badge>;
            case 'SHIPPED':
                return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Shipped</Badge>;
            case 'DELIVERED':
                return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Delivered</Badge>;
            case 'CANCELLED':
                return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>;
            case 'REFUNDED':
                return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">Refunded</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };
    const [, setIsLoading] = useState(false);
    const [, setLocalOrder] = useState(order);

    const getNextStatus = (currentStatus: string): string | null => {
        const statusFlow: Record<string, string> = {
            'PENDING': 'PROCESSING',
            'PROCESSING': 'SHIPPED',
            'SHIPPED': 'DELIVERED'
        };

        return statusFlow[currentStatus.toUpperCase()] || null;
    };

    const updateOrderStatus = async (newStatus: string) => {
        // Validate inputs
        if (!order || !order.id) {
            toast.error("Order information is missing");
            return;
        }

        // Validate status value if needed
        const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
        if (!validStatuses.includes(newStatus)) {
            toast.error(`Invalid status: ${newStatus}`);
            return;
        }

        setIsLoading(true);


        try {
            await API.patch(`/api/orders/${order.id}/`, { status: newStatus });

            const updatedOrder: Order = {
                ...order,
                status: newStatus
            };

            setLocalOrder(updatedOrder);
            onStatusChange(newStatus);
            toast.success(`Order status updated to ${newStatus}`);
        } catch (error: unknown) {
            console.error('Error updating order status:', error);

            // Type guard for error handling
            const apiError = error as ApiError;
            const errorMessage = apiError.response?.data?.detail || apiError.message || 'Unknown error occurred';

            toast.error(`Failed to update order status: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };


    const getFormattedAddress = (address: Order['shipping_address']) => {
        let formattedAddress = address.address_line1;

        if (address.address_line2) {
            formattedAddress += `, ${address.address_line2}`;
        }

        formattedAddress += `, ${address.city}, ${address.state} ${address.postal_code}`;
        formattedAddress += `, ${address.country}`;

        return formattedAddress;
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
        } catch (error) {
            console.error('Invalid date format:', error);
            return 'Invalid date';
        }
    };

    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = order.total_amount * 0.1; // Example: 10% tax
    const shipping = order.total_amount - subtotal - tax;

    const nextStatus = getNextStatus(order.status);
    const canUpdateStatus = !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status.toUpperCase());

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DialogTitle>Order #{order.order_number}</DialogTitle>
                        {getStatusBadge(order.status)}
                    </div>
                </DialogHeader>

                <div className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Order Information */}
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-gray-500" />
                            <div>
                                <div className="font-semibold">Order Information</div>
                                <div className="text-sm text-gray-600">
                                    Created: {formatDate(order.created_at)}<br />
                                    Updated: {formatDate(order.updated_at)}
                                </div>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="flex flex-col space-y-1">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <User size={16} />
                                Customer
                            </h3>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback>
                                        {order.user && order.user.username ? order.user.username.charAt(0).toUpperCase() : '?'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm">{order.user.username}</p>
                                    <p className="text-xs text-gray-500">{order.user.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="flex flex-col space-y-1">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <Home size={16} />
                                Shipping Address
                            </h3>
                            <p className="text-sm">
                                {getFormattedAddress(order.shipping_address)}
                            </p>
                        </div>

                        {/* Payment Method */}
                        <div className="flex flex-col space-y-1">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <CreditCard size={16} />
                                Payment Method
                            </h3>
                            <p className="text-sm capitalize">
                                {order.payment_method.toLowerCase()}
                            </p>
                        </div>
                    </div>

                    {/* Order Status & Actions */}
                    <div className="mt-6 space-y-4">
                        <div className="flex flex-col space-y-1">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <Truck size={16} />
                                Order Status
                            </h3>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="bg-gray-200 w-full h-2 rounded-full">
                                        <div
                                            className={`h-2 rounded-full ${
                                                order.status.toUpperCase() === 'CANCELLED' || order.status.toUpperCase() === 'REFUNDED'
                                                    ? 'bg-red-500'
                                                    : 'bg-green-500'
                                            }`}
                                            style={{
                                                width: order.status.toUpperCase() === 'PENDING' ? '25%' :
                                                    order.status.toUpperCase() === 'PROCESSING' ? '50%' :
                                                        order.status.toUpperCase() === 'SHIPPED' ? '75%' :
                                                            order.status.toUpperCase() === 'DELIVERED' ? '100%' :
                                                                order.status.toUpperCase() === 'CANCELLED' || order.status.toUpperCase() === 'REFUNDED' ? '100%' : '0%'
                                            }}
                                        />
                                    </div>
                                </div>
                                {/* Status Actions */}
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Pending</span>
                                    <span>Processing</span>
                                    <span>Shipped</span>
                                    <span>Delivered</span>
                                </div>

                                {/* Status Update Button */}
                                {canUpdateStatus && nextStatus && (
                                    <div className="mt-2">
                                        <Button
                                            onClick={() => updateOrderStatus(nextStatus)}
                                            size="sm"
                                        >
                                            Update to {nextStatus.charAt(0) + nextStatus.slice(1).toLowerCase()}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="mt-6">
                        <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                            <Package size={16} />
                            Order Items
                        </h3>
                        <div className="border rounded-md">
                            {order.items.map((item) => (
                                <div key={item.id} className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {item.product.image ? (
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={item.product.image} alt={item.product.name} />
                                                <AvatarFallback>{item.product.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        ) : (
                                            <div className="bg-gray-100 h-10 w-10 flex items-center justify-center rounded-md">
                                                <Package size={16} />
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium">{item.product.name}</p>
                                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}

                            <Separator />

                            {/* Order Summary */}
                            <div className="p-3">
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Shipping</span>
                                        <span>${shipping.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Tax</span>
                                        <span>${tax.toFixed(2)}</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-medium">
                                        <span>Total</span>
                                        <span>${Number(order.total_amount).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}