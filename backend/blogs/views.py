from django.shortcuts import render
from django.shortcuts import get_object_or_404
from .models import Post, Category
from django.http import HttpResponse, JsonResponse
from django.views.decorators import require_http_methods

# Create your views here.
@require_http_methods(["GET"])
def post_list(request):
    posts = Post.objects.all()
    data = [{"id": post.id, "title": post.title, "content": post.content} for post in posts]
    return JsonResponse(data, safe=False)

@require_http_methods(["GET"])
def post_detail(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    data = {"id": post.id, "title": post.title, "content": post.content}
    return JsonResponse(data)

@require_http_methods(["GET"])
def category_list(request):
    categories = Category.objects.all()
    data = [{"id": category.id, "name": category.name} for category in categories]
    return JsonResponse(data, safe=False)

@require_http_methods(["GET"])
def category_detail(request, category_id):
    category = get_object_or_404(Category, id=category_id)
    data = {"id": category.id, "name": category.name}
    return JsonResponse(data)