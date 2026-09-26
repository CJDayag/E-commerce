from rest_framework import serializers
from .models import NewsletterSubscriber


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ['id', 'email', 'created_at', 'active']
        read_only_fields = ['id', 'created_at', 'active']
