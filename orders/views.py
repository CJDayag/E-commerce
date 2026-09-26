from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from django.utils import timezone
from .models import Order, OrderItem, ShippingAddress, PromoCode
from .serializers import OrderSerializer, ShippingAddressSerializer, PromoCodeSerializer
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

        # Calculate subtotal
        subtotal = sum(item.product.price * item.quantity for item in cart_items)

        # Apply promo code if provided
        promo_code_value = request.data.get('promo_code')
        promo = None
        discount_amount = 0
        if promo_code_value:
            promo = PromoCode.objects.filter(code__iexact=promo_code_value, active=True).first()

            if not promo:
                return Response({'error': 'Invalid promo code'}, status=status.HTTP_400_BAD_REQUEST)

            now = timezone.now()
            if promo.starts_at and promo.starts_at > now:
                return Response({'error': 'Promo code not active yet'}, status=status.HTTP_400_BAD_REQUEST)
            if promo.ends_at and promo.ends_at < now:
                return Response({'error': 'Promo code has expired'}, status=status.HTTP_400_BAD_REQUEST)
            if promo.usage_limit is not None and promo.usage_count >= promo.usage_limit:
                return Response({'error': 'Promo code usage limit reached'}, status=status.HTTP_400_BAD_REQUEST)

            if promo.discount_type == 'PERCENT':
                discount_amount = subtotal * (promo.amount / 100)
            else:
                discount_amount = promo.amount

            discount_amount = min(discount_amount, subtotal)
            PromoCode.objects.filter(pk=promo.pk).update(usage_count=promo.usage_count + 1)

        # Create order
        order = Order.objects.create(
            user=request.user,
            total_price=subtotal - discount_amount,
            promo_code=promo,
            discount_amount=discount_amount,
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


class PromoCodeViewSet(viewsets.ModelViewSet):
    queryset = PromoCode.objects.all()
    serializer_class = PromoCodeSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        queryset = PromoCode.objects.all()
        if self.request.user.is_staff or self.request.user.is_superuser:
            return queryset

        now = timezone.now()
        return queryset.filter(
            active=True,
        ).filter(
            models.Q(starts_at__isnull=True) | models.Q(starts_at__lte=now)
        ).filter(
            models.Q(ends_at__isnull=True) | models.Q(ends_at__gte=now)
        )

    @action(detail=False, methods=['POST'], permission_classes=[permissions.IsAuthenticated])
    def validate(self, request):
        code = request.data.get('code')

        if not code:
            return Response({'error': 'Promo code is required'}, status=status.HTTP_400_BAD_REQUEST)

        promo = PromoCode.objects.filter(code__iexact=code, active=True).first()
        if not promo:
            return Response({'error': 'Invalid promo code'}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        if promo.starts_at and promo.starts_at > now:
            return Response({'error': 'Promo code not active yet'}, status=status.HTTP_400_BAD_REQUEST)
        if promo.ends_at and promo.ends_at < now:
            return Response({'error': 'Promo code has expired'}, status=status.HTTP_400_BAD_REQUEST)
        if promo.usage_limit is not None and promo.usage_count >= promo.usage_limit:
            return Response({'error': 'Promo code usage limit reached'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        cart_items = CartItem.objects.filter(cart=cart)
        if not cart_items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        subtotal = sum(item.product.price * item.quantity for item in cart_items)

        if promo.discount_type == 'PERCENT':
            discount_amount = subtotal * (promo.amount / 100)
        else:
            discount_amount = promo.amount

        discount_amount = min(discount_amount, subtotal)

        return Response({
            'code': promo.code,
            'discount_amount': discount_amount,
            'discount_type': promo.discount_type,
            'amount': promo.amount,
        })
