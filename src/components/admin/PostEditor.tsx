import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings, Eye, ImagePlus, Tag } from 'lucide-react';
import type { CreatePostDTO, Post, PostStatus } from '@/types/post';
import { slugify } from '@/utils/slugify';
import { calculateReadingTime } from '@/utils/readingTime';
import {
  extractMenuTagOptions,
  parseTagsInput,
  toggleTagInInput,
} from '@/utils/tags';
import { useNavigation } from '@/context/NavigationContext';
import { PostContent } from '@/components/reader/PostContent';
import { PostSettingsSidebar } from './PostSettingsSidebar';
import { compressAndUploadMedia } from '@/services/storage.service';

interface PostEditorProps {
  initialPost?: Post | null;
  onSave: (payload: CreatePostDTO) => Promise<void>;
  isSaving: boolean;
}

export function PostEditor({ initialPost, onSave, isSaving }: PostEditorProps) {
  const [title, setTitle] = useState(initialPost?.title ?? '');
  const [slug, setSlug] = useState(initialPost?.slug ?? '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(initialPost));
  const [contentMarkdown, setContentMarkdown] = useState(
    initialPost?.content_markdown ?? ''
  );
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '');
  const [featureImage, setFeatureImage] = useState(initialPost?.feature_image ?? '');
  const [tagsInput, setTagsInput] = useState(initialPost?.tags.join(', ') ?? '');
  const [status, setStatus] = useState<PostStatus>(initialPost?.status ?? 'draft');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inlineInputRef = useRef<HTMLInputElement>(null);
  const { items: navigationItems } = useNavigation();

  const readingTime = calculateReadingTime(contentMarkdown);
  const menuTagOptions = extractMenuTagOptions(navigationItems);
  const activeTags = parseTagsInput(tagsInput);

  const handleToggleTag = (tag: string) => {
    setTagsInput((prev) => toggleTagInInput(prev, tag));
  };

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle);
    if (!slugManuallyEdited && status !== 'published') {
      setSlug(slugify(nextTitle));
    }
  };

  const handleSlugChange = (nextSlug: string) => {
    setSlugManuallyEdited(true);
    setSlug(slugify(nextSlug));
  };

  const buildPayload = (targetStatus: PostStatus): CreatePostDTO => {
    const parsedTags = parseTagsInput(tagsInput);

    return {
      title: title.trim() || 'Sem título',
      slug: slug || slugify(title) || `rascunho-${Date.now()}`,
      content_markdown: contentMarkdown,
      excerpt: excerpt.trim(),
      feature_image: featureImage,
      status: targetStatus,
      tags: parsedTags,
    };
  };

  const triggerSave = async (targetStatus: PostStatus) => {
    setError(null);
    try {
      await onSave(buildPayload(targetStatus));
      setStatus(targetStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar publicação.');
    }
  };

  const saveShortcutRef = useRef<() => void>(() => {});
  saveShortcutRef.current = () => {
    void triggerSave(status);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveShortcutRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInlineImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInlineUploading(true);
    setError(null);
    try {
      const url = await compressAndUploadMedia(file, 'inline');
      setContentMarkdown((prev) => `${prev}\n\n![${file.name}](${url})\n`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload da imagem.');
    } finally {
      setInlineUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Artigos
          </Link>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase font-medium">
            {status === 'published' ? 'Publicado' : 'Rascunho'}
          </span>
          <span className="text-xs text-gray-400 hidden sm:inline">
            ~{readingTime} min de leitura
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => inlineInputRef.current?.click()}
            disabled={inlineUploading}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
          >
            <ImagePlus className="w-4 h-4" />
            {inlineUploading ? 'Enviando...' : 'Inserir Imagem'}
          </button>
          <input
            ref={inlineInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleInlineImageSelect}
          />

          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            className={`inline-flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 border rounded ${
              showPreview
                ? 'border-ink bg-ink text-white'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>

          <button
            type="button"
            onClick={() => void triggerSave('draft')}
            disabled={isSaving}
            className="text-xs sm:text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-700 disabled:opacity-50"
          >
            Salvar Rascunho
          </button>

          <button
            type="button"
            onClick={() => void triggerSave('published')}
            disabled={isSaving}
            className="text-xs sm:text-sm px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded disabled:opacity-50"
          >
            {status === 'published' ? 'Atualizar' : 'Publicar'}
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Configurações"
            className="p-2 text-gray-500 hover:text-gray-900 rounded hover:bg-gray-100"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="bg-red-50 border-b border-red-200 px-6 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
        <div className="p-6 sm:p-10 flex flex-col">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Título do artigo..."
            className="w-full font-serif text-3xl sm:text-4xl font-bold text-ink placeholder-gray-300 focus:outline-none mb-4"
          />

          <div className="mb-5 pb-4 border-b border-gray-100 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 mr-1">
              <Tag className="w-3.5 h-3.5" />
              Tags do menu:
            </span>
            {menuTagOptions.map((option) => {
              const selected = activeTags.includes(option.tag);
              return (
                <button
                  key={option.tag}
                  type="button"
                  onClick={() => handleToggleTag(option.tag)}
                  aria-pressed={selected}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selected
                      ? 'bg-ink text-white border-ink'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-ink hover:text-ink'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
            {activeTags
              .filter((tag) => !menuTagOptions.some((opt) => opt.tag === tag))
              .map((customTag) => (
                <button
                  key={customTag}
                  type="button"
                  onClick={() => handleToggleTag(customTag)}
                  title="Remover tag"
                  className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                >
                  #{customTag} ×
                </button>
              ))}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="text-xs text-gray-500 hover:text-ink underline ml-1"
            >
              + Editar todas as tags
            </button>
          </div>

          <textarea
            value={contentMarkdown}
            onChange={(e) => setContentMarkdown(e.target.value)}
            placeholder="Comece a escrever sua história em Markdown..."
            className="w-full flex-1 min-h-[500px] font-mono text-sm text-gray-800 placeholder-gray-300 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {showPreview && (
          <div className="p-6 sm:p-10 bg-paper overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <p className="font-condensed text-[11px] uppercase tracking-widest text-muted mb-4">
                Pré-visualização Newspaper
              </p>
              <h1 className="font-serif text-4xl font-bold text-ink mb-6">
                {title || 'Sem título'}
              </h1>
              {featureImage && (
                <img
                  src={featureImage}
                  alt={title}
                  className="w-full h-64 object-cover mb-6 border border-ink/15"
                />
              )}
              <PostContent markdown={contentMarkdown || '*Nenhum conteúdo ainda.*'} />
            </div>
          </div>
        )}
      </div>

      <PostSettingsSidebar
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        slug={slug}
        onSlugChange={handleSlugChange}
        status={status}
        tagsInput={tagsInput}
        onTagsInputChange={setTagsInput}
        menuTagOptions={menuTagOptions}
        onToggleTag={handleToggleTag}
        excerpt={excerpt}
        onExcerptChange={setExcerpt}
        featureImage={featureImage}
        onFeatureImageChange={setFeatureImage}
      />
    </div>
  );
}
