'use client';

import { Bell, HelpCircle, LogOut, Play, Search, Settings, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type SearchFeature = {
  label: string;
  href: string;
  keywords: string[];
};

type SearchProduct = {
  _id: string;
  name: string;
  sku: string;
  category: string;
};

type SearchCategory = {
  _id: string;
  name: string;
  description?: string;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  level: 'info' | 'warning';
  createdAt: string;
  href: string;
};

const FEATURE_ITEMS: SearchFeature[] = [
  { label: 'Beranda', href: '/', keywords: ['beranda', 'dashboard', 'home'] },
  { label: 'Produk', href: '/products', keywords: ['produk', 'barang', 'item', 'sku'] },
  { label: 'Kategori', href: '/categories', keywords: ['kategori', 'category'] },
  { label: 'Toko', href: '/stores', keywords: ['toko', 'store', 'cabang'] },
  { label: 'Keuangan', href: '/finances', keywords: ['keuangan', 'transaksi', 'pemasukan', 'pengeluaran'] },
  { label: 'Pengaturan', href: '/settings', keywords: ['pengaturan', 'setting', 'profil'] },
];

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function formatRelativeDatetime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleString('id-ID');
}

function getCurrentUserHeaders() {
  if (typeof window === 'undefined') return {};

  try {
    const rawUser = localStorage.getItem('user');
    const parsedUser = rawUser ? JSON.parse(rawUser) : null;
    const headers: Record<string, string> = {};

    if (parsedUser?.email) headers['x-user-email'] = parsedUser.email;
    if (parsedUser?.name) headers['x-user-name'] = parsedUser.name;
    if (parsedUser?.role) headers['x-user-role'] = parsedUser.role;

    return headers;
  } catch {
    return {};
  }
}

