import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, Eye } from 'lucide-react';
import type { Post } from '@/types/post';
import { formatDate } from '@/utils/formatDate';

interface PostListProps {
  posts: Post[];
  onDelete: (post: Post) => Promise<void>;
}

type StatusFilter = 'all' | 'draft' | 'published';

export function PostList({ posts, onDelete }: PostListProps) {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [confirmTarget, setConfirmTarget] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredPosts = posts.filter((post) => {
    if (filter === 'all') return true;
    return post.status === filter;
  });

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      await onDelete(confirmTarget);
      setConfirmTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-gray-200 mb-6">
        {(['all', 'draft', 'published'] as StatusFilter[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === tab
                ? 'border-ink text-ink'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab === 'all' ? 'Todos' : tab === 'draft' ? 'Rascunhos' : 'Publicados'}
          </button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-gray-500">
          Nenhum artigo encontrado nesta categoria.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-3 px-4 font-semibold">Título</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold hidden sm:table-cell">Atualizado em</th>
                <th className="py-3 px-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredPosts.map((post) => (
                <tr key={post.slug} className="hover:bg-gray-50/70">
                  <td className="py-3.5 px-4">
                    <Link
                      to={`/admin/editor/${post.slug}`}
                      className="font-medium text-gray-900 hover:underline block"
                    >
                      {post.title}
                    </Link>
                    <span className="text-xs text-gray-400">/post/{post.slug}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${
                        post.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 hidden sm:table-cell">
                    {formatDate(post.updated_at)}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Link
                      to={`/post/${post.slug}?preview=true`}
                      target="_blank"
                      title="Pré-visualizar"
                      className="inline-flex p-1.5 text-gray-400 hover:text-ink"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/admin/editor/${post.slug}`}
                      title="Editar"
                      className="inline-flex p-1.5 text-gray-400 hover:text-ink"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setConfirmTarget(post)}
                      title="Excluir"
                      className="inline-flex p-1.5 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Excluir Artigo</h3>
            <p className="text-sm text-gray-600 mt-2">
              Tem certeza que deseja excluir permanentemente{' '}
              <strong>{confirmTarget.title}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
