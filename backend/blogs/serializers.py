from rest_framework import serializers

from user.serializers import WriterSerializer

from .models import Category, Comment, ContactMessage, Post, Subscriber


class CategorySerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()
    initial = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "color", "initial", "post_count"]
        read_only_fields = ["slug"]

    def get_post_count(self, obj):
        return obj.posts.filter(status="published").count()

    def get_initial(self, obj):
        return obj.name[:1].upper()


class CategoryBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "color"]


class PostListSerializer(serializers.ModelSerializer):
    category = CategoryBriefSerializer(read_only=True)
    author = WriterSerializer(read_only=True)
    reading_minutes = serializers.IntegerField(read_only=True)
    comment_count = serializers.IntegerField(source="comments.count", read_only=True)

    class Meta:
        model = Post
        fields = [
            "id", "slug", "title", "excerpt", "cover_color", "cover_image", "category",
            "author", "status", "is_featured", "is_editors_pick", "views", "reading_minutes",
            "comment_count", "published_at", "created_at", "updated_at",
        ]


class PostDetailSerializer(PostListSerializer):
    takeaways = serializers.SerializerMethodField()
    tag_list = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()

    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + [
            "content", "cover_caption", "key_takeaways", "tags", "takeaways", "tag_list", "is_saved",
        ]

    def get_takeaways(self, obj):
        return [line.strip() for line in obj.key_takeaways.splitlines() if line.strip()]

    def get_tag_list(self, obj):
        return [t.strip() for t in obj.tags.split(",") if t.strip()]

    def get_is_saved(self, obj):
        user = self.context["request"].user
        return bool(user.is_authenticated and user.saved_posts.filter(pk=obj.pk).exists())


class PostWriteSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(slug_field="slug", queryset=Category.objects.all())

    class Meta:
        model = Post
        fields = [
            "title", "excerpt", "content", "key_takeaways", "tags", "cover_color",
            "cover_image", "cover_caption", "category", "status", "is_featured", "is_editors_pick",
        ]

    def validate(self, data):
        user = self.context["request"].user
        if not user.is_admin_role:
            # Only admins publish and curate; writers submit for review.
            data.pop("is_featured", None)
            data.pop("is_editors_pick", None)
            wanted = data.get("status")
            current = self.instance.status if self.instance else None
            if wanted == Post.Status.PUBLISHED and current != Post.Status.PUBLISHED:
                data["status"] = Post.Status.PENDING
        return data


class CommentSerializer(serializers.ModelSerializer):
    user = WriterSerializer(read_only=True)
    post_title = serializers.CharField(source="post.title", read_only=True)
    post_slug = serializers.CharField(source="post.slug", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "body", "created_at", "user", "post_title", "post_slug"]
        read_only_fields = ["created_at"]


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "topic", "message", "is_resolved", "created_at"]
        read_only_fields = ["is_resolved", "created_at"]


class SubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscriber
        fields = ["id", "email", "created_at"]
        read_only_fields = ["created_at"]
        extra_kwargs = {"email": {"validators": []}}
