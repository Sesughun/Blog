from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from user.models import User
from user.serializers import WriterSerializer


class WriterViewSet(viewsets.ReadOnlyModelViewSet):
    """Public list/detail of writers (and the admins who write)."""

    serializer_class = WriterSerializer
    pagination_class = None
    permission_classes = [AllowAny]

    def get_queryset(self):
        return User.objects.filter(
            role__in=[User.Role.WRITER, User.Role.ADMIN], is_active=True
        ).order_by("first_name")

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def follow(self, request, pk=None):
        writer = get_object_or_404(self.get_queryset(), pk=pk)
        followed = request.user.followed_writers
        if followed.filter(pk=writer.pk).exists():
            followed.remove(writer)
            return Response({"following": False})
        followed.add(writer)
        return Response({"following": True})
