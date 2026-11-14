import { X, Lock } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import type { PostStatus } from '@/types/post';

interface PostSettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  onSlugChange: (slug: string) => void;
  status: PostStatus;
  tagsInput: string;
  onTagsInputChange: (val: string) => void;
  excerpt: string;
  onExcerptChange: (val: string) => void;
  featureImage: string;
  onFeatureImageChange: (url: string) => void;
}

export function PostSettingsSidebar({
  isOpen,
  onClose,
  slug,
  onSlugChange,
  status,
  tagsInput,
  onTagsInputChange,
  excerpt,
  onExcerptChange,
  featureImage,
  onFeatureImageChange,
}: PostSettingsSidebarProps) {
  if (!isOpen) return null;

  const isPublished = status === 'published';

  return (
    <aside className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Configurações do Artigo</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar configurações"
          className="text-gray-400 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-6 overflow-y-auto flex-1">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
            Imagem de Capa
          </label>
          {featureImage ? (
            <div className="space-y-2">
              <img
                src={featureImage}
                alt="Capa do artigo"
                className="w-full h-36 object-cover rounded border border-gray-200"
              />
              <button
                type="button"
                onClick={() => onFeatureImageChange('')}
                className="text-xs text-red-600 hover:underline"
              >
                Remover imagem de capa
              </button>
            </div>
          ) : (
            <ImageUploader onUploaded={onFeatureImageChange} variant="hero" />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="post-slug-input"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-600"
            >
              URL Slug
            </label>
            {isPublished && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                <Lock className="w-3 h-3" />
                Slug imutável
              </span>
            )}
          </div>
          <input
            id="post-slug-input"
            type="text"
            value={slug}
            disabled={isPublished}
            onChange={(e) => onSlugChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded disabled:bg-gray-100 disabled:text-gray-500"
          />
          <p className="text-[11px] text-gray-400 mt-1">/post/{slug || 'seu-slug'}</p>
        </div>

        <div>
          <label
            htmlFor="post-tags-input"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1"
          >
            Tags (separadas por vírgula)
          </label>
          <input
            id="post-tags-input"
            type="text"
            value={tagsInput}
            onChange={(e) => onTagsInputChange(e.target.value)}
            placeholder="editorial, tecnologia, ensaios"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
          />
        </div>

        <div>
          <label
            htmlFor="post-excerpt-input"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1"
          >
            Resumo (Excerpt)
          </label>
          <textarea
            id="post-excerpt-input"
            rows={4}
            value={excerpt}
            onChange={(e) => onExcerptChange(e.target.value)}
            placeholder="Breve descrição exibida nos cards da capa..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
          />
        </div>
      </div>
    </aside>
  );
}
