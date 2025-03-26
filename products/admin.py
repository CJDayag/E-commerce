from django.contrib import admin
from .models import Category, Product

# Category Admin
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'description')
    search_fields = ('name',)
    ordering = ('name',)

# Product Admin
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'price', 'stock', 'condition')
    list_filter = ('category', 'condition')
    search_fields = ('name', 'description')
    ordering = ('name', 'price')
    readonly_fields = ('image_preview',)

    # Display image preview
    def image_preview(self, obj):
        if obj.image:
            return f'<img src="{obj.image.url}" width="75" height="75" />'
        return "No Image"
    image_preview.allow_tags = True
    image_preview.short_description = 'Image Preview'
