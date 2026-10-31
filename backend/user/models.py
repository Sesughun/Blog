from django.db import models

# Create your models here.
class User(models.Model):
    first_name = models.CharField(max_length =100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    date_joined = models.DateField()
    is_active = models.BooleanField(default=True)
    saved_posts = models.ManyToManyField('blogs.Post', blank=True)
    subscriptions = models.ManyToManyField('blogs.Category', blank=True)

    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"