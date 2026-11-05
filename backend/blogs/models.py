import math

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


def unique_slug(model, value, instance=None, max_length=100):
    base = slugify(value)[:max_length] or "item"
    slug, n = base, 2
    qs = model.objects.exclude(pk=instance.pk) if instance and instance.pk else model.objects.all()
    while qs.filter(slug=slug).exists():
        suffix = f"-{n}"
        slug = f"{base[:max_length - len(suffix)]}{suffix}"
        n += 1
    return slug


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default="#b9452a")
    date_created = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(Category, self.name, self)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Post(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING = "pending", "Pending review"
        PUBLISHED = "published", "Published"

    class Cover(models.TextChoices):
        RUST = "rust", "Rust"
        BLUE = "blue", "Blue"
        GREEN = "green", "Green"
        PURPLE = "purple", "Purple"
        AMBER = "amber", "Amber"
        TEAL = "teal", "Teal"

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    excerpt = models.TextField(blank=True)
    content = models.TextField()
    key_takeaways = models.TextField(blank=True, help_text="One takeaway per line")
    tags = models.CharField(max_length=200, blank=True, help_text="Comma separated")
    cover_color = models.CharField(max_length=10, choices=Cover.choices, default=Cover.RUST)
    cover_image = models.URLField(blank=True)
    cover_caption = models.CharField(max_length=200, blank=True)

    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="posts")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="posts")

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    is_featured = models.BooleanField(default=False)
    is_editors_pick = models.BooleanField(default=False)
    views = models.PositiveIntegerField(default=0)

    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(Post, self.title, self, 200)
        if self.status == self.Status.PUBLISHED and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    @property
    def reading_minutes(self):
        return max(1, math.ceil(len(self.content.split()) / 200))

    def __str__(self):
        return self.title


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments")
    body = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} on {self.post}"


class ContactMessage(models.Model):
    class Topic(models.TextChoices):
        GENERAL = "general", "General question"
        PITCH = "pitch", "Writer pitch"
        FEEDBACK = "feedback", "Feedback"
        OTHER = "other", "Something else"

    name = models.CharField(max_length=100)
    email = models.EmailField()
    topic = models.CharField(max_length=10, choices=Topic.choices, default=Topic.GENERAL)
    message = models.TextField(max_length=5000)
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.topic})"


class Subscriber(models.Model):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email
