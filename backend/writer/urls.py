from django.urls import path
from . import views
urlpatterns = [
    path('', views.writer_detail, name='profile'),
    path('posts/', views.writer_post_list, name='written_posts'),
    #path('deactivate/', views.deactivate, name='deactivate'),
    #path('activate/', views.activate, name='activate'),
]