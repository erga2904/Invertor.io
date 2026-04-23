'use client';

import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { Package, Search, Plus, Trash2, Pencil, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { buildClientAuthHeaders, getClientUser } from '@/lib/client-auth';
import { hasPermission } from '@/lib/rbac';

type Product = {
  _id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
  imageSource?: string;
};

function buildInlineFallback(name: string) {
  const safe = (name || 'Produk').replace(/[<&>]/g, '').slice(0, 18);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="12" fill="#0EA5E9"/><text x="40" y="45" text-anchor="middle" fill="#fff" font-family="Arial" font-size="12" font-weight="700">${safe}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function formatImageSourceLabel(source?: string) {
  if (!source) return 'Cadangan';
  if (source === 'Manual URL') return 'URL Manual';
  if (source === 'Brand image') return 'Gambar Merek';
  if (source === 'Placeholder by product name') return 'Placeholder Nama Produk';
  if (source.startsWith('Local brand image')) return 'Gambar Merek Lokal';
  return source;
}

export default function ProductsPage() {
  const { isReady, isAuthenticated } = useAuthRedirect();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    price: 0,
    stock: 0,
  });

  const userRole = getClientUser().role;
  const canCreateProduct = hasPermission(userRole, 'products:create');
  const canEditProduct = hasPermission(userRole, 'products:edit');
  const canDeleteProduct = hasPermission(userRole, 'products:delete');

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch {
      setError('Gagal memuat data produk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const keyword = searchParams.get('search') || '';
    setSearch(keyword);
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return products;

    return products.filter((product) =>
      [product.name, product.sku, product.category].join(' ').toLowerCase().includes(query)
    );
  }, [products, search]);

  const totalStock = useMemo(
    () => products.reduce((sum, item) => sum + Number(item.stock || 0), 0),
    [products]
  );

  const resetForm = () => {
    setForm({ name: '', sku: '', category: '', price: 0, stock: 0 });
    setEditingProductId(null);
  };

  const handleStartCreate = () => {
    if (!canCreateProduct) {
      setError('Role Anda tidak memiliki izin menambahkan produk.');
      return;
    }

    if (showForm && !editingProductId) {
      setShowForm(false);
      resetForm();
      setError('');
      return;
    }

    resetForm();
    setShowForm(true);
    setError('');
  };

  const handleCancelEdit = () => {
    resetForm();
    setShowForm(false);
    setError('');
  };

  const handleStartEdit = (product: Product) => {
    if (!canEditProduct) {
      setError('Role Anda tidak memiliki izin mengubah produk.');
      return;
    }

    setForm({
      name: product.name || '',
      sku: product.sku || '',
      category: product.category || '',
      price: Number(product.price) || 0,
      stock: Number(product.stock) || 0,
    });
    setEditingProductId(product._id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const isEditing = Boolean(editingProductId);

      if (isEditing && !canEditProduct) {
        setError('Role Anda tidak memiliki izin mengubah produk.');
        return;
      }

      if (!isEditing && !canCreateProduct) {
        setError('Role Anda tidak memiliki izin menambahkan produk.');
        return;
      }

      const response = await fetch(isEditing ? `/api/products/${editingProductId}` : '/api/products', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: buildClientAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || (isEditing ? 'Gagal memperbarui produk' : 'Gagal menambahkan produk'));
        return;
      }

      resetForm();
      setShowForm(false);
      await loadProducts();
    } catch {
      setError(
        editingProductId
          ? 'Terjadi kesalahan saat memperbarui produk'
          : 'Terjadi kesalahan saat menyimpan produk'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDeleteProduct) {
      setError('Role Anda tidak memiliki izin menghapus produk.');
      return;
    }

    try {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: buildClientAuthHeaders(),
      });
      await loadProducts();
    } catch {
      setError('Gagal menghapus produk');
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
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Produk</h1>
                <p className="text-slate-400 font-medium mt-1">Kelola inventaris, stok, dan SKU produk Anda</p>
              </div>
              {canCreateProduct ? (
                <button
                  onClick={handleStartCreate}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-100 active:scale-95"
                >
                  <Plus size={20} />
                  {showForm && !editingProductId ? 'Tutup Form' : 'Tambah Produk Baru'}
                </button>
              ) : (
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-2 rounded-xl">
                  Akses terbatas ({userRole})
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-widest font-bold text-slate-400">Total Produk</p>
                <p className="text-2xl font-black text-slate-700 mt-1">{products.length}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-widest font-bold text-slate-400">Total Stok</p>
                <p className="text-2xl font-black text-slate-700 mt-1">{totalStock}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-widest font-bold text-slate-400">Hasil Pencarian</p>
                <p className="text-2xl font-black text-slate-700 mt-1">{filteredProducts.length}</p>
              </div>
            </div>

            {showForm && canCreateProduct && (
              <form onSubmit={handleSubmit} className="mb-8 bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">
                    {editingProductId ? 'Edit Produk' : 'Form Produk Baru'}
                  </p>
                  {editingProductId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
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
                    placeholder="Nama Produk"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-green-500"
                  />
                  <input
                    required
                    placeholder="SKU"
                    value={form.sku}
                    onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-green-500"
                  />
                  <input
                    required
                    placeholder="Kategori"
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-green-500"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Stok"
                    value={form.stock}
                    onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-green-500"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Harga"
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-green-500 col-span-2"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white font-bold px-5 py-2.5 rounded-xl"
                >
                  {submitting
                    ? editingProductId
                      ? 'Menyimpan Perubahan...'
                      : 'Menyimpan...'
                    : editingProductId
                      ? 'Simpan Perubahan'
                      : 'Simpan Produk'}
                </button>
              </form>
            )}

            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input
                type="text"
                placeholder="Cari produk berdasarkan nama, SKU, atau kategori..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-slate-800"
              />
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-600 font-semibold text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                  <Package className="text-slate-200" size={32} />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Produk tidak ditemukan</p>
                <p className="text-slate-400 text-sm mt-1">Mulai dengan menambahkan produk pertama ke inventaris</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <div key={product._id} className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 flex items-center justify-between">
                    <div className="grid grid-cols-6 gap-4 flex-1">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl || 'https://placehold.co/80x80?text=Produk'}
                          alt={product.name}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                          onError={(event) => {
                            const target = event.currentTarget;
                            target.onerror = null;
                            target.src = buildInlineFallback(product.name);
                          }}
                        />
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sumber</p>
                          <p className="font-semibold text-slate-600 text-xs">{formatImageSourceLabel(product.imageSource)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nama</p>
                        <p className="font-bold text-slate-700">{product.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">SKU</p>
                        <p className="font-semibold text-slate-600">{product.sku}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Kategori</p>
                        <p className="font-semibold text-slate-600">{product.category}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Harga</p>
                        <p className="font-semibold text-slate-600">Rp {Number(product.price).toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Stok</p>
                        <p className={`font-bold ${product.stock <= 5 ? 'text-red-600' : 'text-green-600'}`}>{product.stock}</p>
                      </div>
                    </div>
                    {(canEditProduct || canDeleteProduct) && (
                      <div className="ml-4 flex items-center gap-2">
                        {canEditProduct && (
                          <button
                            onClick={() => handleStartEdit(product)}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-200"
                            aria-label="Edit produk"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        {canDeleteProduct && (
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                            aria-label="Hapus produk"
                          >
                            <Trash2 size={18} />
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
