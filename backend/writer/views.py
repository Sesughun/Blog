from django.shortcuts import render
from django.shortcuts import get_object_or_404
from blogs.models import Post
from .models import Writer
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

# Create your views here.
@require_http_methods(["GET"])
def writer_post_list(request, writer_id):
    posts = Post.objects.filter(writer_id=writer_id)
    data = [{"id": post.id, "title": post.title, "content": post.content} for post in posts]
    return JsonResponse(data, safe=False)

@require_http_methods(["POST"])
def create_writer(request):
    first_name = request.POST.get("first_name")
    last_name = request.POST.get("last_name")
    writer = Writer.objects.create(first_name=first_name, last_name=last_name, bio=bio)
    data = {"id": writer.id, "first_name": writer.first_name, "last_name": writer.last_name, "bio": writer.bio}
    writer = Writer.objects.create(name=name, bio=bio)
    data = {"id": writer.id, "name": writer.name, "bio": writer.bio}
    return JsonResponse(data)

@require_http_methods(["GET"])
def writer_detail(request, writer_id):
    writer = get_object_or_404(Writer, id=writer_id)
    data = {"id": writer.id, "first_name": writer.first_name, "last_name": writer.last_name, "bio": writer.bio}
    return JsonResponse(data)
