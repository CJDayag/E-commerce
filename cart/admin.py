from django.contrib import admin
from .models import Cart , CartItem

class CartItemInline(admin.TabularInline):  
    model = CartItem
    extra = 1  


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'created_at')  
    search_fields = ('user__username',)  
    inlines = [CartItemInline]  


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'cart', 'product', 'quantity')  
    search_fields = ('cart__user__username', 'product__name')  


