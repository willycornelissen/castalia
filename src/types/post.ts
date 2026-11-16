export type PostStatus = 'draft' | 'published';
export type PostTemplate = 'article' | 'resenha';

export interface Post {
  slug: string;
  title: string;
  content_markdown: string;
  excerpt: string;
  feature_image: string;
  status: PostStatus;
  template?: PostTemplate;
  tags: string[];
  reading_time: number;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePostDTO {
  title: string;
  slug: string;
  content_markdown: string;
  excerpt?: string;
  feature_image?: string;
  status: PostStatus;
  template?: PostTemplate;
  tags?: string[];
}

export interface UpdatePostDTO {
  title?: string;
  slug?: string;
  content_markdown?: string;
  excerpt?: string;
  feature_image?: string;
  status?: PostStatus;
  template?: PostTemplate;
  tags?: string[];
}
