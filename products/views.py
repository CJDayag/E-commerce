from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Product, Category
from .serializers import ProductSerializer, CategorySerializer
from .permissions import IsAdminUserOrReadOnly  # Import your custom permission class


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['price', 'name']

    # Replace existing permission classes with your custom one
    permission_classes = [IsAdminUserOrReadOnly]
