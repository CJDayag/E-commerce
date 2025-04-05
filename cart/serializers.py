from rest_framework import serializers
from .models import Cart, CartItem
from products.serializers import ProductSerializer
from products.models import Product

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    cart_item_id = serializers.ReadOnlyField(source='id')  # Add this line

    class Meta:
        model = CartItem
        fields = ['cart_item_id', 'product', 'product_id', 'quantity']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    user_id = serializers.ReadOnlyField(source='user.id')
    cart_id = serializers.ReadOnlyField(source='id')  # Add this line

    class Meta:
        model = Cart
        fields = ['cart_id', 'user_id', 'items', 'created_at']
