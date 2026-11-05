from django.contrib import admin

from .models import Category, Comment, ContactMessage, Post, Subscriber

admin.site.register(Category)
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(ContactMessage)
admin.site.register(Subscriber)