export default function Navbar() {
  const [showGuideMenu, setShowGuideMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchProducts, setSearchProducts] = useState<SearchProduct[]>([]);
  const [searchCategories, setSearchCategories] = useState<SearchCategory[]>([]);
  const [loadingSearchIndex, setLoadingSearchIndex] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsDisabled, setNotificationsDisabled] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  const normalizedQuery = useMemo(() => normalizeText(searchQuery), [searchQuery]);

  const featureResults = useMemo(() => {
    if (!normalizedQuery) return [];

    return FEATURE_ITEMS.filter((item) => {
      if (normalizeText(item.label).includes(normalizedQuery)) return true;
      return item.keywords.some((keyword) => keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword));
    }).slice(0, 5);
  }, [normalizedQuery]);

  const productResults = useMemo(() => {
    if (!normalizedQuery) return [];

    return searchProducts
      .filter((item) =>
        [item.name, item.sku, item.category]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      )
      .slice(0, 5);
  }, [normalizedQuery, searchProducts]);

  const categoryResults = useMemo(() => {
    if (!normalizedQuery) return [];

    return searchCategories
      .filter((item) =>
        [item.name, item.description || '']
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      )
      .slice(0, 5);
  }, [normalizedQuery, searchCategories]);

  const unreadCount = useMemo(() => {
    if (!notifications.length) return 0;
    return notifications.filter((item) => !readNotificationIds.includes(item.id)).length;
  }, [notifications, readNotificationIds]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setUserEmail(localStorage.getItem('userEmail') || 'Pengguna');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUserEmail(parsedUser?.email || parsedUser?.name || 'Pengguna');
    } catch {
      setUserEmail(localStorage.getItem('userEmail') || 'Pengguna');
    }

    try {
      const rawReadIds = localStorage.getItem('readNotificationIds');
      const parsedIds = rawReadIds ? JSON.parse(rawReadIds) : [];
      if (Array.isArray(parsedIds)) {
        setReadNotificationIds(parsedIds.filter((item) => typeof item === 'string'));
      }
    } catch {
      setReadNotificationIds([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('readNotificationIds', JSON.stringify(readNotificationIds));
  }, [readNotificationIds]);

  useEffect(() => {
    setShowGuideMenu(false);
    setShowUserMenu(false);
    setShowNotificationMenu(false);
  }, [pathname]);

  useEffect(() => {
    const shouldLoadIndex = normalizedQuery.length >= 2 && !searchProducts.length && !searchCategories.length;
    if (!shouldLoadIndex || loadingSearchIndex) return;

    const loadSearchIndex = async () => {
      setLoadingSearchIndex(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products', { cache: 'no-store' }),
          fetch('/api/categories', { cache: 'no-store' }),
        ]);

        const [productsData, categoriesData] = await Promise.all([
          productsRes.json(),
          categoriesRes.json(),
        ]);

        setSearchProducts(Array.isArray(productsData?.products) ? productsData.products : []);
        setSearchCategories(Array.isArray(categoriesData?.categories) ? categoriesData.categories : []);
      } catch {
        setSearchProducts([]);
        setSearchCategories([]);
      } finally {
        setLoadingSearchIndex(false);
      }
    };

    loadSearchIndex();
  }, [normalizedQuery, searchProducts.length, searchCategories.length, loadingSearchIndex]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuth');
    localStorage.removeItem('userEmail');
    router.push('/login');
  };

  const startTour = () => {
    window.dispatchEvent(new CustomEvent('start-app-tour'));
    setShowGuideMenu(false);
  };

  const openSearchRoute = (href: string) => {
    router.push(href);
    setSearchQuery('');
    setShowGuideMenu(false);
    setShowNotificationMenu(false);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (featureResults.length > 0) {
      openSearchRoute(featureResults[0].href);
      return;
    }

    const encoded = encodeURIComponent(query);
    if (productResults.length > 0) {
      openSearchRoute(`/products?search=${encoded}`);
      return;
    }

    if (categoryResults.length > 0) {
      openSearchRoute(`/categories?search=${encoded}`);
      return;
    }

    openSearchRoute(`/products?search=${encoded}`);
  };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    setNotificationError('');

    try {
      const response = await fetch('/api/notifications', {
        cache: 'no-store',
        headers: getCurrentUserHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        setNotificationError(data?.error || 'Gagal memuat notifikasi');
        setNotifications([]);
        setNotificationsDisabled(false);
        return;
      }

      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      setNotificationsDisabled(Boolean(data?.disabled));
    } catch {
      setNotificationError('Gagal memuat notifikasi');
      setNotifications([]);
      setNotificationsDisabled(false);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleToggleNotifications = () => {
    const next = !showNotificationMenu;
    setShowNotificationMenu(next);
    setShowGuideMenu(false);
    setShowUserMenu(false);

    if (next) {
      fetchNotifications();
    }
  };

  const handleOpenNotification = (item: NotificationItem) => {
    if (!readNotificationIds.includes(item.id)) {
      setReadNotificationIds((prev) => [...prev, item.id]);
    }
    openSearchRoute(item.href);
  };

  const handleMarkAllNotificationsRead = () => {
    const allIds = notifications.map((item) => item.id);
    const merged = Array.from(new Set([...readNotificationIds, ...allIds]));
    setReadNotificationIds(merged);
  };

  return (
    <header className="h-20 flex items-center justify-between px-12 bg-white sticky top-0 z-10 rounded-b-3xl shadow-sm">
      <div className="flex-1 max-w-xl relative group search-bar-tour">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-green-500 transition-colors" 
            size={18} 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari fitur, produk, atau kategori..."
            className="w-full bg-slate-50 border border-slate-200 rounded-full py-2.5 pl-12 pr-4 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all font-sans"
          />
        </form>
        {searchQuery.trim() && (
          <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl p-3 z-50 max-h-[360px] overflow-y-auto">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 px-2 pb-2">
              Pencarian fitur, produk, kategori
            </p>

            {loadingSearchIndex && (
              <p className="px-2 py-2 text-sm text-slate-500">Memuat data pencarian...</p>
            )}

            {featureResults.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 px-2 pb-1">Fitur</p>
                {featureResults.map((item) => (
                  <button
                    key={`feature-${item.href}`}
                    onClick={() => openSearchRoute(item.href)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-green-50"
                  >
                    <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-400">Buka menu {item.label}</p>
                  </button>
                ))}
              </div>
            )}

            {productResults.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 px-2 pb-1">Produk</p>
                {productResults.map((item) => (
                  <button
                    key={`product-${item._id}`}
                    onClick={() => openSearchRoute(`/products?search=${encodeURIComponent(searchQuery.trim())}`)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-green-50"
                  >
                    <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                    <p className="text-xs text-slate-400">SKU {item.sku} - {item.category}</p>
                  </button>
                ))}
              </div>
            )}

            {categoryResults.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 px-2 pb-1">Kategori</p>
                {categoryResults.map((item) => (
                  <button
                    key={`category-${item._id}`}
                    onClick={() => openSearchRoute(`/categories?search=${encodeURIComponent(searchQuery.trim())}`)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-green-50"
                  >
                    <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.description || 'Tanpa deskripsi'}</p>
                  </button>
                ))}
              </div>
            )}

            {!loadingSearchIndex && featureResults.length === 0 && productResults.length === 0 && categoryResults.length === 0 && (
              <p className="px-2 py-2 text-sm text-slate-500">
                Tidak ada hasil. Tekan Enter untuk mencari produk dengan kata kunci ini.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 text-slate-500">
        <div className="relative">
          <button
            onClick={() => {
              setShowGuideMenu((prev) => !prev);
              setShowNotificationMenu(false);
              setShowUserMenu(false);
            }}
            className="hover:text-green-600 transition-colors p-2 hover:bg-green-50 rounded-full group"
          >
            <HelpCircle size={22} />
          </button>
          {showGuideMenu && (
            <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 flex flex-col gap-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={startTour}
                className="flex items-center gap-3 px-4 py-2 hover:bg-green-50 rounded-xl text-slate-600 hover:text-green-600 group transition-all text-sm font-medium"
              >
                <Play size={16} fill="currentColor" />
                Putar Panduan Lagi
              </button>
              <div className="h-px bg-slate-100 my-1 mx-2"></div>
              <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Langkah Penggunaan</div>
              <div className="px-4 py-2 space-y-3 font-sans">
                <div className="flex gap-3 items-start">
                  <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">1</div>
                  <p className="text-[11px] leading-relaxed text-slate-500">Gunakan pencarian untuk menemukan fitur, produk, atau kategori.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">2</div>
                  <p className="text-[11px] leading-relaxed text-slate-500">Pantau notifikasi untuk stok menipis dan transaksi terbaru.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">3</div>
                  <p className="text-[11px] leading-relaxed text-slate-500">Isi transaksi pemasukan di menu Keuangan untuk membentuk grafik penjualan.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={handleToggleNotifications}
            className="hover:text-green-600 transition-colors p-2 hover:bg-green-50 rounded-full relative notification-tour"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotificationMenu && (
            <div className="absolute right-0 top-12 w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 flex flex-col gap-2 max-h-[420px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Notifikasi</p>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllNotificationsRead}
                    className="text-[11px] font-bold text-green-600 hover:underline"
                  >
                    Tandai Semua Dibaca
                  </button>
                )}
              </div>

              {loadingNotifications && <p className="text-sm text-slate-500 px-2 py-3">Memuat notifikasi...</p>}
              {notificationError && <p className="text-sm text-red-600 px-2 py-3">{notificationError}</p>}
              {!loadingNotifications && !notificationError && notificationsDisabled && (
                <p className="text-sm text-slate-500 px-2 py-3">Notifikasi dimatikan di Pengaturan.</p>
              )}
              {!loadingNotifications && !notificationError && !notificationsDisabled && notifications.length === 0 && (
                <p className="text-sm text-slate-500 px-2 py-3">Belum ada notifikasi baru.</p>
              )}

              <div className="overflow-y-auto">
                {!loadingNotifications && !notificationError && !notificationsDisabled && notifications.map((item) => {
                  const isUnread = !readNotificationIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleOpenNotification(item)}
                      className={`w-full text-left px-3 py-3 rounded-xl border mb-2 transition-colors ${
                        isUnread
                          ? 'bg-green-50 border-green-100 hover:bg-green-100'
                          : 'bg-white border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-sm font-bold ${item.level === 'warning' ? 'text-amber-700' : 'text-slate-700'}`}>
                          {item.title}
                        </p>
                        {isUnread && <span className="w-2 h-2 rounded-full bg-green-500" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.message}</p>
                      <p className="text-[10px] font-semibold text-slate-400 mt-2">{formatRelativeDatetime(item.createdAt)}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <div 
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowGuideMenu(false);
              setShowNotificationMenu(false);
            }}
            className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 cursor-pointer hover:ring-2 hover:ring-green-300 transition-all nav-user-tour"
          >
            <User size={22} />
          </div>
          {showUserMenu && (
            <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 flex flex-col gap-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
               <div className="px-3 py-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Akun Terhubung</p>
                  <p className="font-bold text-slate-800 truncate">{userEmail}</p>
               </div>
               <div className="h-px bg-slate-50"></div>
               <button 
                onClick={() => { router.push('/settings'); setShowUserMenu(false); }}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-slate-600 group transition-all text-sm font-semibold"
               >
                 <Settings size={18} className="text-slate-400 group-hover:text-green-600" />
                 Pengaturan Profil
               </button>
               <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-xl text-red-600 group transition-all text-sm font-bold"
               >
                 <LogOut size={18} className="text-red-400 group-hover:scale-110 transition-transform" />
                 Keluar Aplikasi
               </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
