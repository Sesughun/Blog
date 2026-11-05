from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from blogs.models import Category, Comment, Post
from user.models import User

PASSWORD = "folio12345"

CATEGORIES = [
    ("Culture", "Music, film, books and the ideas shaping how we live together.", "#b9452a"),
    ("Technology", "Tools, the internet and what new tech means for ordinary days.", "#3b5b8c"),
    ("Money", "Budgets, careers and building a calmer relationship with money.", "#5e7d4a"),
    ("Life", "Habits, relationships, health and the small things that add up.", "#a8641f"),
    ("Food", "Recipes, kitchens and the stories behind what we eat.", "#8c3b5e"),
    ("Travel", "Slow trips, city guides and the joy of going somewhere new.", "#2f7a78"),
    ("Ideas", "Essays and arguments worth sitting with for a while.", "#6b4b8c"),
]

USERS = [
    ("admin@folio.test", "Founder", "Editor", "admin", "Founder & editor", "the editor", ["ideas"]),
    ("ada@folio.test", "Ada", "Okafor", "writer", "Senior writer", "always reading", ["technology", "ideas"]),
    ("tunde@folio.test", "Tunde", "Bello", "writer", "Money & careers", "spreadsheet fan", ["money"]),
    ("zainab@folio.test", "Zainab", "Musa", "writer", "Food & life", "kitchen first", ["food", "life"]),
    ("reader@folio.test", "Chioma", "Eze", "reader", "", "", []),
]

BODY = (
    "Feeds are noisier than ever, and a growing number of writers are going back to something older.\n\n"
    "## Why we left\n\nPersonal sites never disappeared, but they fell out of fashion for good reasons.\n\n"
    "> A website is the one place on the internet where you get to decide what comes first.\n\n"
    "## How to start your own\n\nKeep it small. Pick a name, write a short about page, and publish three posts.\n\n"
    "- Pick a name\n- Write an about page\n- Publish three posts"
)

POSTS = [
    ("The quiet comeback of the personal website", "ada@folio.test", "ideas", "rust", True, True),
    ("A beginner's map of AI tools that actually help", "ada@folio.test", "technology", "blue", False, False),
    ("Your phone is not the problem. Your notifications are.", "ada@folio.test", "technology", "blue", False, False),
    ("What a good password manager actually protects you from", "ada@folio.test", "technology", "blue", False, False),
    ("The emergency fund, explained without the guilt", "tunde@folio.test", "money", "green", False, False),
    ("Negotiating your first raise, step by step", "tunde@folio.test", "money", "green", False, False),
    ("My grandmother's kitchen, recipe by recipe", "zainab@folio.test", "food", "amber", False, True),
    ("In defence of the long, boring walk", "zainab@folio.test", "life", "purple", False, True),
]


class Command(BaseCommand):
    help = "Create demo categories, users, posts and comments for local development."

    def handle(self, *args, **options):
        cats = {}
        for name, desc, color in CATEGORIES:
            cats[name.lower()], _ = Category.objects.get_or_create(
                name=name, defaults={"description": desc, "color": color}
            )

        users = {}
        for email, first, last, role, job, tagline, writes in USERS:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"username": email, "first_name": first, "last_name": last, "role": role,
                          "job_title": job, "tagline": tagline,
                          "bio": f"{first} writes for Folio about things worth slowing down for."},
            )
            if created:
                user.set_password(PASSWORD)
                user.save()
                user.categories.set([cats[s] for s in writes])
            users[email] = user

        now = timezone.now()
        for i, (title, author, cat, cover, featured, pick) in enumerate(POSTS):
            Post.objects.get_or_create(
                title=title,
                defaults={
                    "excerpt": "Feeds are noisier than ever. Here is what a calmer alternative looks like.",
                    "content": BODY, "key_takeaways": "Platforms give reach; a website gives you control.\nStart small.",
                    "tags": "ideas, writing", "cover_color": cover, "category": cats[cat],
                    "author": users[author], "status": "published", "is_featured": featured,
                    "is_editors_pick": pick, "views": 500 - i * 40,
                    "published_at": now - timedelta(days=i * 3),
                },
            )

        first_post = Post.objects.filter(title=POSTS[0][0]).first()
        if first_post and not first_post.comments.exists():
            Comment.objects.create(post=first_post, user=users["reader@folio.test"],
                                   body="I deleted my old blog years ago and regretted it. This is the push I needed.")

        self.stdout.write(self.style.SUCCESS(
            f"Seeded. Log in with admin@folio.test / ada@folio.test / reader@folio.test, password '{PASSWORD}'."
        ))
