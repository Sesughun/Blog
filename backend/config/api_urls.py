from django.urls import include, path
from rest_framework.routers import DefaultRouter

from blogs import views as blog_views
from user import views as user_views
from writer.views import WriterViewSet

router = DefaultRouter()
router.register("categories", blog_views.CategoryViewSet, basename="category")
router.register("posts", blog_views.PostViewSet, basename="post")
router.register("comments", blog_views.CommentViewSet, basename="comment")
router.register("contact", blog_views.ContactViewSet, basename="contact")
router.register("writers", WriterViewSet, basename="writer")
router.register("users", user_views.UserAdminViewSet, basename="user")

urlpatterns = [
    path("auth/register/", user_views.register),
    path("auth/login/", user_views.login),
    path("auth/logout/", user_views.logout),
    path("auth/me/", user_views.me),
    path("newsletter/", blog_views.subscribe),
    path("newsletter/subscribers/", blog_views.subscriber_list),
    path("admin/stats/", user_views.stats),
    path("", include(router.urls)),
]
