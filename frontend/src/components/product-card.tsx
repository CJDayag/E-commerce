import { Badge } from "@/components/ui/badge";
import { ImageOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductDialog from "@/components/ProductDialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: {
    id: number;
    name: string;
  };
  stock: number;
  condition: 'NEW' | 'USED' | 'REFURBISHED';
  image: string | null;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'NEW':
        return 'bg-green-100 text-green-800';
      case 'USED':
        return 'bg-amber-100 text-amber-800';
      case 'REFURBISHED':
        return 'bg-blue-100 text-blue-800';
      default:
        return '';
    }
  };

  const getStockIndicator = () => {
    if (product.stock > 10) {
      return <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>;
    } else if (product.stock > 0) {
      return <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>;
    } else {
      return <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>;
    }
  };

  return (
      <Card className="overflow-hidden flex flex-col h-full group border hover:border-primary/20 transition-all duration-300 hover:shadow-md">
        <CardHeader className="p-0 relative">
          <div className="aspect-square w-full h-48 bg-muted overflow-hidden">
            {product.image ? (
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/30">
                  <ImageOff className="h-12 w-12 text-muted-foreground/50" />
                </div>
            )}
            <Badge
                className={cn("absolute top-2 right-2", getConditionColor(product.condition))}
            >
              {product.condition}
            </Badge>
          </div>
          {/* Category badge */}
          <Badge variant="secondary" className="absolute bottom-2 left-2 backdrop-blur-md bg-background/80">
            {product.category.name}
          </Badge>
        </CardHeader>
        <CardContent className="flex-grow p-4 pt-5">
          <div className="mb-2">
            <CardTitle className="text-lg font-medium line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2 h-10">
              {product.description}
            </p>
          </div>
          <div className="flex justify-between items-center mt-4 pt-2 border-t border-muted/30">
          <span className="text-lg font-semibold text-primary">
            ${Number(product.price).toFixed(2)}
          </span>
            <div className="flex items-center">
              {getStockIndicator()}
              <span className={cn(
                  "text-xs",
                  product.stock === 0 ? "text-red-500 font-medium" :
                      product.stock < 5 ? "text-yellow-600" : "text-muted-foreground"
              )}>
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <ProductDialog productId={product.id}>
            <Button variant="outline" size="sm" className="w-full flex items-center gap-1 hover:bg-primary hover:text-primary-foreground">
              <Eye className="h-4 w-4" />
              <span>Details</span>
            </Button>
          </ProductDialog>
        </CardFooter>
      </Card>
  );
}