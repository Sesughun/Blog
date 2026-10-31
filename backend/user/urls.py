from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('saved-posts/', views.saved_posts, name='saved_posts'),
    path('subscriptions/', views.subscriptions, name='subscriptions'),
    path('profile/', views.profile, name='profile'),
    path('deactivate/', views.deactivate, name='deactivate'),
    path('activate/', views.activate, name='activate'),
]