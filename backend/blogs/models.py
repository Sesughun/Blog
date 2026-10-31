from django.db import models

# Create your models here.
class Category(models.Model):
    name = models.CharField(max_length =100, unique=True)
    slug = models.SlugField(max_length=100)
    date_created = models.DateField()

    
    def __str__(self):
        return f"{self.name}"

class Post(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField()
    content = models.TextField()
    published_date = models.DateTimeField()
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    tags = models.CharField(max_length=200, blank=True)
    summary = models.TextField(blank=True)
    comment = models.TextField(blank=True)
    author = models.ForeignKey('writer.Writer', on_delete=models.CASCADE)
    def __str__(self):
        return f"{self.title}"