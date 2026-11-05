from django.db.models import F, Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from user.permissions import IsAdminRole, IsWriterRole, ReadOnlyOrAdmin

from .models import Category, Comment, ContactMessage, Post, Subscriber
from .serializers import (
    CategorySerializer, CommentSerializer, ContactMessageSerializer, PostDetailSerializer,
    PostListSerializer, PostWriteSerializer, SubscriberSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [ReadOnlyOrAdmin]
    lookup_field = "slug"
    pagination_class = None

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def follow(self, request, slug=None):
        category = self.get_object()
        followed = request.user.followed_categories
        if followed.filter(pk=category.pk).exists():
            followed.remove(category)
            return Response({"following": False})
        followed.add(category)
        return Response({"following": True})


class PostViewSet(viewsets.ModelViewSet):
    lookup_field = "slug"

    def get_permissions(self):
        if self.action in ("list", "retrieve", "trending", "comments_list"):
            return [AllowAny()]
        if self.action == "create" or self.action == "manage":
            return [IsWriterRole()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "list" or self.action in ("manage", "trending"):
            return PostListSerializer
        if self.action in ("create", "update", "partial_update"):
            return PostWriteSerializer
        return PostDetailSerializer

    def get_queryset(self):
        qs = Post.objects.select_related("category", "author")
        user = self.request.user
        if self.action in ("list", "trending"):
            return qs.filter(status=Post.Status.PUBLISHED)
        if self.action == "manage":
            return qs if user.is_admin_role else qs.filter(author=user)
        if user.is_authenticated and user.is_admin_role:
            return qs
        visible = Q(status=Post.Status.PUBLISHED)
        if user.is_authenticated:
            visible |= Q(author=user)
        return qs.filter(visible)

    def filter_queryset(self, qs):
        if self.action not in ("list", "manage"):
            return qs
        p = self.request.query_params
        if p.get("category"):
            qs = qs.filter(category__slug=p["category"])
        if p.get("writer"):
            qs = qs.filter(author_id=p["writer"])
        if p.get("featured"):
            qs = qs.filter(is_featured=True)
        if p.get("picks"):
            qs = qs.filter(is_editors_pick=True)
        if p.get("status") and self.action == "manage":
            qs = qs.filter(status=p["status"])
        if p.get("saved") and self.request.user.is_authenticated:
            qs = qs.filter(saved_by=self.request.user)
        if p.get("search"):
            s = p["search"]
            qs = qs.filter(Q(title__icontains=s) | Q(excerpt__icontains=s) | Q(tags__icontains=s))
        if p.get("sort") == "popular":
            qs = qs.order_by("-views", "-published_at")
        elif self.action == "manage":
            qs = qs.order_by("-updated_at")
        return qs

    def check_owner(self, post):
        user = self.request.user
        if not (user.is_admin_role or (user.is_writer_role and post.author_id == user.id)):
            raise PermissionDenied("You can only change your own posts.")

    def retrieve(self, request, *args, **kwargs):
        post = self.get_object()
        if post.status == Post.Status.PUBLISHED:
            Post.objects.filter(pk=post.pk).update(views=F("views") + 1)
            post.refresh_from_db()
        return Response(self.get_serializer(post).data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save(author=request.user)
        return Response(PostDetailSerializer(post, context={"request": request}).data, status=201)

    def update(self, request, *args, **kwargs):
        post = self.get_object()
        self.check_owner(post)
        serializer = self.get_serializer(post, data=request.data, partial=kwargs.pop("partial", False))
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        return Response(PostDetailSerializer(post, context={"request": request}).data)

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        self.check_owner(post)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False)
    def manage(self, request):
        """Writer: their own posts in every status. Admin: all posts."""
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        return self.get_paginated_response(self.get_serializer(page, many=True).data)

    @action(detail=False)
    def trending(self, request):
        qs = self.get_queryset().order_by("-views", "-published_at")[:5]
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=True, methods=["post"], url_path="save")
    def save_toggle(self, request, slug=None):
        post = self.get_object()
        saved = request.user.saved_posts
        if saved.filter(pk=post.pk).exists():
            saved.remove(post)
            return Response({"saved": False})
        saved.add(post)
        return Response({"saved": True})

    @action(detail=True, methods=["get", "post"], url_path="comments")
    def comments_list(self, request, slug=None):
        post = self.get_object()
        if request.method == "POST":
            if not request.user.is_authenticated:
                raise PermissionDenied("Log in to post a response.")
            serializer = CommentSerializer(data=request.data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            comment = serializer.save(post=post, user=request.user)
            return Response(CommentSerializer(comment).data, status=201)
        return Response(CommentSerializer(post.comments.select_related("user"), many=True).data)


class CommentViewSet(mixins.ListModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    """Admin lists all comments; admin or the comment's author can delete."""

    queryset = Comment.objects.select_related("user", "post")
    serializer_class = CommentSerializer

    def get_permissions(self):
        return [IsAdminRole()] if self.action == "list" else [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        if not (request.user.is_admin_role or comment.user_id == request.user.id):
            raise PermissionDenied("You can only delete your own responses.")
        return super().destroy(request, *args, **kwargs)


class ContactViewSet(
    mixins.CreateModelMixin, mixins.ListModelMixin, mixins.UpdateModelMixin,
    mixins.DestroyModelMixin, viewsets.GenericViewSet,
):
    """Anyone can send a message; only admins read, resolve or delete them."""

    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer

    def get_permissions(self):
        return [AllowAny()] if self.action == "create" else [IsAdminRole()]

    def get_serializer(self, *args, **kwargs):
        if self.action in ("update", "partial_update"):
            kwargs["partial"] = True
            serializer = super().get_serializer(*args, **kwargs)
            serializer.fields["is_resolved"].read_only = False
            return serializer
        return super().get_serializer(*args, **kwargs)


@api_view(["POST"])
@permission_classes([AllowAny])
def subscribe(request):
    serializer = SubscriberSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    Subscriber.objects.get_or_create(email=serializer.validated_data["email"].lower())
    return Response({"detail": "You're subscribed."}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAdminRole])
def subscriber_list(request):
    return Response(SubscriberSerializer(Subscriber.objects.order_by("-created_at"), many=True).data)
