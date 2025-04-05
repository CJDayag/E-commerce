import { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { PackageIcon, TrendingUpIcon, ArrowUpIcon, UsersIcon, ChartPieIcon } from 'lucide-react';
import API from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector, Label
} from 'recharts';

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
import { Badge } from "@/components/ui/badge";

interface Product {
  id: number;
  name: string;
  price: number;
  quantity_sold: number;
  revenue: number;
  category: string;
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

interface OrderTimelineData {
  date: string;
  orders: number;
  revenue: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Custom tooltip component for cleaner look
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border rounded-md shadow-sm">
        <p className="font-medium text-sm">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom active shape for pie chart
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-sm font-medium">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-xs">
        {`${value} (${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

// Define chart config type for better TypeScript support
interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

// Chart container component
const ChartContainer = ({ 
  config, 
  children, 
  className 
}: { 
  config: ChartConfig;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`w-full ${className || ''}`}>
      {children}
    </div>
  );
};

// Chart tooltip content component
const ChartTooltipContent = ({ 
  active, 
  payload, 
  label, 
  hideLabel = false 
}: { 
  active?: boolean;
  payload?: any[];
  label?: string;
  hideLabel?: boolean;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-sm p-2 px-3">
        {!hideLabel && label && <p className="text-sm font-medium">{label}</p>}
        {payload.map((entry, index) => (
          <div key={`tooltip-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <p className="text-sm">
              <span className="font-medium">{entry.name}: </span>
              {entry.value}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    revenue: 0
  });
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
  const [orderTimeline, setOrderTimeline] = useState<OrderTimelineData[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<{name: string, value: number}[]>([]);
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePieIndex, setActivePieIndex] = useState(0);

  // Calculate total products in categories
  const totalCategoryProducts = useMemo(() => {
    return categoryDistribution.reduce((acc, curr) => acc + curr.value, 0);
  }, [categoryDistribution]);

