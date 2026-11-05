export type Role = "admin" | "writer" | "reader";
export type PostStatus = "draft" | "pending" | "published";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  initial: string;
  post_count: number;
}

export interface Writer {
  id: number;
  name: string;
  initial: string;
  color: string;
  job_title: string;
  tagline: string;
  bio: string;
  website: string;
  x_url: string;
  linkedin_url: string;
  categories: string[];
  post_count: number;
  followers_count: number;
}

export interface Me extends Writer {
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  saved_posts: number[];
  followed_categories: string[];
  followed_writers: number[];
}

export interface PostSummary {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  cover_color: string;
  cover_image: string;
  category: Pick<Category, "id" | "name" | "slug" | "color">;
  author: Writer;
  status: PostStatus;
  is_featured: boolean;
  is_editors_pick: boolean;
  views: number;
  reading_minutes: number;
  comment_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostDetail extends PostSummary {
  content: string;
  cover_caption: string;
  key_takeaways: string;
  tags: string;
  takeaways: string[];
  tag_list: string[];
  is_saved: boolean;
}

export interface Comment {
  id: number;
  body: string;
  created_at: string;
  user: Writer;
  post_title: string;
  post_slug: string;
}

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  date_joined: string;
  post_count: number;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  topic: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

export interface Stats {
  users: number;
  readers: number;
  writers: number;
  admins: number;
  published: number;
  pending: number;
  drafts: number;
  comments: number;
  subscribers: number;
  unresolved_messages: number;
}
