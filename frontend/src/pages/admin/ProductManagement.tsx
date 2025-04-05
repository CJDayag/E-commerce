// ProductManagement.tsx
import { useState, useEffect } from 'react';
import API from '@/services/api.ts';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import AddProductDialog from './AddProductDialog';
import EditProductDialog from './EditProductDialog';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Product } from './ProductForm';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function ProductManagement() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Edit Dialog state
    const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await API.get('/api/products/products/');
            setProducts(response.data.results || response.data);
        } catch (error) {
            console.error("Failed to fetch products:", error);
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleEditProduct = (product: Product) => {
        setSelectedProduct(product);
        setIsEditDialogOpen(true);
    };

    const handleDeleteProduct = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await API.delete(`/api/products/products/${id}/`);
                toast.success("Product deleted successfully");
                fetchProducts(); // Refresh the list
            } catch (error) {
                console.error("Failed to delete product:", error);
                toast.error("Failed to delete product");
            }
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-2xl font-bold mb-6">Product Management</h1>

            {/* Search and Add Product Row */}
            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <AddProductDialog onProductAdded={fetchProducts} />
            </div>

            {/* Products Table */}
            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        No products found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProducts.map(product => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="h-12 w-12 object-cover rounded"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                                                    <span className="text-xs text-muted-foreground">No image</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>
                                            {typeof product.category === 'object' ? product.category.name : product.category}
                                        </TableCell>
                                        <TableCell>${parseFloat(product.price).toFixed(2)}</TableCell>
                                        <TableCell>{product.stock}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleEditProduct(product)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            )}

            {/* Edit Product Dialog */}
            {selectedProduct && (
                <EditProductDialog
                    product={selectedProduct}
                    isOpen={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    onProductUpdated={fetchProducts}
                />
            )}
        </div>
    );
}