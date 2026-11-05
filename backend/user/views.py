from django.contrib.auth import authenticate
from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from blogs.models import Comment, ContactMessage, Post, Subscriber

from .models import User
from .permissions import IsAdminRole
from .serializers import AdminUserSerializer, MeSerializer, RegisterSerializer


def auth_response(user, code=status.HTTP_200_OK):
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": MeSerializer(user).data}, status=code)


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    return auth_response(serializer.save(), status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    email = str(request.data.get("email", "")).strip()
    password = request.data.get("password", "")
    account = User.objects.filter(email__iexact=email).first()
    user = authenticate(username=account.username, password=password) if account else None
    if user is None:
        return Response({"detail": "Incorrect email or password."}, status=status.HTTP_400_BAD_REQUEST)
    return auth_response(user)


@api_view(["POST"])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == "PATCH":
        serializer = MeSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
    return Response(MeSerializer(request.user).data)


class UserAdminViewSet(viewsets.ModelViewSet):
    """Admin only: list users, change role, deactivate, delete."""

    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminRole]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get("role")
        return qs.filter(role=role) if role else qs

    def update(self, request, *args, **kwargs):
        target = self.get_object()
        if target == request.user and (
            request.data.get("role", target.role) != target.role
            or request.data.get("is_active", True) is False
        ):
            return Response(
                {"detail": "You cannot demote or deactivate your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if self.get_object() == request.user:
            return Response({"detail": "You cannot delete your own account."}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)


@api_view(["GET"])
@permission_classes([IsAdminRole])
def stats(request):
    roles = {r["role"]: r["n"] for r in User.objects.values("role").annotate(n=Count("id"))}
    return Response({
        "users": User.objects.count(),
        "readers": roles.get("reader", 0),
        "writers": roles.get("writer", 0),
        "admins": roles.get("admin", 0),
        "published": Post.objects.filter(status="published").count(),
        "pending": Post.objects.filter(status="pending").count(),
        "drafts": Post.objects.filter(status="draft").count(),
        "comments": Comment.objects.count(),
        "subscribers": Subscriber.objects.count(),
        "unresolved_messages": ContactMessage.objects.filter(is_resolved=False).count(),
    })
