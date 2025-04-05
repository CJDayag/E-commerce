from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from products.models import Product

class CartViewSet(viewsets.ModelViewSet):
    queryset = Cart.objects.all()
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only access their own cart
        return Cart.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically set the user to the current user
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['POST'])
    def add_item(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=400)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, 
            product=product,
            defaults={'quantity': quantity}
        )

        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data)

    @action(detail=False, methods=['PUT'])
    def update_item(self, request):
        cart = Cart.objects.get(user=request.user)
        cart_item_id = request.data.get('cart_item_id')
        quantity = request.data.get('quantity')

        if not quantity or int(quantity) < 1:
            return Response({'error': 'Quantity must be at least 1'}, status=400)

        try:
            cart_item = CartItem.objects.get(id=cart_item_id, cart=cart)
            cart_item.quantity = int(quantity)
            cart_item.save()
            serializer = CartItemSerializer(cart_item)
            return Response(serializer.data)
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found in cart'}, status=404)


    @action(detail=False, methods=['DELETE'])
    def remove_item(self, request, format=None):
        cart = Cart.objects.get(user=request.user)
        cart_item_id = request.data.get('cart_item_id')

        try:
            # Filter by the cart_item's ID directly
            cart_item = CartItem.objects.get(id=cart_item_id, cart=cart)
            cart_item.delete()
            return Response({'message': 'Item removed from cart'})
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found in cart'}, status=404)

