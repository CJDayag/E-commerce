// EditProductDialog.tsx
import { useState } from 'react';
import ProductForm, { Product } from './ProductForm';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';

interface EditProductDialogProps {
    product: Product;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onProductUpdated: () => void;
}

export default function EditProductDialog({
                                              product,
                                              isOpen,
                                              onOpenChange,
                                              onProductUpdated
                                          }: EditProductDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = () => {
        onProductUpdated();
        onOpenChange(false);
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                </DialogHeader>
                <ProductForm
                    initialData={product}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    isSubmitting={isSubmitting}
                    setIsSubmitting={setIsSubmitting}
                />
            </DialogContent>
        </Dialog>
    );
}