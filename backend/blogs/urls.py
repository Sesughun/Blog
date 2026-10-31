from django.urls import path
from . import views

urlpatterns = [
    path("", views.post_list, name="post-list"),
    path("categories/", views.category_list, name="category-list"),
    path("posts/<int:post_id>/", views.post_detail, name="post-detail"),
    path("categories/<int:category_id>/", views.category_detail, name="category-detail"),
]