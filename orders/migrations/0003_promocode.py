from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_shippingaddress_order_order_number_order_updated_at_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='PromoCode',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=40, unique=True)),
                ('description', models.CharField(blank=True, max_length=255)),
                ('discount_type', models.CharField(choices=[('PERCENT', 'Percentage'), ('FIXED', 'Fixed Amount')], default='PERCENT', max_length=10)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=8)),
                ('active', models.BooleanField(default=True)),
                ('starts_at', models.DateTimeField(blank=True, null=True)),
                ('ends_at', models.DateTimeField(blank=True, null=True)),
                ('usage_limit', models.PositiveIntegerField(blank=True, null=True)),
                ('usage_count', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
