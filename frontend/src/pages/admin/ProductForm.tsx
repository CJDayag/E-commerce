// ProductForm.tsx
import React, { useState, useEffect } from 'react';
import API from '@/services/api.ts';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface Category {
    id: number;
    name: string;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    category: any; // Could be an object or ID
    stock: number;
    condition: string;
    image?: string;
}

export interface ProductFormData {
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    condition: string;
    image?: File | null;
}

interface ProductFormProps {
    initialData?: Product;
    onSave: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
    setIsSubmitting: (value: boolean) => void;
}

export default function ProductForm({
                                        initialData,
                                        onSave,
                                        onCancel,
                                        isSubmitting,
                                        setIsSubmitting
                                    }: ProductFormProps) {
    const isEditMode = !!initialData;

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        price: 0,
        category: '',
        stock: 0,
        condition: 'NEW',
        image: null
    });

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchCategories = async () => {
            try {
                const response = await API.get('/api/products/categories/');
                if (isMounted) {
                    setCategories(response.data.results || response.data);
                }
            } catch (err) {
                console.error("Failed to fetch categories:", err);
                if (isMounted) {
                    toast.error('Failed to load categories');
                }
            }
        };

        const initialize = async () => {
            setLoading(true);
            await fetchCategories();

            // If editing, populate form with product data
            if (initialData) {
                setFormData({
                    name: initialData.name,
                    description: initialData.description,
                    price: parseFloat(initialData.price),
                    category: typeof initialData.category === 'object' ?
                        initialData.category.id.toString() :
                        initialData.category.toString(),
                    stock: initialData.stock,
                    condition: initialData.condition || 'NEW',
                    image: null
                });

                if (initialData.image) {
                    setImagePreview(initialData.image);
                }
            }

            setLoading(false);
        };

        initialize();

        return () => {
            isMounted = false;
        };
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'price' || name === 'stock' ? parseFloat(value) : value
        });
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData({
                ...formData,
                image: file
            });

            // Create preview
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.category) {
            toast.error('Please select a category');
            return;
        }

        try {
            setIsSubmitting(true);

            // Create FormData for file upload
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('price', formData.price.toString());
            formDataToSend.append('stock', formData.stock.toString());
            formDataToSend.append('condition', formData.condition);

            // Handle category field naming difference between add/edit
            if (isEditMode) {
                formDataToSend.append('category', formData.category);
            } else {
                formDataToSend.append('category_id', formData.category);
            }

            if (formData.image instanceof File) {
                formDataToSend.append('image', formData.image);
            }

            if (isEditMode && initialData) {
                // Update existing product
                await API.patch(`/api/products/products/${initialData.id}/`, formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Product updated successfully');
            } else {
                // Create new product
                await API.post('/api/products/products/', formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Product created successfully');
            }

            // Call the callback to refresh the product list
            onSave();

        } catch (err) {
            console.error("API Error:", err);

            if (err.response && err.response.data) {
                // Display specific error messages
                const errorData = err.response.data;
                if (typeof errorData === 'object') {
                    const errorMessages = Object.entries(errorData)
                        .map(([field, errors]) => `${field}: ${errors}`)
                        .join(', ');
                    toast.error(`Failed: ${errorMessages}`);
                } else {
                    toast.error(isEditMode ? 'Failed to update product' : 'Failed to create product');
                }
            } else {
                toast.error(isEditMode ? 'Failed to update product' : 'Failed to create product');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                            id="name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="h-32 resize-none"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="price">Price ($)</Label>
                        <Input
                            id="price"
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(value) => handleSelectChange('category', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(category => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="stock">Stock</Label>
                        <Input
                            id="stock"
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleInputChange}
                            min="0"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="condition">Condition</Label>
                        <Select
                            value={formData.condition}
                            onValueChange={(value) => handleSelectChange('condition', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NEW">New</SelectItem>
                                <SelectItem value="USED">Used</SelectItem>
                                <SelectItem value="REFURBISHED">Refurbished</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Product Image</Label>
                        <Input
                            id="image"
                            type="file"
                            name="image"
                            onChange={handleImageChange}
                            className="cursor-pointer"
                            accept="image/*"
                        />
                        {imagePreview && (
                            <div className="mt-2 border rounded p-2">
                                <img src={imagePreview} alt="Preview" className="h-32 object-contain mx-auto" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Product' : 'Add Product')}
                </Button>
            </div>
        </form>
    );
}