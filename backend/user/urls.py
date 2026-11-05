from django.urls import path
from . import views

urlpatterns = [
    path('', views.profile, name='profile'),
    path('saved-posts/', views.saved_posts, name='saved_posts'),
    path('subscriptions/', views.subscriptions, name='subscriptions'),
    path('deactivate/', views.deactivate, name='deactivate'),
    path('activate/', views.activate, name='activate'),
]