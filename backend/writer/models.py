from django.db import models
from blogs.models import Category, Post
# Create your models here.
class Writer(models.Model):
    first_name = models.CharField(max_length =100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    date_joined = models.DateField()
    bio = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    categories = models.ManyToManyField('blogs.Category', blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
class Written_Posts(models.Model):
    writer = models.ForeignKey('Writer', on_delete=models.CASCADE)
    post = models.ForeignKey('blogs.Post', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.writer} - {self.post}"