  // Create chart config from category data
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: 'Products',
        color: 'hsl(var(--primary))'
      }
    };
    
    // Add category configs
    categoryDistribution.forEach((category, index) => {
      config[category.name] = {
        label: category.name,
        color: COLORS[index % COLORS.length]
      };
    });
    
    return config;
  }, [categoryDistribution]);

  // Check authentication status
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('You must be logged in to access this page.');
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (user) {
      const fetchAnalyticsData = async () => {
        setLoading(true);
        setError(null);

        try {
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

          // Calculate total revenue
          const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
          setStats(prevStats => ({
            ...prevStats,
            revenue: totalRevenue
          }));

          // Generate order timeline data
          const timelineData = generateTimelineData(orders, timeRange);
          setOrderTimeline(timelineData);

          // Calculate best selling products
          const productSales = calculateProductSales(orders, products);
          setBestSellingProducts(productSales);

          // Calculate category distribution
          const categoryData = calculateCategoryDistribution(products);
          setCategoryDistribution(categoryData);

        } catch (error) {
          console.error('Error fetching analytics data:', error);
          setError(typeof error === 'string' ? error :
              error instanceof Error ? error.message :
                  'Failed to load analytics data');
        } finally {
          setLoading(false);
        }
      };

      fetchAnalyticsData();
    }
  }, [user, timeRange]);

  // Helper function to generate timeline data
  const generateTimelineData = (orders: OrderData[], timeRange: string): OrderTimelineData[] => {
    // Create date ranges based on selection
    let days = 7;
    if (timeRange === '30days') days = 30;
    if (timeRange === '90days') days = 90;

    const dates: string[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      dates.push(format(date, 'MMM dd'));
    }

    // Initialize timeline with all dates
    const timeline: OrderTimelineData[] = dates.map(date => ({
      date,
      orders: 0,
      revenue: 0
    }));

    // Fill in order data
    orders.forEach(order => {
      const orderDate = format(new Date(order.created_at), 'MMM dd');
      const timelineEntry = timeline.find(entry => entry.date === orderDate);
      if (timelineEntry) {
        timelineEntry.orders += 1;
        timelineEntry.revenue += order.total_amount;
      }
    });

    return timeline;
  };

  // Helper function to calculate product sales
  const calculateProductSales = (orders: OrderData[], products: ProductData[]): Product[] => {
    // Create a map to track product sales
    const productSalesMap: Record<number, Product> = {};

    // Process all order items
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product.id;
        if (!productSalesMap[productId]) {
          productSalesMap[productId] = {
            id: productId,
            name: item.product.name,
            price: item.product.price,
            quantity_sold: 0,
            revenue: 0,
            category: item.product.category?.name || 'Uncategorized'
          };
        }
        productSalesMap[productId].quantity_sold += item.quantity;
        productSalesMap[productId].revenue += item.price * item.quantity;
      });
    });

    // Convert to array
    const productSalesArray = Object.values(productSalesMap);

    // Sort by quantity sold (descending)
    return productSalesArray.sort((a, b) => b.quantity_sold - a.quantity_sold).slice(0, 10);
  };

  // Helper function to calculate category distribution
  const calculateCategoryDistribution = (products: ProductData[]): {name: string, value: number}[] => {
    const categoryMap: Record<string, number> = {};

    products.forEach(product => {
      const categoryName = product.category?.name || 'Uncategorized';
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = 0;
      }
      categoryMap[categoryName] += 1;
    });

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  };

  // Show loading during authentication check or data fetch
  if (authLoading || (loading && user)) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6 animate-pulse">Analytics</h1>

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

        {/* Skeleton charts */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Store Analytics</title>
      </Helmet>

      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Store Analytics</h1>
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

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{"$" + stats.revenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +{Math.floor(Math.random() * 20)}% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Orders Timeline</CardTitle>
              <CardDescription>
                Order volume over the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={orderTimeline}
                    margin={{top: 10, right: 30, left: 0, bottom: 10}}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: "#888", fontSize: 12 }}
                      stroke="#e2e8f0"
                    />
                    <YAxis 
                      yAxisId="left" 
                      tick={{ fill: "#888", fontSize: 12 }}
                      stroke="#e2e8f0"
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tick={{ fill: "#888", fontSize: 12 }}
                      stroke="#e2e8f0"
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }}
                      iconType="circle"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="orders"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Order Count"
                      activeDot={{r: 6, strokeWidth: 0}}
                      dot={{ r: 3, strokeWidth: 0 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Revenue ($)"
                      dot={{ r: 3, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Best Selling Products</CardTitle>
              <CardDescription>
                Top products by quantity sold
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={bestSellingProducts.slice(0, 5)}
                    margin={{top: 10, right: 30, left: 0, bottom: 10}}
                    barSize={24}
                    barGap={8}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: "#888", fontSize: 12 }}
                      stroke="#e2e8f0" 
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: "#888", fontSize: 12 }}
                      stroke="#e2e8f0"
                      tickLine={false}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="quantity_sold"
                      name="Units Sold"
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="revenue"
                      name="Revenue ($)"
                      fill="#82ca9d"
                      radius={[4, 4, 0, 0]}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Categories Chart */}
        <div className="grid gap-6 mb-6">
          <Card className="flex flex-col">
            <CardHeader className="items-center pb-2">
              <CardTitle className="flex items-center gap-2">
                <ChartPieIcon className="h-5 w-5" /> Product Categories
              </CardTitle>
              <CardDescription>Distribution by category</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[300px]"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-foreground text-2xl font-bold"
                                >
                                  {totalCategoryProducts}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 24}
                                  className="fill-muted-foreground text-xs"
                                >
                                  Products
                                </tspan>
                              </text>
                            )
                          }
                          return null;
                        }}
                      />
                    </Pie>
                    <RechartsTooltip 
                      content={<ChartTooltipContent hideLabel />}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-4 text-sm">
              <div className="flex flex-wrap gap-3 justify-center">
                {categoryDistribution.map((entry, index) => (
                  <div key={`legend-${index}`} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs">{entry.name}</span>
                  </div>
                ))}
              </div>
              <div className="text-muted-foreground text-xs mt-2 sm:mt-0">
                Based on current product inventory
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="grid gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Best Selling Products</CardTitle>
              <CardDescription>
                Detailed breakdown of top selling products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Units Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bestSellingProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{product.quantity_sold}</TableCell>
                      <TableCell className="text-right">
                        ${product.revenue.toFixed(2)}
                        <span className="ml-2 text-xs text-green-600">
                          <ArrowUpIcon className="h-3 w-3 inline"/>
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
