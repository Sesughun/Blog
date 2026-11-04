from django.shortcuts import render
from django.shortcuts import get_object_or_404
from .models import Post, Writer
from django.http import HttpResponse, JsonResponse
from django.views.decorators import require_http_methods

# Create your views here.
@require_http_methods(["GET"])
def writer_post_list(request, writer_id):
    posts = Post.objects.filter(writer_id=writer_id)
    data = [{"id": post.id, "title": post.title, "content": post.content} for post in posts]
    return JsonResponse(data, safe=False)

@require_http_methods(["POST"])
def create_writer(request):
    name = request.POST.get("name")
    bio = request.POST.get("bio")
    writer = Writer.objects.create(name=name, bio=bio)
    data = {"id": writer.id, "name": writer.name, "bio": writer.bio}
    return JsonResponse(data)

@require_http_methods(["GET"])
def writer_detail(request, writer_id):
    writer = get_object_or_404(Writer, id=writer_id)
    data = {"id": writer.id, "name": writer.name, "bio": writer.bio}
    return JsonResponse(data)
