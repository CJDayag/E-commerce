from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0003_promocode'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='discount_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='order',
            name='promo_code',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, to='orders.promocode'),
        ),
    ]
