from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User

AVATAR_COLORS = ["#b9452a", "#3b5b8c", "#5e7d4a", "#8c3b5e", "#2f7a78", "#6b4b8c"]


class WriterSerializer(serializers.ModelSerializer):
    """Public profile of an author/writer."""

    name = serializers.CharField(source="full_name", read_only=True)
    initial = serializers.SerializerMethodField()
    color = serializers.SerializerMethodField()
    categories = serializers.SlugRelatedField(many=True, read_only=True, slug_field="slug")
    post_count = serializers.SerializerMethodField()
    followers_count = serializers.IntegerField(source="followers.count", read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "name", "initial", "color", "job_title", "tagline", "bio",
            "website", "x_url", "linkedin_url", "categories", "post_count", "followers_count",
        ]

    def get_initial(self, obj):
        return obj.full_name[:1].upper()

    def get_color(self, obj):
        return AVATAR_COLORS[obj.id % len(AVATAR_COLORS)]

    def get_post_count(self, obj):
        return obj.posts.filter(status="published").count()


class MeSerializer(WriterSerializer):
    """The logged-in user's own account (includes private fields)."""

    saved_posts = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    followed_categories = serializers.SlugRelatedField(many=True, read_only=True, slug_field="slug")
    followed_writers = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta(WriterSerializer.Meta):
        fields = WriterSerializer.Meta.fields + [
            "email", "first_name", "last_name", "role",
            "saved_posts", "followed_categories", "followed_writers",
        ]
        read_only_fields = ["email", "role"]


class AdminUserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="full_name", read_only=True)
    post_count = serializers.IntegerField(source="posts.count", read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "name", "email", "first_name", "last_name", "role",
            "is_active", "date_joined", "post_count", "job_title", "tagline", "bio",
        ]
        read_only_fields = ["email", "date_joined"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["first_name", "last_name", "email", "password"]
        extra_kwargs = {"first_name": {"required": True}}

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated):
        # Public sign-up always creates a reader; admins promote users to writers.
        return User.objects.create_user(
            username=validated["email"], role=User.Role.READER, **validated
        )
