from django.contrib import admin
from .models import Order, OrderItem, PromoCode

class OrderItemInLine(admin.TabularInline):
    model = OrderItem
    extra = 1

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'payment_method', 'total_price', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = [OrderItemInLine]

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'price')
    search_fields = ('order__id', 'product__name')


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'amount', 'active', 'starts_at', 'ends_at', 'usage_limit', 'usage_count')
    list_filter = ('active', 'discount_type')
    search_fields = ('code',)
