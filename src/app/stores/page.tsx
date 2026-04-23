'use client';

import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { Store, Plus, MapPin, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { buildClientAuthHeaders, getClientUser } from '@/lib/client-auth';
import { hasPermission } from '@/lib/rbac';

type StoreItem = {
  _id: string;
  name: string;
  location: string;
  manager: string;
  employees?: number;
  items?: number;
  orders?: number;
};

export default function StoresPage() {
  const { isReady, isAuthenticated } = useAuthRedirect();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', location: '', manager: '' });

  const userRole = getClientUser().role;
  const canCreateStore = hasPermission(userRole, 'stores:create');
  const canDeleteStore = hasPermission(userRole, 'stores:delete');

  const loadStores = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stores');
      const data = await response.json();
      setStores(data.stores || []);
    } catch {
      setError('Gagal memuat data toko');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!canCreateStore) {
        setError('Role Anda tidak memiliki izin menambahkan toko.');
        return;
      }

      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: buildClientAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Gagal menambahkan toko');
        return;
      }

      setForm({ name: '', location: '', manager: '' });
      setShowForm(false);
      await loadStores();
    } catch {
      setError('Terjadi kesalahan saat menyimpan toko');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDeleteStore) {
      setError('Role Anda tidak memiliki izin menghapus toko.');
      return;
    }

    try {
      await fetch(`/api/stores/${id}`, {
        method: 'DELETE',
        headers: buildClientAuthHeaders(),
      });
      await loadStores();
    } catch {
      setError('Gagal menghapus toko');
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
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Toko</h1>
                <p className="text-slate-400 font-medium mt-1">Kelola cabang toko dan lokasi operasional</p>
              </div>
              {canCreateStore ? (
                <button
                  onClick={() => setShowForm((prev) => !prev)}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-100 active:scale-95"
                >
                  <Plus size={20} />
                  {showForm ? 'Tutup Form' : 'Tambah Toko Baru'}
                </button>
              ) : (
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-2 rounded-xl">
                  Akses terbatas ({userRole})
                </span>
              )}
            </div>

            {showForm && canCreateStore && (
              <form onSubmit={handleCreate} className="mb-8 bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <input
                    required
                    placeholder="Nama toko"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-green-500"
                  />
                  <input
                    required
                    placeholder="Lokasi"
                    value={form.location}
                    onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-green-500"
                  />
                  <input
                    placeholder="Nama manajer"
                    value={form.manager}
                    onChange={(e) => setForm((prev) => ({ ...prev, manager: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-green-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white font-bold px-5 py-2.5 rounded-xl"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Toko'}
                </button>
              </form>
            )}

            {error && (
              <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-600 font-semibold text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : stores.length === 0 ? (
              <div className="flex items-center justify-center py-12 bg-slate-50/70 rounded-[32px] border-2 border-dashed border-slate-100 text-slate-400 font-semibold">
                Belum ada data toko. Tambahkan cabang pertama Anda.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-8">
                {stores.map((store) => (
                  <div key={store._id} className="bg-white border border-slate-100 rounded-[32px] p-8 flex flex-col hover:bg-green-50 hover:border-green-100 transition-all group shadow-sm hover:shadow-xl hover:shadow-green-100/30">
                    <div className="w-16 h-16 bg-slate-50 group-hover:bg-green-100 rounded-2xl flex items-center justify-center text-slate-200 group-hover:text-green-500 shadow-sm mb-6 transition-colors">
                      <Store size={32} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-2">{store.name}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                       <MapPin size={16} />
                       <span>{store.location}</span>
                    </div>
                      <p className="text-sm text-slate-500 mb-4">Manajer: {store.manager || 'Belum diisi'}</p>
                    <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-slate-50">
                       <div className="text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inventaris</p>
                          <p className="font-bold text-slate-700">{store.items || 0} Produk</p>
                       </div>
                       <div className="text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pesanan</p>
                          <p className="font-bold text-green-600">{store.orders || 0}</p>
                       </div>
                    </div>
                    {canDeleteStore && (
                      <button
                        onClick={() => handleDelete(store._id)}
                        className="mt-6 self-end p-2 rounded-lg text-red-500 hover:bg-red-50"
                        aria-label="Hapus toko"
                      >
                        <Trash2 size={16} />
                      </button>
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
