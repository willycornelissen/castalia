import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getAllPostsAdmin, deletePost } from '@/services/posts.service';
import { deleteMediaByUrl, extractMediaUrlsFromMarkdown } from '@/services/storage.service';
import type { Post } from '@/types/post';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PostList } from '@/components/admin/PostList';

export function AdminDashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const list = await getAllPostsAdmin();
        if (active) setPosts(list);
      } catch {
        if (active) setError('Erro ao carregar publicações.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleDelete = async (post: Post) => {
    await deletePost(post.slug);
    const mediaUrls = new Set<string>();
    if (post.feature_image) {
      mediaUrls.add(post.feature_image);
    }
    for (const inlineUrl of extractMediaUrlsFromMarkdown(post.content_markdown)) {
      mediaUrls.add(inlineUrl);
    }
    if (mediaUrls.size > 0) {
      await Promise.allSettled(
        Array.from(mediaUrls).map((url) => deleteMediaByUrl(url))
      );
    }
    setPosts((prev) => prev.filter((item) => item.slug !== post.slug));
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-10 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Publicações</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gerencie seus rascunhos e artigos publicados.
            </p>
          </div>
          <Link
            to="/admin/editor"
            className="inline-flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2 rounded hover:bg-black transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Artigo
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Carregando artigos...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <PostList posts={posts} onDelete={handleDelete} />
        )}
      </div>
    </AdminLayout>
  );
}
