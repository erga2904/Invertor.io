'use client';

import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { LayoutGrid, Plus, Search, Trash2, Pencil, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { buildClientAuthHeaders, getClientUser } from '@/lib/client-auth';
import { hasPermission } from '@/lib/rbac';

type Category = {
  _id: string;
  name: string;
  description: string;
};

export default function CategoriesPage() {
  const { isReady, isAuthenticated } = useAuthRedirect();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const userRole = getClientUser().role;
  const canCreateCategory = hasPermission(userRole, 'categories:create');
  const canEditCategory = hasPermission(userRole, 'categories:edit');
  const canDeleteCategory = hasPermission(userRole, 'categories:delete');

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch {
      setError('Gagal memuat data kategori');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const keyword = searchParams.get('search') || '';
    setSearch(keyword);
  }, [searchParams]);

  const filteredCategories = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    if (!keyword) return categories;

    return categories.filter((item) =>
      [item.name, item.description || '']
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    );
  }, [categories, search]);

  const resetForm = () => {
    setForm({ name: '', description: '' });
    setEditingCategoryId(null);
  };

  const handleStartCreate = () => {
    if (!canCreateCategory) {
      setError('Role Anda tidak memiliki izin menambahkan kategori.');
      return;
    }

    if (showForm && !editingCategoryId) {
      setShowForm(false);
      resetForm();
      setError('');
      return;
    }

    resetForm();
    setShowForm(true);
    setError('');
  };

  const handleStartEdit = (category: Category) => {
    if (!canEditCategory) {
      setError('Role Anda tidak memiliki izin mengubah kategori.');
      return;
    }

    setForm({ name: category.name || '', description: category.description || '' });
    setEditingCategoryId(category._id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const isEditing = Boolean(editingCategoryId);

      if (isEditing && !canEditCategory) {
        setError('Role Anda tidak memiliki izin mengubah kategori.');
        return;
      }

      if (!isEditing && !canCreateCategory) {
        setError('Role Anda tidak memiliki izin menambahkan kategori.');
        return;
      }

      const response = await fetch(isEditing ? `/api/categories/${editingCategoryId}` : '/api/categories', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: buildClientAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || (isEditing ? 'Gagal memperbarui kategori' : 'Gagal menambahkan kategori'));
        return;
      }

      resetForm();
      setShowForm(false);
      await loadCategories();
    } catch {
      setError(
        editingCategoryId
          ? 'Terjadi kesalahan saat memperbarui kategori'
          : 'Terjadi kesalahan saat menyimpan kategori'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDeleteCategory) {
      setError('Role Anda tidak memiliki izin menghapus kategori.');
      return;
    }

    try {
      await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: buildClientAuthHeaders(),
      });
      await loadCategories();
    } catch {
      setError('Gagal menghapus kategori');
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto space-y-10">
          <Navbar />
          
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-50">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Kategori</h1>
                <p className="text-slate-400 font-medium mt-1">Organisasikan produk Anda dengan kategori yang rapi</p>
              </div>
              {canCreateCategory ? (
                <button
                  onClick={handleStartCreate}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-100 active:scale-95"
                >
                  <Plus size={20} />
                  {showForm && !editingCategoryId ? 'Tutup Form' : 'Tambah Kategori Baru'}
                </button>
              ) : (
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-2 rounded-xl">
                  Akses terbatas ({userRole})
                </span>
              )}
            </div>

            {showForm && canCreateCategory && (
              <form onSubmit={handleSubmit} className="mb-8 bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">
                    {editingCategoryId ? 'Edit Kategori' : 'Form Kategori Baru'}
                  </p>
                  {editingCategoryId && (
                    <button
                      type="button"
                      onClick={handleStartCreate}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-red-600"
                    >
                      <X size={14} />
                      Batalkan Edit
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    required
                    placeholder="Nama kategori"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-green-500"
                  />
                  <input
                    placeholder="Deskripsi singkat"
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-green-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white font-bold px-5 py-2.5 rounded-xl"
                >
                  {submitting
                    ? editingCategoryId
                      ? 'Menyimpan Perubahan...'
                      : 'Menyimpan...'
                    : editingCategoryId
                      ? 'Simpan Perubahan'
                      : 'Simpan Kategori'}
                </button>
              </form>
            )}

            {error && (
              <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-600 font-semibold text-sm">
                {error}
              </div>
            )}

            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input
                type="text"
                placeholder="Cari kategori berdasarkan nama atau deskripsi..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-slate-800"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="flex items-center justify-center py-12 bg-slate-50/70 rounded-[32px] border-2 border-dashed border-slate-100 text-slate-400 font-semibold">
                Kategori tidak ditemukan.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-6">
                {filteredCategories.map((category) => (
                  <div key={category._id} className="aspect-square bg-slate-50 border border-slate-100 rounded-[32px] p-6 flex flex-col hover:bg-green-50 hover:border-green-100 transition-all group shadow-sm hover:shadow-xl hover:shadow-green-100/30">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-200 group-hover:text-green-500 shadow-sm mb-4 transition-colors">
                      <LayoutGrid size={28} />
                    </div>
                    <h3 className="font-bold text-slate-700 group-hover:text-green-600 transition-colors uppercase text-xs tracking-widest">
                      {category.name}
                    </h3>
                    <p className="text-slate-400 text-xs mt-2 flex-1">{category.description || 'Tanpa deskripsi'}</p>
                    {(canEditCategory || canDeleteCategory) && (
                      <div className="mt-4 self-end flex items-center gap-2">
                        {canEditCategory && (
                          <button
                            onClick={() => handleStartEdit(category)}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-200"
                            aria-label="Edit kategori"
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                        {canDeleteCategory && (
                          <button
                            onClick={() => handleDelete(category._id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                            aria-label="Hapus kategori"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
