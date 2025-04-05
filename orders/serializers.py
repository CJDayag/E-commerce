from rest_framework import serializers
from .models import Order, OrderItem, ShippingAddress
from products.serializers import ProductSerializer
from accounts.serializers import UserProfileSerializer  # Assuming you have this


class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = ['address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country']


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = UserProfileSerializer(read_only=True)
    shipping_address = ShippingAddressSerializer(read_only=True)
    total_amount = serializers.DecimalField(source='total_price', max_digits=10, decimal_places=2)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'created_at', 'updated_at',
            'status', 'payment_method', 'total_amount', 'shipping_address', 'items'
        ]
