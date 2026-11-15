import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { siteConfig } from '@/config/site.config';
import { validateAndNormalizeNavItems } from '@/services/navigation.service';
import type { NavItem } from '@/types/site';

interface MenuEditorProps {
  initialItems: NavItem[];
  onSave: (items: NavItem[]) => Promise<void>;
  isSaving?: boolean;
}

interface EditableNavRow extends NavItem {
  id: string;
}

export function MenuEditor({
  initialItems,
  onSave,
  isSaving = false,
}: MenuEditorProps) {
  const rowIdSeq = useRef(0);
  const toRows = (items: NavItem[]): EditableNavRow[] =>
    items.map((item) => {
      rowIdSeq.current += 1;
      return {
        id: `nav-row-${rowIdSeq.current}`,
        label: item.label,
        path: item.path,
      };
    });

  const [rows, setRows] = useState<EditableNavRow[]>(() => toRows(initialItems));
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setRows(toRows(initialItems));
  }, [initialItems]);

  const handleFieldChange = (
    id: string,
    field: keyof NavItem,
    value: string
  ) => {
    setError(null);
    setSuccessMessage(null);
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= rows.length) return;
    setError(null);
    setSuccessMessage(null);
    setRows((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const handleRemove = (id: string) => {
    setError(null);
    setSuccessMessage(null);
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleAdd = () => {
    setError(null);
    setSuccessMessage(null);
    rowIdSeq.current += 1;
    setRows((prev) => [
      ...prev,
      { id: `nav-row-${rowIdSeq.current}`, label: '', path: '' },
    ]);
  };

  const handleRestoreDefaults = () => {
    setError(null);
    setSuccessMessage(null);
    setRows(toRows(siteConfig.navigation));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      const normalized = validateAndNormalizeNavItems(
        rows.map(({ label, path }) => ({ label, path }))
      );
      await onSave(normalized);
      setRows(toRows(normalized));
      setSuccessMessage('Menu salvo com sucesso.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar as opções do menu.'
      );
    }
  };

  const previewItems = rows
    .map((row) => ({ label: row.label.trim(), path: row.path.trim() }))
    .filter((row) => row.label.length > 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded"
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded"
        >
          {successMessage}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Nenhuma opção configurada. Adicione ao menos um item para o menu.
          </div>
        ) : (
          rows.map((row, index) => (
            <div
              key={row.id}
              className="p-4 flex flex-col sm:flex-row sm:items-end gap-3"
            >
              <div className="flex-1">
                <label
                  htmlFor={`${row.id}-label`}
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Rótulo
                </label>
                <input
                  id={`${row.id}-label`}
                  type="text"
                  value={row.label}
                  onChange={(e) =>
                    handleFieldChange(row.id, 'label', e.target.value)
                  }
                  placeholder="Ex: Editorial"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-ink"
                />
              </div>

              <div className="flex-[1.3]">
                <label
                  htmlFor={`${row.id}-path`}
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Caminho ou URL
                </label>
                <input
                  id={`${row.id}-path`}
                  type="text"
                  value={row.path}
                  onChange={(e) =>
                    handleFieldChange(row.id, 'path', e.target.value)
                  }
                  placeholder="Ex: /tag/editorial ou https://..."
                  className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded focus:outline-none focus:border-ink"
                />
              </div>

              <div className="flex items-center gap-1 self-end">
                <button
                  type="button"
                  onClick={() => handleMove(index, -1)}
                  disabled={index === 0 || isSaving}
                  aria-label="Mover para cima"
                  title="Mover para cima"
                  className="p-2 text-gray-500 hover:text-ink border border-gray-200 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 1)}
                  disabled={index === rows.length - 1 || isSaving}
                  aria-label="Mover para baixo"
                  title="Mover para baixo"
                  className="p-2 text-gray-500 hover:text-ink border border-gray-200 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(row.id)}
                  disabled={isSaving}
                  aria-label="Remover opção"
                  title="Remover opção"
                  className="p-2 text-gray-500 hover:text-red-600 border border-gray-200 rounded disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-800 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Adicionar opção
          </button>
          <button
            type="button"
            onClick={handleRestoreDefaults}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-600 rounded hover:text-ink hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar padrão
          </button>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2 rounded hover:bg-black transition-colors disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Salvando...' : 'Salvar menu'}
        </button>
      </div>

      <div className="bg-paper border border-gray-200 rounded-lg p-5">
        <p className="text-xs font-condensed uppercase tracking-widest text-gray-500 mb-3">
          Pré-visualização no cabeçalho
        </p>
        <div className="py-3 border-y border-ink/20 flex flex-wrap justify-center gap-6 sm:gap-10">
          {previewItems.length === 0 ? (
            <span className="text-xs text-gray-400">Sem itens visíveis</span>
          ) : (
            previewItems.map((item, idx) => (
              <span
                key={`${idx}-${item.label}`}
                className="font-condensed text-sm uppercase tracking-widest font-bold text-ink"
              >
                {item.label}
              </span>
            ))
          )}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Caminhos suportados: <code>/</code> (capa), <code>/tag/nome-da-tag</code>,{' '}
          <code>/post/slug-do-artigo</code> ou URLs externas <code>https://...</code>.
        </p>
      </div>
    </form>
  );
}
