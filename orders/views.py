from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Order, OrderItem, ShippingAddress
from .serializers import OrderSerializer, ShippingAddressSerializer
from cart.models import Cart, CartItem
from products.models import Product


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.is_superuser:
            return Order.objects.all()

        return Order.objects.filter(user=self.request.user)

    @action(detail=False, methods=['POST'])
    def create_from_cart(self, request):
        # Get user's cart
        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if cart has items
        cart_items = CartItem.objects.filter(cart=cart)
        if not cart_items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create shipping address (if provided in request)
        shipping_address = None
        if 'shipping_address' in request.data:
            address_data = request.data['shipping_address']
            address_serializer = ShippingAddressSerializer(data=address_data)
            if address_serializer.is_valid():
                shipping_address = address_serializer.save()
            else:
                return Response(
                    {'error': 'Invalid shipping address', 'details': address_serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Calculate total price
        total_price = sum(item.product.price * item.quantity for item in cart_items)

        # Create order
        order = Order.objects.create(
            user=request.user,
            total_price=total_price,
            payment_method=request.data.get('payment_method', 'COD'),
            shipping_address=shipping_address
        )

        # Create order items
        for cart_item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                quantity=cart_item.quantity,
                price=cart_item.product.price
            )

        # Clear the cart
        cart_items.delete()

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
