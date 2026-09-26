from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, PromoCodeViewSet

promo_router = DefaultRouter()
promo_router.register(r'promocodes', PromoCodeViewSet, basename='promocode')

order_router = DefaultRouter()
order_router.register(r'', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(promo_router.urls)),
    path('', include(order_router.urls)),
]