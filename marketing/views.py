import csv
from django.http import HttpResponse
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from .models import NewsletterSubscriber
from .serializers import NewsletterSubscriberSerializer


class NewsletterSubscribeView(generics.CreateAPIView):
    queryset = NewsletterSubscriber.objects.all()
    serializer_class = NewsletterSubscriberSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        subscriber, created = NewsletterSubscriber.objects.get_or_create(email=email)
        if not created:
            return Response({'message': 'You are already subscribed.'}, status=status.HTTP_200_OK)

        serializer = self.get_serializer(subscriber)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class NewsletterSubscriberListView(generics.ListAPIView):
    queryset = NewsletterSubscriber.objects.order_by('-created_at')
    serializer_class = NewsletterSubscriberSerializer
    permission_classes = [permissions.IsAdminUser]


class NewsletterSubscriberExportView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="newsletter_subscribers.csv"'

        writer = csv.writer(response)
        writer.writerow(['email', 'active', 'created_at'])

        for subscriber in NewsletterSubscriber.objects.order_by('-created_at'):
            writer.writerow([subscriber.email, subscriber.active, subscriber.created_at.isoformat()])

        return response
