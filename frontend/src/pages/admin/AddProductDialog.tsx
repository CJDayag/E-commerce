// AddProductDialog.tsx
import { useState } from 'react';
import ProductForm from './ProductForm';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface AddProductDialogProps {
    onProductAdded: () => void;
}

export default function AddProductDialog({ onProductAdded }: AddProductDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = () => {
        onProductAdded();
        setIsOpen(false);
    };

    const handleCancel = () => {
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                    <Plus size={18} />
                    <span>Add Product</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <ProductForm
                    onSave={handleSave}
                    onCancel={handleCancel}
                    isSubmitting={isSubmitting}
                    setIsSubmitting={setIsSubmitting}
                />
            </DialogContent>
        </Dialog>
    );
}