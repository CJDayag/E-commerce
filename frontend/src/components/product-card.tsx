import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Eye, Heart, ImageOff, Scale } from "lucide-react";
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
import { toggleWishlist, isInWishlist } from "@/lib/wishlist";
import { toggleCompare, isInCompare, MAX_COMPARE } from "@/lib/compare";
import { toast } from "sonner";

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
  condition: 'NEW' | 'USED' | 'REFURBISHED' | string;
  image: string | null;
}

interface ProductCardProps {
  product: Product;
  highlightLabel?: string;
}

export function ProductCard({ product, highlightLabel }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(() => isInWishlist(product.id));
  const [isCompared, setIsCompared] = useState(() => isInCompare(product.id));

  useEffect(() => {
    setIsWishlisted(isInWishlist(product.id));
  }, [product.id]);

  useEffect(() => {
    const handler = () => setIsWishlisted(isInWishlist(product.id));
    window.addEventListener('wishlist:updated', handler);
    return () => window.removeEventListener('wishlist:updated', handler);
  }, [product.id]);

  useEffect(() => {
    setIsCompared(isInCompare(product.id));
  }, [product.id]);

  useEffect(() => {
    const handler = () => setIsCompared(isInCompare(product.id));
    window.addEventListener('compare:updated', handler);
    return () => window.removeEventListener('compare:updated', handler);
  }, [product.id]);

  const handleWishlistToggle = () => {
    const next = toggleWishlist(product);
    setIsWishlisted(next);
    toast.success(next ? 'Added to wishlist' : 'Removed from wishlist');
  };

  const handleCompareToggle = () => {
    const result = toggleCompare(product);

    if (!result.success) {
      toast.error(`You can compare up to ${MAX_COMPARE} items.`);
      return;
    }

    setIsCompared(result.inCompare);
    toast.success(result.inCompare ? 'Added to compare' : 'Removed from compare');
  };

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
    <Card className="group relative flex h-full flex-col overflow-hidden border-0 bg-gradient-to-br from-white via-white to-muted/50 shadow-[0_12px_40px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_60px_rgba(14,165,233,0.28)] dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      <CardHeader className="relative p-0">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted/60 text-muted-foreground">
              <ImageOff className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute left-4 top-4 flex flex-col gap-2">
            {highlightLabel && (
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-900 shadow-sm">
                {highlightLabel}
              </div>
            )}
            <div className="flex items-center gap-2">
            <Badge className={cn("border-0 text-xs uppercase tracking-wide", getConditionColor(product.condition))}>
              {product.condition}
            </Badge>
            <Badge variant="secondary" className="bg-white/80 text-xs font-medium text-slate-900 shadow-sm">
              {product.category.name}
            </Badge>
            </div>
          </div>
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleWishlistToggle}
              aria-pressed={isWishlisted}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className={cn(
                "h-9 w-9 rounded-full bg-white/85 text-slate-700 shadow-md backdrop-blur transition hover:scale-105",
                isWishlisted && "text-red-500"
              )}
            >
              <Heart className={cn("h-4 w-4", isWishlisted && "fill-red-500")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 transition-colors duration-200 group-hover:text-primary dark:text-white">
            {product.name}
          </CardTitle>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {product.description}
          </p>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Price</p>
            <p className="text-lg font-semibold text-primary">${Number(product.price).toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-2">
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
      <CardFooter className="p-5 pt-0">
        <div className="grid w-full grid-cols-2 gap-3">
          <ProductDialog productId={product.id}>
            <Button variant="outline" size="sm" className="w-full border-primary/20 bg-white/80 text-slate-900 hover:border-primary/40 hover:bg-primary hover:text-primary-foreground dark:bg-white/5 dark:text-white">
              <Eye className="mr-2 h-4 w-4" />
              Details
            </Button>
          </ProductDialog>
          <Button
            type="button"
            variant={isCompared ? "default" : "secondary"}
            size="sm"
            onClick={handleCompareToggle}
            className={cn(
              "w-full",
              isCompared ? "bg-primary text-primary-foreground" : "bg-muted/70"
            )}
          >
            <Scale className="mr-2 h-4 w-4" />
            {isCompared ? 'Compared' : 'Compare'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}