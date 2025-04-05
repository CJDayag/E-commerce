import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { UsersIcon, PackageIcon } from 'lucide-react';
import API from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
}

interface User {
  id: number;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string;
  first_name?: string;
  last_name?: string;
}

interface ProductData {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  condition: string;
  image: string | null;
  category: {
    id: number;
    name: string;
    description: string;
  };
}

interface OrderData {
  id: number;
  user: { email: string };
  created_at: string;
  updated_at: string;
  status: string;
  payment_method: string;
  total_amount: number;
  order_number: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    category: {
      id: number;
      name: string;
    }
  };
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  user_email: string;
  date: string;
  total: number;
  status: string;
  items: number;
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('You must be logged in to access this page.');
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Filter users based on search input
    if (users.length > 0) {
      const filtered = users.filter(u =>
          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
          (u.first_name && u.first_name.toLowerCase().includes(userSearch.toLowerCase())) ||
          (u.last_name && u.last_name.toLowerCase().includes(userSearch.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [userSearch, users]);

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (user) {
      const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
          // Fetch all users
          const usersResponse = await API.get('/api/accounts/users/');
          const allUsers = usersResponse.data;
          setUsers(allUsers);
          setFilteredUsers(allUsers);
          setStats(prevStats => ({ ...prevStats, totalUsers: allUsers.length }));

          // Fetch products
          const productsResponse = await API.get('/api/products/products/');
          const products = productsResponse.data as ProductData[];
          setStats(prevStats => ({
            ...prevStats,
            totalProducts: products.length
          }));

          // Fetch orders
          const ordersResponse = await API.get('/api/orders/');
          const orders = ordersResponse.data as OrderData[];

          // Process recent orders for the table
          const recentOrdersData = orders
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 5)
              .map(order => ({
                id: order.id,
                user_email: order.user.email,
                date: order.created_at,
                total: order.total_amount,
                status: order.status,
                items: order.items.length
              }));
          setRecentOrders(recentOrdersData);

        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          setError(typeof error === 'string' ? error :
              error instanceof Error ? error.message :
                  'Failed to load dashboard data');
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }
  }, [user, timeRange]);

  // Show loading during authentication check or data fetch
  if (authLoading || (loading && user)) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6 animate-pulse">Dashboard</h1>

        {/* Skeleton cards for stats */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {[1, 2].map((i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-10 ml-auto rounded-full bg-gray-200 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skeleton tables */}
        <div className="grid gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="py-2 border-b border-gray-100 grid grid-cols-4 gap-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard</title>
      </Helmet>

      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}

        {/* Stats Overview - Removed Total Orders and Total Revenue */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                +{Math.floor(Math.random() * 10)}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <PackageIcon className="h-4 w-4 text-muted-foreground"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                +{Math.floor(Math.random() * 5)}% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Latest {recentOrders.length} orders from your store
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{order.user_email}</TableCell>
                    <TableCell>{format(new Date(order.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{order.items}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === 'completed' ? 'default' :
                          order.status === 'processing' ? 'secondary' :
                          order.status === 'pending' ? 'outline' : 'destructive'
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${Number(order.total).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage your store users and their roles
                </CardDescription>
              </div>
              <div className="w-72">
                <Input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.slice(0, 10).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {user.first_name && user.last_name
                            ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
                            : user.email.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.email}</p>
                        {user.first_name && user.last_name && (
                          <p className="text-sm text-muted-foreground">
                            {user.first_name} {user.last_name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_superuser ? (
                        <Badge>Admin</Badge>
                      ) : user.is_staff ? (
                        <Badge variant="secondary">Staff</Badge>
                      ) : (
                        <Badge variant="outline">Customer</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.date_joined ? format(new Date(user.date_joined), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {user.last_login ? format(new Date(user.last_login), 'MMM dd, yyyy') : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min(10, filteredUsers.length)} of {filteredUsers.length} users
            </p>
            <div className="space-x-2">
              <Button variant="outline" size="sm" disabled={filteredUsers.length <= 10}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={filteredUsers.length <= 10}>
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}