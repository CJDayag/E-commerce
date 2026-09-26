from django.urls import path
from .views import NewsletterSubscribeView, NewsletterSubscriberListView, NewsletterSubscriberExportView

urlpatterns = [
    path('subscribe/', NewsletterSubscribeView.as_view(), name='newsletter-subscribe'),
    path('subscribers/', NewsletterSubscriberListView.as_view(), name='newsletter-subscribers'),
    path('subscribers/export/', NewsletterSubscriberExportView.as_view(), name='newsletter-subscribers-export'),
]
