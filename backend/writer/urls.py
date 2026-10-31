from django.urls import path
from . import views
urlpatterns = [
    path('', views.index, name='index'),
    path('written-posts/', views.written_posts, name='written_posts'),
    path('profile/', views.profile, name='profile'),
    path('deactivate/', views.deactivate, name='deactivate'),
    path('activate/', views.activate, name='activate'),
]