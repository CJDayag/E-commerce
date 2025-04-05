// OrderManagement.tsx
import { useState, useEffect } from 'react';
import API from '@/services/api.ts';
import { toast } from 'sonner';
import { Search, Filter, ChevronDown, AlertTriangle } from 'lucide-react';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import OrderDetailDialog from '@/pages/admin/OrderDetailsDialog.tsx';

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
    order_number: string;
    user: {
        id: number;
        username: string;
        email: string;
    };
    items: OrderItem[];
    total_amount: number;
    status: string;
    created_at: string;
    updated_at: string;
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

const apiUrl = 'http://127.0.0.1:8000';

export default function OrderManagement() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalOrders, setTotalOrders] = useState<number>(0);
    const [pageSize] = useState<number>(10);
    const [statusFilter, setStatusFilter] = useState<string>('');

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailsOpen, setDetailsOpen] = useState<boolean>(false);


    const fetchOrders = async (page = 1, status = '') => {
        try {
            setLoading(true);

            let url = `${apiUrl}/api/orders/?page=${page}&limit=${pageSize}`;
            console.log('Fetching orders with URL:', url);

            if (searchTerm) {
                url += `&search=${searchTerm}`;
            }

            if (status) {
                url += `&status=${status}`;
            }

            const response = await API.get(url);

            // Check if the response uses pagination or not
            let ordersData = response.data;
            let count = 0;

            if (Array.isArray(response.data)) {
                // Direct array of orders
                ordersData = response.data;
                count = ordersData.length;

                // Transform the data to match expected interface if needed
                const transformedOrders = ordersData.map(order => ({
                    ...order,
                    // Add order_number if missing
                    order_number: order.order_number || `ORD-${order.id}`,
                    // Transform user ID to user object if needed
                    user: typeof order.user === 'number'
                        ? { id: order.user, username: `User ${order.user}`, email: `user${order.user}@example.com` }
                        : order.user,
                    // Ensure items exists
                    items: order.items || [],
                    // Add total_amount if missing
                    total_amount: order.total_amount || 0,
                }));

                setOrders(transformedOrders);
            } else {
                // Paginated response
                ordersData = response.data.results || [];
                count = response.data.count || 0;

                // Transform if needed
                const transformedOrders = ordersData.map(order => ({
                    ...order,
                    order_number: order.order_number || `ORD-${order.id}`,
                    user: typeof order.user === 'number'
                        ? { id: order.user, username: `User ${order.user}`, email: `user${order.user}@example.com` }
                        : order.user,
                    items: order.items || [],
                    total_amount: order.total_amount || 0,
                }));

                setOrders(transformedOrders);
            }

            setTotalOrders(count);
            setTotalPages(Math.ceil(count / pageSize));
            console.log('API response:', response.data);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(currentPage, statusFilter);
    }, [currentPage, statusFilter]);

    // Add debounce to search
    useEffect(() => {
        const handler = setTimeout(() => {
            setCurrentPage(1); // Reset to first page on new search
            fetchOrders(1, statusFilter);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setDetailsOpen(true);
    };

    const handleUpdateStatus = async (orderId: number, newStatus: string) => {
        try {
            await API.patch(`${apiUrl}/api/orders/${orderId}/`, {
                status: newStatus
            });

            // Update the order in the local state
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderId
                        ? { ...order, status: newStatus }
                        : order
                )
            );

            toast.success(`Order status updated to ${newStatus}`);
        } catch (error) {
            console.error("Failed to update order status:", error);
            toast.error("Failed to update order status");
        }
    };

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

    const renderPaginationItems = () => {
        const items = [];

        // Always show first page
        items.push(
            <PaginationItem key="first">
                <PaginationLink
                    onClick={() => handlePageChange(1)}
                    isActive={currentPage === 1}
                >
                    1
                </PaginationLink>
            </PaginationItem>
        );

        // Show ellipsis if not showing page 2
        if (currentPage > 3) {
            items.push(
                <PaginationItem key="ellipsis1">
                    <PaginationEllipsis />
                </PaginationItem>
            );
        }

        // Show pages around current page
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            if (i <= 1 || i >= totalPages) continue; // Skip if already showing first/last page

            items.push(
                <PaginationItem key={i}>
                    <PaginationLink
                        onClick={() => handlePageChange(i)}
                        isActive={currentPage === i}
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        // Show ellipsis if not showing second-to-last page
        if (currentPage < totalPages - 2) {
            items.push(
                <PaginationItem key="ellipsis2">
                    <PaginationEllipsis />
                </PaginationItem>
            );
        }

        // Always show last page if there's more than one page
        if (totalPages > 1) {
            items.push(
                <PaginationItem key="last">
                    <PaginationLink
                        onClick={() => handlePageChange(totalPages)}
                        isActive={currentPage === totalPages}
                    >
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        return items;
    };

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-2xl font-bold mb-6">Order Management</h1>

            {/* Search and Filter Row */}
            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        type="text"
                        placeholder="Search by order number or customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Filter size={16} />
                                <span>{statusFilter ? `Status: ${statusFilter}` : 'Filter by Status'}</span>
                                <ChevronDown size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setStatusFilter('')}>
                                All Orders
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('PENDING')}>
                                Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('PROCESSING')}>
                                Processing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('SHIPPED')}>
                                Shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('DELIVERED')}>
                                Delivered
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('CANCELLED')}>
                                Cancelled
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('REFUNDED')}>
                                Refunded
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Order Count */}
            <div className="text-sm text-gray-500 mb-4">
                {!loading && `Showing ${orders.length} of ${totalOrders} orders`}
            </div>

            {/* Orders Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            // Skeleton loaders for table rows
                            Array(5).fill(0).map((_, idx) => (
                                <TableRow key={idx}>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Skeleton className="h-9 w-24" />
                                            <Skeleton className="h-9 w-32" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <AlertTriangle className="text-yellow-500 mb-3" size={36} />
                                        <h3 className="text-lg font-medium">No Orders Found</h3>
                                        <p className="text-gray-500 text-center mt-1">
                                            {searchTerm || statusFilter
                                                ? "Try adjusting your search or filters"
                                                : "No orders have been placed yet"}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell>#{order.order_number || `ORD-${order.id}`}</TableCell>
                                    <TableCell>${order && order.total_amount ? Number(order.total_amount).toFixed(2) : '0.00'}</TableCell>
                                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewDetails(order)}
                                            >
                                                View Details
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="default" size="sm">
                                                        Update Status
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Set Status</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleUpdateStatus(order.id, 'PENDING')}
                                                        disabled={order.status === 'PENDING'}
                                                    >
                                                        Pending
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleUpdateStatus(order.id, 'PROCESSING')}
                                                        disabled={order.status === 'PROCESSING'}
                                                    >
                                                        Processing
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                                                        disabled={order.status === 'SHIPPED'}
                                                    >
                                                        Shipped
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                                                        disabled={order.status === 'DELIVERED'}
                                                    >
                                                        Delivered
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                                                        disabled={order.status === 'CANCELLED'}
                                                        className="text-red-600"
                                                    >
                                                        Cancel Order
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleUpdateStatus(order.id, 'REFUNDED')}
                                                        disabled={order.status === 'REFUNDED'}
                                                    >
                                                        Mark as Refunded
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="mt-6">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>

                            {renderPaginationItems()}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            {/* Order Details Dialog */}
            {selectedOrder && (
                <OrderDetailDialog
                    order={selectedOrder}
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                    onStatusChange={(newStatus) => handleUpdateStatus(selectedOrder.id, newStatus)}
                />
            )}
        </div>
    );
}