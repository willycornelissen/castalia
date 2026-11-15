import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MenuEditor } from '@/components/admin/MenuEditor';
import { useNavigation } from '@/context/NavigationContext';
import type { NavItem } from '@/types/site';

export function AdminMenuPage() {
  const { items, loading, updateNavigation } = useNavigation();
  const [saving, setSaving] = useState(false);

  const handleSave = async (nextItems: NavItem[]) => {
    setSaving(true);
    try {
      await updateNavigation(nextItems);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-10 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Menu de Navegação</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Edite, reordene ou adicione links exibidos no cabeçalho do jornal.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Carregando opções do menu...</p>
        ) : (
          <MenuEditor
            initialItems={items}
            onSave={handleSave}
            isSaving={saving}
          />
        )}
      </div>
    </AdminLayout>
  );
}
