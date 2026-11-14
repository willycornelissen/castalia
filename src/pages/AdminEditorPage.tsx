import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPost, getPostBySlug, updatePost } from '@/services/posts.service';
import type { CreatePostDTO, Post } from '@/types/post';
import { PostEditor } from '@/components/admin/PostEditor';

export function AdminEditorPage() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const [initialPost, setInitialPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let active = true;
    async function load() {
      try {
        const existing = await getPostBySlug(slug!);
        if (active) setInitialPost(existing);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  const handleSave = async (payload: CreatePostDTO) => {
    setSaving(true);
    try {
      if (initialPost) {
        const previousSlug = initialPost.slug;
        const updated = await updatePost(previousSlug, payload);
        setInitialPost(updated);
        if (updated.slug !== previousSlug) {
          navigate(`/admin/editor/${updated.slug}`, { replace: true });
        }
      } else {
        const created = await createPost(payload);
        setInitialPost(created);
        navigate(`/admin/editor/${created.slug}`, { replace: true });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-sm text-gray-500">Carregando editor...</p>
      </div>
    );
  }

  return (
    <PostEditor
      key={initialPost?.slug ?? 'new'}
      initialPost={initialPost}
      onSave={handleSave}
      isSaving={saving}
    />
  );
}
