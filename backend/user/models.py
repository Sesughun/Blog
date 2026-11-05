from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        WRITER = "writer", "Writer"
        READER = "reader", "Reader"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.READER)

    # Public writer profile
    job_title = models.CharField(max_length=100, blank=True)
    tagline = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    website = models.URLField(blank=True)
    x_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    categories = models.ManyToManyField("blogs.Category", blank=True, related_name="writers")

    # Reader features
    saved_posts = models.ManyToManyField("blogs.Post", blank=True, related_name="saved_by")
    followed_categories = models.ManyToManyField("blogs.Category", blank=True, related_name="followers")
    followed_writers = models.ManyToManyField(
        "self", blank=True, symmetrical=False, related_name="followers"
    )

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = self.Role.ADMIN
        if self.role == self.Role.ADMIN:
            self.is_staff = True
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return self.get_full_name() or self.username

    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN

    @property
    def is_writer_role(self):
        return self.role in (self.Role.WRITER, self.Role.ADMIN)
