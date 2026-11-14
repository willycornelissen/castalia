import { useState, type ChangeEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { compressAndUploadMedia, type MediaVariant } from '@/services/storage.service';

interface ImageUploaderProps {
  onUploaded: (url: string) => void;
  variant?: MediaVariant;
  label?: string;
}

export function ImageUploader({
  onUploaded,
  variant = 'hero',
  label = 'Selecionar imagem',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const url = await compressAndUploadMedia(file, variant, (pct) => setProgress(pct));
      onUploaded(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar imagem.';
      setError(message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4 cursor-pointer hover:border-gray-500 transition-colors bg-gray-50">
        <UploadCloud className="w-6 h-6 text-gray-500 mb-1" />
        <span className="text-xs font-medium text-gray-700">
          {uploading ? `Comprimindo e enviando... ${progress}%` : label}
        </span>
        <span className="text-[11px] text-gray-400 mt-0.5">
          JPEG, PNG ou WebP (convertido automaticamente)
        </span>
        <input
          type="file"
          aria-label={label}
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={uploading}
          className="sr-only"
        />
      </label>

      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-ink h-1.5 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
