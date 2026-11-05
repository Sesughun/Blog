from rest_framework.test import APITestCase

from user.models import User

from .models import Category, Post


class RoleTests(APITestCase):
    def setUp(self):
        self.cat = Category.objects.create(name="Tech")
        mk = lambda e, r: User.objects.create_user(username=e, email=e, password="pw-12345-x", role=r, first_name=e[:3])
        self.admin, self.writer, self.writer2, self.reader = (
            mk("admin@x.com", "admin"), mk("w1@x.com", "writer"), mk("w2@x.com", "writer"), mk("r@x.com", "reader"),
        )
        self.payload = {"title": "Hello", "content": "word " * 50, "category": "tech"}

    def login(self, user):
        token = self.client.post("/api/auth/login/", {"email": user.email, "password": "pw-12345-x"}).data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    def test_register_creates_reader_even_if_role_sent(self):
        r = self.client.post("/api/auth/register/", {
            "first_name": "A", "last_name": "B", "email": "n@x.com", "password": "S3cure-pass-9", "role": "admin"})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["user"]["role"], "reader")

    def test_reader_cannot_write_but_can_comment(self):
        self.login(self.reader)
        self.assertEqual(self.client.post("/api/posts/", self.payload).status_code, 403)
        post = Post.objects.create(title="P", content="x", category=self.cat, author=self.writer, status="published")
        self.assertEqual(self.client.post(f"/api/posts/{post.slug}/comments/", {"body": "nice"}).status_code, 201)

    def test_anonymous_cannot_comment_and_sees_only_published(self):
        Post.objects.create(title="Draft", content="x", category=self.cat, author=self.writer)
        pub = Post.objects.create(title="Pub", content="x", category=self.cat, author=self.writer, status="published")
        self.assertEqual([p["slug"] for p in self.client.get("/api/posts/").data["results"]], [pub.slug])
        self.assertEqual(self.client.post(f"/api/posts/{pub.slug}/comments/", {"body": "hi"}).status_code, 403)

    def test_writer_cannot_self_publish_and_admin_can(self):
        self.login(self.writer)
        r = self.client.post("/api/posts/", {**self.payload, "status": "published", "is_featured": True})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["status"], "pending")
        self.assertFalse(r.data["is_featured"])
        self.login(self.admin)
        r = self.client.patch(f"/api/posts/{r.data['slug']}/", {"status": "published"})
        self.assertEqual(r.data["status"], "published")

    def test_writer_cannot_edit_others_posts(self):
        post = Post.objects.create(title="P", content="x", category=self.cat, author=self.writer, status="published")
        self.login(self.writer2)
        self.assertEqual(self.client.patch(f"/api/posts/{post.slug}/", {"title": "x"}).status_code, 403)
        self.assertEqual(self.client.delete(f"/api/posts/{post.slug}/").status_code, 403)

    def test_only_admin_manages_users_and_categories(self):
        self.login(self.writer)
        self.assertEqual(self.client.get("/api/users/").status_code, 403)
        self.assertEqual(self.client.post("/api/categories/", {"name": "New"}).status_code, 403)
        self.login(self.admin)
        self.assertEqual(self.client.patch(f"/api/users/{self.reader.id}/", {"role": "writer"}).status_code, 200)
        self.assertEqual(self.client.patch(f"/api/users/{self.admin.id}/", {"role": "reader"}).status_code, 400)
        self.assertEqual(self.client.post("/api/categories/", {"name": "New"}).status_code, 201)
